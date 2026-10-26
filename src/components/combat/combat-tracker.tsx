"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  Dices,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Heart,
  Shield,
  Plus,
  Minus,
  Trash2,
  Flag,
  Skull,
  ShieldPlus,
  BookOpen,
  Search,
  Zap,
  ZapOff,
  ScrollText,
  ChevronDown,
  ChevronUp,
  Users,
  Pencil,
  Tag,
  Crown,
  Castle,
  Undo2,
  Ungroup,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CheckboxGroup } from "@/components/shared/checkbox-group";
import { Field } from "@/components/shared/form";
import { HpBar } from "@/components/shared/hp-bar";
import { Slider } from "@/components/ui/slider";
import { COMBAT_LOG_ADDED_EVENT, rollDice } from "@/components/dice/dice-roller";
import { api } from "@/lib/client";
import { CONDITIONS, EXHAUSTION_EFFECTS } from "@/lib/constants";
import {
  conditionName,
  conditionTimer,
  tickConditions,
  type ConditionEntry,
  type ConditionExpiry,
} from "@/lib/conditions";
import { rollDie } from "@/lib/dnd";
import { cn } from "@/lib/utils";
import { rateEncounter, difficultyKey, DIFFICULTY_STYLES } from "@/lib/encounter";
import {
  currentSlotIndex,
  keepGroupsTogether,
  pointerForSlot,
  sortByInitiative as sortForInitiative,
  turnSlots,
  type TurnSlot,
} from "@/lib/combat-turns";
import { useT } from "@/components/i18n/i18n-provider";
import { portraitKey } from "@/lib/portrait-key";
import type { CombatParticipant, CombatLogEntry, Encounter } from "@/db/schema";

export type Addable = {
  id: number;
  name: string;
  hpMax: number;
  hpCurrent: number;
  armorClass: number;
  initiativeMod: number;
  type: "character" | "npc";
  /** Challenge rating, shown in the Bestiary picker. */
  cr?: string;
};

type EncounterWithParts = Encounter & { participants: CombatParticipant[] };

/** What "Add combatant" hands back — everything needed to create the rows. */
type AddInput = {
  name: string;
  hpMax: number;
  armorClass: number;
  initiativeMod?: number;
  entityId?: number;
  entityType?: "character" | "npc";
  /** Add this many copies at once, auto-numbered (Goblin 1, Goblin 2, …). */
  count?: number;
  /** With count > 1: one initiative entry and one turn for the whole pack. */
  group?: boolean;
};

/** Portrait URL by `portraitKey`, for the avatars on initiative rows. */
const PortraitsContext = createContext<Record<string, string>>({});

function Avatar({ participant: p }: { participant: CombatParticipant }) {
  const portraits = useContext(PortraitsContext);
  const key = portraitKey(p.entityType, p.entityId);
  const url = key ? portraits[key] : undefined;
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="size-7 shrink-0 rounded-full border border-border object-cover"
    />
  );
}

/** The dnd-kit id for a turn slot: a group drags as one row. */
function slotKey(slot: Extract<TurnSlot, { kind: "creatures" }>, parts: CombatParticipant[]) {
  const lead = parts[slot.start];
  return lead.groupId ? `g:${lead.groupId}` : lead.id;
}

/**
 * Keep every combatant's name distinct so the DM can always tell which goblin
 * is which: "Goblin" → "Goblin 2", "Goblin 3"… An existing trailing number is
 * counted from rather than stacked on ("Goblin 2" never becomes "Goblin 2 2").
 */
function uniqueName(base: string, taken: Set<string>) {
  if (!taken.has(base)) return base;
  const match = base.match(/^(.*?)\s*(\d+)$/);
  const stem = match ? match[1] : base;
  let n = match ? Number(match[2]) + 1 : 2;
  while (taken.has(`${stem} ${n}`)) n++;
  return `${stem} ${n}`;
}

export function CombatTracker({
  encounter,
  addableCharacters,
  addableNpcs,
  addableBestiary,
  partyLevels = {},
  npcXp = {},
  portraits = {},
}: {
  encounter: EncounterWithParts;
  addableCharacters: Addable[];
  addableNpcs: Addable[];
  addableBestiary: Addable[];
  /** Character id → level, for rating the fight. */
  partyLevels?: Record<number, number>;
  /** NPC/monster id → XP, for rating the fight. */
  npcXp?: Record<number, number>;
  /** Portrait URL by `portraitKey`. */
  portraits?: Record<string, string>;
}) {
  const router = useRouter();
  const [parts, setParts] = useState<CombatParticipant[]>(
    keepGroupsTogether([...encounter.participants].sort((a, b) => a.turnOrder - b.turnOrder)),
  );
  const [round, setRound] = useState(encounter.roundNumber);
  const [turnIndex, setTurnIndex] = useState(encounter.currentTurnIndex);
  const [lairActive, setLairActive] = useState(encounter.lairTurnActive);
  const t = useT();
  const [endOpen, setEndOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<CombatLogEntry[]>([]);
  const [logOpen, setLogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Mirror of `parts` for synchronous reads while the +/- HP steppers fire in
  // rapid succession (so each press computes from the freshest HP).
  const partsRef = useRef(parts);
  useEffect(() => {
    partsRef.current = parts;
  }, [parts]);

  // Load this encounter's existing combat log so it survives reloads, and
  // reload it when the global dice roller logs a roll against this encounter.
  useEffect(() => {
    function reload() {
      api
        .get<CombatLogEntry[]>(`/api/combat-log?encounterId=${encounter.id}`)
        .then(setLogEntries)
        .catch(() => {});
    }
    reload();
    window.addEventListener(COMBAT_LOG_ADDED_EVENT, reload);
    return () => window.removeEventListener(COMBAT_LOG_ADDED_EVENT, reload);
  }, [encounter.id]);

  // Per-participant debounced HP persistence: a long press updates the UI on
  // every tick but only writes the final value to the server.
  const hpSaveTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const timers = hpSaveTimers.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  // Effective HP (current + temp) at the start of a burst of edits, so a run of
  // damage/heal is logged once with its net total instead of per +/- tap.
  const hpBaseline = useRef(new Map<number, number>());
  function markHpBaseline(id: number) {
    if (!hpBaseline.current.has(id)) {
      const p = partsRef.current.find((x) => x.id === id);
      if (p) hpBaseline.current.set(id, p.hpCurrent + p.hpTemp);
    }
  }

  function logHpDelta(name: string, delta: number) {
    if (delta < 0) addLogEntry("", `${-delta} dmg to ${name}`, "");
    else if (delta > 0) addLogEntry("", `${delta} HP restored to ${name}`, "");
  }

  function scheduleHpSave(id: number, patch: Partial<CombatParticipant>) {
    const timers = hpSaveTimers.current;
    const existing = timers.get(id);
    if (existing) clearTimeout(existing);
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        // Auto-log the net HP change from this burst of edits to the combat log.
        const base = hpBaseline.current.get(id);
        hpBaseline.current.delete(id);
        if (base !== undefined) {
          const p = partsRef.current.find((x) => x.id === id);
          if (p) logHpDelta(p.name, p.hpCurrent + p.hpTemp - base);
        }
        api.patch(`/api/participants/${id}`, patch).catch(() =>
          toast.error("Failed to save HP"),
        );
      }, 400),
    );
  }

  /** Set current HP to an absolute value (used by the HP slider). */
  function setHpCurrent(id: number, value: number) {
    const p = partsRef.current.find((x) => x.id === id);
    if (!p) return;
    const hpCurrent = Math.max(0, Math.min(p.hpMax, Math.round(value)));
    if (hpCurrent === p.hpCurrent) return;
    markHpBaseline(id);
    const next = partsRef.current.map((x) =>
      x.id === id ? { ...x, hpCurrent } : x,
    );
    partsRef.current = next;
    setParts(next);
    scheduleHpSave(id, { hpCurrent });
  }

  /** Apply a signed HP delta (negative = damage, positive = heal). */
  function adjustHp(id: number, delta: number) {
    const p = partsRef.current.find((x) => x.id === id);
    if (!p) return;
    markHpBaseline(id);
    let hpCurrent = p.hpCurrent;
    let hpTemp = p.hpTemp;
    if (delta < 0) {
      let dmg = -delta;
      if (hpTemp > 0) {
        const absorbed = Math.min(hpTemp, dmg);
        hpTemp -= absorbed;
        dmg -= absorbed;
      }
      hpCurrent = Math.max(0, hpCurrent - dmg);
    } else {
      hpCurrent = Math.min(p.hpMax, hpCurrent + delta);
    }
    if (hpCurrent === p.hpCurrent && hpTemp === p.hpTemp) return;
    // Concentration check warning
    if (delta < 0 && p.concentrationSpell) {
      const dmgDealt = p.hpCurrent - hpCurrent + (p.hpTemp - hpTemp);
      const dc = Math.max(10, Math.floor(dmgDealt / 2));
      toast.warning(
        `${p.name} is concentrating on ${p.concentrationSpell}! CON save DC ${dc}`,
        { duration: 6000 },
      );
    }
    const next = partsRef.current.map((x) =>
      x.id === id ? { ...x, hpCurrent, hpTemp } : x,
    );
    partsRef.current = next;
    setParts(next);
    scheduleHpSave(id, { hpCurrent, hpTemp });
  }

  function patchLocal(id: number, patch: Partial<CombatParticipant>) {
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function savePart(id: number, patch: Partial<CombatParticipant>) {
    patchLocal(id, patch);
    // Keep the ref current too, so several saves in one tick (a turn change
    // touching reactions and condition timers) each see the last one's result.
    partsRef.current = partsRef.current.map((p) => (p.id === id ? { ...p, ...patch } : p));
    try {
      await api.patch(`/api/participants/${id}`, patch);
    } catch {
      toast.error("Failed to save change");
    }
  }

  async function saveEncounter(patch: Partial<Encounter>) {
    try {
      await api.patch(`/api/encounters/${encounter.id}`, patch);
    } catch {
      toast.error("Failed to update encounter");
    }
  }

  async function addParticipant(input: AddInput) {
    const count = Math.max(1, Math.min(30, Math.round(input.count ?? 1)));
    const base = input.name.trim() || "Combatant";
    const taken = new Set(partsRef.current.map((p) => p.name));
    const groupId = input.group && count > 1 ? crypto.randomUUID() : null;

    const payloads = Array.from({ length: count }, (_, i) => {
      // A batch is numbered from 1; a single add keeps the plain name unless
      // that name is already in the fight.
      const name = uniqueName(count > 1 ? `${base} ${i + 1}` : base, taken);
      taken.add(name);
      return {
        encounterId: encounter.id,
        name,
        hpMax: input.hpMax,
        hpCurrent: input.hpMax,
        armorClass: input.armorClass,
        initiativeMod: input.initiativeMod ?? 0,
        entityId: input.entityId ?? null,
        entityType: input.entityType ?? null,
        turnOrder: partsRef.current.length + i,
        groupId,
        groupLabel: groupId ? base : null,
      };
    });

    try {
      const created = await api.post<CombatParticipant[]>("/api/participants", payloads);
      const next = [...partsRef.current, ...created];
      partsRef.current = next;
      setParts(next);
      toast.success(
        created.length > 1
          ? `Added ${created.length} × ${base}`
          : `Added ${created[0]?.name ?? base}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add combatant");
    }
  }

  /** Add every player character not already in this encounter, in one request. */
  async function addParty() {
    const present = new Set(
      parts.filter((p) => p.entityType === "character").map((p) => p.entityId),
    );
    const missing = addableCharacters.filter((c) => !present.has(c.id));
    if (missing.length === 0) {
      toast.info("All player characters are already in this encounter");
      return;
    }
    try {
      const payloads = missing.map((c, i) => ({
        encounterId: encounter.id,
        name: c.name,
        hpMax: c.hpMax,
        hpCurrent: c.hpCurrent > 0 ? c.hpCurrent : c.hpMax,
        armorClass: c.armorClass,
        initiativeMod: c.initiativeMod,
        entityId: c.id,
        entityType: "character" as const,
        turnOrder: parts.length + i,
      }));
      const created = await api.post<CombatParticipant[]>("/api/participants", payloads);
      setParts((prev) => [...prev, ...created]);
      toast.success(`Added ${created.length} player character${created.length > 1 ? "s" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add party");
    }
  }

  async function removeParticipant(id: number) {
    setParts((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.delete(`/api/participants/${id}`);
    } catch {
      toast.error("Failed to remove combatant");
    }
  }

  async function persistOrder(ordered: CombatParticipant[]) {
    await Promise.all(
      ordered.map((p, i) =>
        p.turnOrder === i
          ? Promise.resolve()
          : api.patch(`/api/participants/${p.id}`, { turnOrder: i }),
      ),
    ).catch(() => toast.error("Failed to save order"));
  }

  /** Rows are dragged a slot at a time, so a group moves as one block. */
  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const creatureSlots = slots.filter(
      (s): s is Extract<TurnSlot, { kind: "creatures" }> => s.kind === "creatures",
    );
    const keys = creatureSlots.map((s) => slotKey(s, parts));
    const oldIndex = keys.indexOf(active.id as string | number);
    const newIndex = keys.indexOf(over.id as string | number);
    if (oldIndex === -1 || newIndex === -1) return;
    const byId = new Map(parts.map((p) => [p.id, p]));
    const reordered = arrayMove(creatureSlots, oldIndex, newIndex)
      .flatMap((s) => s.ids.map((id) => byId.get(id)!))
      .map((p, i) => ({ ...p, turnOrder: i }));
    setParts(reordered);
    persistOrder(reordered);
  }

  function rollAll() {
    // Players roll their own initiative at the table — the DM types those in.
    // This rolls only NPCs/monsters (d20 + their initiative modifier), leaving
    // any player-entered values untouched, then sorts everyone together.
    // A minion group rolls once and the whole pack acts on that count.
    const groupRolls = new Map<string, number>();
    const rolled = sortForInitiative(
      parts.map((p) => {
        if (p.entityType === "character") return { ...p };
        let roll = rollDie(20);
        if (p.groupId) {
          roll = groupRolls.get(p.groupId) ?? roll;
          groupRolls.set(p.groupId, roll);
        }
        return { ...p, initiativeRoll: roll, initiativeTotal: roll + p.initiativeMod };
      }),
    ).map((p, i) => ({ ...p, turnOrder: i }));
    setParts(rolled);
    // Round one starts at the top of the new order — which is the lair row
    // when every creature rolled under 20.
    const start = pointerForSlot(turnSlots(rolled), 0);
    setTurnIndex(start.currentTurnIndex);
    setLairActive(start.lairTurnActive);
    setRound(1);
    Promise.all(
      rolled.map((p) =>
        api.patch(`/api/participants/${p.id}`, {
          initiativeRoll: p.initiativeRoll,
          initiativeTotal: p.initiativeTotal,
          turnOrder: p.turnOrder,
        }),
      ),
    ).catch(() => toast.error("Failed to save initiative"));
    saveEncounter({ ...start, roundNumber: 1 });
    toast.success("Rolled initiative for NPCs & monsters");
  }

  /** A group shares one initiative, so setting it on one member sets them all. */
  function setInitiative(id: number, total: number) {
    const p = partsRef.current.find((x) => x.id === id);
    const ids = p?.groupId
      ? partsRef.current.filter((x) => x.groupId === p.groupId).map((x) => x.id)
      : [id];
    for (const memberId of ids) savePart(memberId, { initiativeTotal: total });
  }

  /** Split a group back into ordinary combatants, each with its own turn. */
  function ungroup(groupId: string) {
    for (const p of partsRef.current) {
      if (p.groupId === groupId) savePart(p.id, { groupId: null, groupLabel: null });
    }
  }

  function setInitiativeMod(id: number, mod: number) {
    savePart(id, { initiativeMod: mod });
  }

  function sortByInitiative() {
    const sorted = sortForInitiative(parts).map((p, i) => ({ ...p, turnOrder: i }));
    setParts(sorted);
    persistOrder(sorted);
  }

  const slots = turnSlots(parts);
  const currentSlot = currentSlotIndex(slots, turnIndex, lairActive);

  /**
   * Count down timed conditions at the start or end of these creatures' turn,
   * dropping (and logging) the ones that run out.
   */
  function tickTimers(ids: number[], phase: "startOfTurn" | "endOfTurn") {
    for (const id of ids) {
      const p = partsRef.current.find((x) => x.id === id);
      if (!p) continue;
      const { next, expired } = tickConditions(p.conditions, phase);
      if (next === p.conditions) continue;
      savePart(id, { conditions: next });
      for (const name of expired) addLogEntry(p.name, `${name} ends`, "");
    }
  }

  /**
   * Start-of-turn bookkeeping for the creatures whose turn just began: spent
   * legendary actions come back, so does the reaction, and start-of-turn
   * condition timers tick.
   */
  function startTurnFor(ids: number[]) {
    for (const id of ids) {
      const p = partsRef.current.find((x) => x.id === id);
      if (!p) continue;
      const patch: Partial<CombatParticipant> = {};
      if (p.legendaryActionsUsed > 0) patch.legendaryActionsUsed = 0;
      if (!p.reactionAvailable) patch.reactionAvailable = true;
      if (Object.keys(patch).length > 0) savePart(id, patch);
    }
    tickTimers(ids, "startOfTurn");
  }

  function goToSlot(slotIndex: number, r: number) {
    const pointer = pointerForSlot(slots, slotIndex);
    setTurnIndex(pointer.currentTurnIndex);
    setLairActive(pointer.lairTurnActive);
    if (r !== round) setRound(r);
    saveEncounter({ ...pointer, roundNumber: r });
  }

  function nextTurn() {
    if (slots.length === 0) return;
    let next = currentSlot + 1;
    let r = round;
    if (next >= slots.length) {
      next = 0;
      r = round + 1;
    }
    const leaving = slots[currentSlot];
    if (leaving?.kind === "creatures") tickTimers(leaving.ids, "endOfTurn");
    const slot = slots[next];
    if (slot.kind === "creatures") startTurnFor(slot.ids);
    goToSlot(next, r);
  }

  /** Steps the pointer back only — nothing that a turn start reset is undone. */
  function prevTurn() {
    if (slots.length === 0) return;
    let prev = currentSlot - 1;
    let r = round;
    if (prev < 0) {
      if (round > 1) {
        prev = slots.length - 1;
        r = round - 1;
      } else {
        prev = 0;
      }
    }
    goToSlot(prev, r);
  }

  function spendLegendary(id: number) {
    const p = partsRef.current.find((x) => x.id === id);
    if (!p || p.legendaryActionsUsed >= p.legendaryActionsMax) return;
    const used = p.legendaryActionsUsed + 1;
    savePart(id, { legendaryActionsUsed: used });
    addLogEntry(p.name, "Legendary action", `${p.legendaryActionsMax - used}/${p.legendaryActionsMax} left`);
  }

  function refundLegendary(id: number) {
    const p = partsRef.current.find((x) => x.id === id);
    if (!p || p.legendaryActionsUsed <= 0) return;
    savePart(id, { legendaryActionsUsed: p.legendaryActionsUsed - 1 });
  }

  function toggleReaction(id: number) {
    const p = partsRef.current.find((x) => x.id === id);
    if (!p) return;
    const reactionAvailable = !p.reactionAvailable;
    savePart(id, { reactionAvailable });
    if (!reactionAvailable) addLogEntry(p.name, "Reaction", "");
  }

  const rowHandlers: RowHandlers = {
    onSave: savePart,
    onAdjustHp: adjustHp,
    onSetHpCurrent: setHpCurrent,
    onRemove: removeParticipant,
    onSetInitiative: setInitiative,
    onSetInitiativeMod: setInitiativeMod,
    onSpendLegendary: spendLegendary,
    onRefundLegendary: refundLegendary,
    onToggleReaction: toggleReaction,
  };

  async function endEncounter() {
    await api.patch(`/api/encounters/${encounter.id}`, { status: "completed" });
    toast.success("Encounter ended");
    router.refresh();
  }

  async function addLogEntry(actorName: string, action: string, details: string) {
    try {
      const entry = await api.post<CombatLogEntry>("/api/combat-log", {
        encounterId: encounter.id,
        round,
        actorName,
        action,
        details,
      });
      setLogEntries((prev) => [...prev, entry]);
    } catch {
      toast.error("Failed to log action");
    }
  }

  return (
    <PortraitsContext.Provider value={portraits}>
    <div className="space-y-5">
      {/* Control bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs uppercase text-muted-foreground">Round</p>
            <p className="font-heading text-2xl font-semibold tabular-nums">{round}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" onClick={prevTurn} aria-label="Previous turn">
              <ChevronLeft className="size-4" />
            </Button>
            <Button onClick={nextTurn}>
              Next turn <ChevronRight className="size-4" />
            </Button>
          </div>
          <LiveDifficulty parts={parts} partyLevels={partyLevels} npcXp={npcXp} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={rollAll}
            disabled={parts.length === 0}
            title="Rolls initiative for NPCs & monsters only — players type their own"
          >
            <Dices className="size-4" /> Roll NPCs
          </Button>
          <Button variant="outline" onClick={sortByInitiative} disabled={parts.length === 0}>
            Sort
          </Button>
          {addableCharacters.length > 0 ? (
            <Button variant="outline" onClick={addParty}>
              <Users className="size-4" /> Add party
            </Button>
          ) : null}
          <AddCombatantMenu
            characters={addableCharacters}
            npcs={addableNpcs}
            bestiary={addableBestiary}
            onAdd={addParticipant}
          />
          <Button variant="destructive" onClick={() => setEndOpen(true)}>
            <Flag className="size-4" /> End
          </Button>
        </div>
      </div>

      {/* Turn order */}
      {parts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 py-12 text-center">
          <p className="text-muted-foreground">No combatants yet.</p>
          <p className="text-sm text-muted-foreground">
            Add player characters, NPCs/monsters, or a quick creature to begin.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={slots.flatMap((s) => (s.kind === "creatures" ? [slotKey(s, parts)] : []))}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {slots.map((slot, si) => {
                if (slot.kind === "lair") {
                  return (
                    <LairRow
                      key="lair"
                      isCurrent={si === currentSlot}
                      onUse={() => addLogEntry(t("combat.lair"), t("combat.lairUsed"), "")}
                    />
                  );
                }
                const p = parts[slot.start];
                if (slot.ids.length > 1 && p.groupId) {
                  return (
                    <GroupRow
                      key={`g:${p.groupId}`}
                      sortId={`g:${p.groupId}`}
                      members={slot.ids.map((id) => parts.find((x) => x.id === id)!)}
                      isCurrent={si === currentSlot}
                      onSetInitiative={setInitiative}
                      onSetInitiativeMod={(mod) =>
                        slot.ids.forEach((id) => setInitiativeMod(id, mod))
                      }
                      onUngroup={() => ungroup(p.groupId!)}
                      rowHandlers={rowHandlers}
                    />
                  );
                }
                return (
                  <ParticipantRow
                    key={p.id}
                    participant={p}
                    isCurrent={si === currentSlot}
                    {...rowHandlers}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmDialog
        open={endOpen}
        onOpenChange={setEndOpen}
        title="End this encounter?"
        description="The encounter will be marked as completed. You can still view it afterwards."
        confirmLabel="End encounter"
        destructive
        onConfirm={endEncounter}
      />

      {/* Combat log */}
      <div className="rounded-xl border border-border bg-card">
        <button
          onClick={() => setLogOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 rounded-xl"
        >
          <span className="flex items-center gap-2">
            <ScrollText className="size-4 text-primary" /> Combat Log
            {logEntries.length > 0 && (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs text-primary">
                {logEntries.length}
              </span>
            )}
          </span>
          {logOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {logOpen && (
          <div className="border-t border-border p-4">
            <CombatLogPanel
              encounterId={encounter.id}
              round={round}
              participants={parts}
              entries={logEntries}
              onAdd={addLogEntry}
            />
          </div>
        )}
      </div>
    </div>
    </PortraitsContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The running fight rated the same way the Encounter Builder rates a planned
 * one, so the DM can see at a glance whether reinforcements tipped it over.
 */
function LiveDifficulty({
  parts,
  partyLevels,
  npcXp,
}: {
  parts: CombatParticipant[];
  partyLevels: Record<number, number>;
  npcXp: Record<number, number>;
}) {
  const t = useT();
  const levels: number[] = [];
  const xps: number[] = [];
  for (const p of parts) {
    if (p.entityId == null) continue;
    if (p.entityType === "character" && partyLevels[p.entityId]) {
      levels.push(partyLevels[p.entityId]);
    } else if (p.entityType === "npc" && npcXp[p.entityId]) {
      xps.push(npcXp[p.entityId]);
    }
  }
  if (levels.length === 0 || xps.length === 0) return null;
  const rating = rateEncounter(xps, levels);
  const th = rating.thresholds;
  return (
    <div
      className="hidden text-center sm:block"
      title={`${t("encounter.liveHint")}
${t("difficulty.easy")} ${th.easy} · ${t("difficulty.medium")} ${th.medium} · ${t("difficulty.hard")} ${th.hard} · ${t("difficulty.deadly")} ${th.deadly}`}
    >
      <p className="text-xs uppercase text-muted-foreground">{t("encounter.difficulty")}</p>
      <p className={cn("text-sm font-semibold", DIFFICULTY_STYLES[rating.difficulty])}>
        {t(difficultyKey(rating.difficulty))}
        <span className="ml-1 font-normal text-muted-foreground tabular-nums">
          {rating.adjustedXp.toLocaleString()} XP
        </span>
      </p>
    </div>
  );
}

type RowHandlers = {
  onSave: (id: number, patch: Partial<CombatParticipant>) => void;
  onAdjustHp: (id: number, delta: number) => void;
  onSetHpCurrent: (id: number, value: number) => void;
  onRemove: (id: number) => void;
  onSetInitiative: (id: number, total: number) => void;
  onSetInitiativeMod: (id: number, mod: number) => void;
  onSpendLegendary: (id: number) => void;
  onRefundLegendary: (id: number) => void;
  onToggleReaction: (id: number) => void;
};

/**
 * A minion group: one initiative and one turn for the whole pack, collapsed to
 * a single "5× Goblin" row. Expanding it shows each member as an ordinary row
 * so any one of them can still be hit, healed or given a condition.
 */
function GroupRow({
  sortId,
  members,
  isCurrent,
  onSetInitiative,
  onSetInitiativeMod,
  onUngroup,
  rowHandlers,
}: {
  sortId: string;
  members: CombatParticipant[];
  isCurrent: boolean;
  onSetInitiative: (id: number, total: number) => void;
  onSetInitiativeMod: (mod: number) => void;
  onUngroup: () => void;
  rowHandlers: RowHandlers;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sortId });
  const lead = members[0];
  const down = members.filter((m) => m.hpCurrent <= 0).length;
  const up = members.length - down;
  const hpNow = members.reduce((n, m) => n + m.hpCurrent, 0);
  const hpMax = members.reduce((n, m) => n + m.hpMax, 0);
  const label = lead.groupLabel || lead.name;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl border bg-card p-3 transition-colors",
        isCurrent ? "border-primary ring-1 ring-primary/40" : "border-border",
        isDragging && "opacity-60",
        up === 0 && "opacity-70",
      )}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-5" />
        </button>
        <div className="flex items-center gap-1">
          <div className="flex w-12 flex-col items-center">
            <span className="text-[10px] uppercase text-muted-foreground">Init</span>
            <Input
              value={lead.initiativeTotal}
              onChange={(e) => onSetInitiative(lead.id, Number(e.target.value || 0))}
              className="h-8 w-11 px-1 text-center text-sm tabular-nums"
              aria-label={t("combat.groupInit")}
            />
          </div>
          <div className="flex w-11 flex-col items-center">
            <span className="text-[10px] uppercase text-muted-foreground">Mod</span>
            <Input
              type="number"
              value={lead.initiativeMod}
              onChange={(e) => onSetInitiativeMod(Number(e.target.value || 0))}
              className="h-8 w-11 px-1 text-center text-sm tabular-nums"
              aria-label={t("combat.groupMod")}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {expanded ? (
            <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          )}
          <Avatar participant={lead} />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium">
                {members.length}× {label}
              </span>
              {isCurrent ? <Badge className="bg-primary text-primary-foreground">Turn</Badge> : null}
            </span>
            <span className="block text-xs text-muted-foreground">
              {t("combat.groupSummary")
                .replace("{up}", String(up))
                .replace("{down}", String(down))}
              {" · "}
              <span className="tabular-nums">HP {hpNow}/{hpMax}</span>
            </span>
          </span>
        </button>
        <div className="hidden w-44 sm:block">
          <HpBar current={hpNow} max={hpMax} />
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-muted-foreground"
          onClick={onUngroup}
          aria-label={t("combat.ungroup")}
          title={t("combat.ungroup")}
        >
          <Ungroup className="size-4" />
        </Button>
      </div>
      {expanded ? (
        <div className="mt-3 space-y-2 border-l-2 border-primary/30 pl-3">
          {members.map((m) => (
            <ParticipantRow key={m.id} participant={m} isCurrent={false} nested {...rowHandlers} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ParticipantRow({
  participant: p,
  isCurrent,
  nested = false,
  onSave,
  onAdjustHp,
  onSetHpCurrent,
  onRemove,
  onSetInitiative,
  onSetInitiativeMod,
  onSpendLegendary,
  onRefundLegendary,
  onToggleReaction,
}: {
  participant: CombatParticipant;
  isCurrent: boolean;
  onSave: (id: number, patch: Partial<CombatParticipant>) => void;
  onAdjustHp: (id: number, delta: number) => void;
  onSetHpCurrent: (id: number, value: number) => void;
  onRemove: (id: number) => void;
  onSetInitiative: (id: number, total: number) => void;
  onSetInitiativeMod: (id: number, mod: number) => void;
  onSpendLegendary: (id: number) => void;
  onRefundLegendary: (id: number) => void;
  onToggleReaction: (id: number) => void;
  /** A member shown inside an expanded group: no drag handle or initiative. */
  nested?: boolean;
}) {
  // Players type their own initiative; NPCs/monsters get a modifier the DM can
  // set, which "Roll NPCs" uses.
  const isNpc = p.entityType !== "character";
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: p.id, disabled: nested });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isDown = p.hpCurrent <= 0;
  const isBloodied = !isDown && p.hpMax > 0 && p.hpCurrent <= p.hpMax / 2;
  const showDeathSaves = isDown && p.entityType === "character";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl border bg-card p-3 transition-colors",
        isCurrent ? "border-primary ring-1 ring-primary/40" : "border-border",
        isDragging && "opacity-60",
        isDown && "opacity-90",
      )}
    >
      <div className="flex items-center gap-3">
        {nested ? null : (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-5" />
        </button>
        )}

        {/* Initiative (total for everyone; editable modifier for NPCs) */}
        {nested ? null : (
        <div className="flex items-center gap-1">
          <div className="flex w-12 flex-col items-center">
            <span className="text-[10px] uppercase text-muted-foreground">Init</span>
            <Input
              value={p.initiativeTotal}
              onChange={(e) => onSetInitiative(p.id, Number(e.target.value || 0))}
              className="h-8 w-11 px-1 text-center text-sm tabular-nums"
              title="Initiative total — players type their own roll here"
            />
          </div>
          {isNpc ? (
            <div className="flex w-11 flex-col items-center">
              <span className="text-[10px] uppercase text-muted-foreground">Mod</span>
              <Input
                type="number"
                value={p.initiativeMod}
                onChange={(e) => onSetInitiativeMod(p.id, Number(e.target.value || 0))}
                className="h-8 w-11 px-1 text-center text-sm tabular-nums"
                title="Initiative modifier — added to the d20 when you roll NPCs"
              />
            </div>
          ) : null}
        </div>
        )}

        <Avatar participant={p} />

        {/* Name + status */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <EditableName participant={p} isDown={isDown} onSave={onSave} />
            {isCurrent ? <Badge className="bg-primary text-primary-foreground">Turn</Badge> : null}
            {isDown ? (
              <Badge variant="destructive" className="gap-1">
                <Skull className="size-3" /> Down
              </Badge>
            ) : null}
            {isBloodied ? (
              <Badge className="bg-orange-500/20 text-orange-300">Bloodied</Badge>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {p.conditions.map((c) => (
              <ConditionBadge key={conditionName(c)} entry={c} />
            ))}
            {p.exhaustionLevel > 0 ? (
              <Badge className="bg-destructive/20 text-red-200 text-xs">Exhaustion {p.exhaustionLevel}</Badge>
            ) : null}
            {p.concentrationSpell ? (
              <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/20 text-xs gap-1">
                <Zap className="size-2.5" /> {p.concentrationSpell}
              </Badge>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <ReactionToggle participant={p} onToggle={onToggleReaction} />
            {p.legendaryActionsMax > 0 ? (
              <LegendaryPips
                participant={p}
                onSpend={onSpendLegendary}
                onRefund={onRefundLegendary}
              />
            ) : null}
            {p.hasLairAction ? <LairBadge /> : null}
          </div>
        </div>

        {/* HP + AC */}
        <div className="hidden w-44 sm:block">
          <HpBar current={p.hpCurrent} max={p.hpMax} temp={p.hpTemp} />
          {p.hpMax > 0 ? (
            <Slider
              className="mt-2"
              value={[Math.min(p.hpCurrent, p.hpMax)]}
              min={0}
              max={p.hpMax}
              step={1}
              onValueChange={([v]) => onSetHpCurrent(p.id, v)}
              aria-label={`Set ${p.name} HP`}
            />
          ) : null}
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Shield className="size-4 text-primary" /> {p.armorClass}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <HpStepper participantId={p.id} onAdjustHp={onAdjustHp} />
          <HpDialog participant={p} onSave={onSave} onAdjustHp={onAdjustHp} />
          <ConditionsDialog participant={p} onSave={onSave} />
          <ConcentrationDialog participant={p} onSave={onSave} />
          <BossDialog participant={p} onSave={onSave} />
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground"
            onClick={() =>
              rollDice({ formula: "1d20", label: `${p.name} d20`, actorName: p.name })
            }
            aria-label={`Roll a d20 for ${p.name}`}
            title="Roll a d20 for this combatant"
          >
            <Dices className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
            aria-label="Remove"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-2 sm:hidden">
        <HpBar current={p.hpCurrent} max={p.hpMax} temp={p.hpTemp} />
        {p.hpMax > 0 ? (
          <Slider
            className="mt-2"
            value={[Math.min(p.hpCurrent, p.hpMax)]}
            min={0}
            max={p.hpMax}
            step={1}
            onValueChange={([v]) => onSetHpCurrent(p.id, v)}
            aria-label={`Set ${p.name} HP`}
          />
        ) : null}
      </div>

      {showDeathSaves ? (
        <DeathSaves participant={p} onSave={onSave} />
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Remove ${p.name}?`}
        description="They will be removed from this encounter."
        confirmLabel="Remove"
        onConfirm={() => onRemove(p.id)}
      />
    </div>
  );
}

/**
 * The "Lair Actions" prompt at initiative 20. It isn't a creature — landing on
 * it is just the reminder to use one, and the button logs that you did.
 */
function LairRow({ isCurrent, onUse }: { isCurrent: boolean; onUse: () => void }) {
  const t = useT();
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-dashed bg-card/60 px-3 py-2.5",
        isCurrent ? "border-primary ring-1 ring-primary/40" : "border-border",
      )}
    >
      <div className="flex w-12 flex-col items-center">
        <span className="text-[10px] uppercase text-muted-foreground">Init</span>
        <span className="text-sm tabular-nums">20</span>
      </div>
      <Castle className="size-4 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{t("combat.lairRow")}</p>
        <p className="text-xs text-muted-foreground">{t("combat.lairHint")}</p>
      </div>
      {isCurrent ? <Badge className="bg-primary text-primary-foreground">Turn</Badge> : null}
      <Button size="sm" variant="outline" onClick={onUse}>
        {t("combat.lairUse")}
      </Button>
    </div>
  );
}

function LairBadge() {
  const t = useT();
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground" title={t("combat.hasLairHint")}>
      <Castle className="size-3" /> {t("combat.lair")}
    </span>
  );
}

/**
 * Legendary-action pips. Clicking spends one (they come back at the start of
 * the creature's own turn); the undo button gives one back after a misclick.
 */
function LegendaryPips({
  participant: p,
  onSpend,
  onRefund,
}: {
  participant: CombatParticipant;
  onSpend: (id: number) => void;
  onRefund: (id: number) => void;
}) {
  const t = useT();
  const left = p.legendaryActionsMax - p.legendaryActionsUsed;
  return (
    <div className="flex items-center gap-1" title={t("combat.legendaryHint")}>
      <Crown className="size-3 text-amber-400" />
      <span className="text-xs text-muted-foreground">{t("combat.legendary")}</span>
      {Array.from({ length: p.legendaryActionsMax }, (_, i) => {
        const available = i < left;
        return (
          <button
            key={i}
            type="button"
            disabled={!available}
            onClick={() => onSpend(p.id)}
            className={cn(
              "size-3.5 rounded-full border transition-colors",
              available
                ? "border-amber-400 bg-amber-400/80 hover:bg-amber-300"
                : "border-border bg-transparent",
            )}
            aria-label={`${t("combat.legendarySpend")} (${left}/${p.legendaryActionsMax})`}
          />
        );
      })}
      {p.legendaryActionsUsed > 0 ? (
        <button
          type="button"
          onClick={() => onRefund(p.id)}
          className="ml-0.5 text-muted-foreground hover:text-foreground"
          aria-label={t("combat.legendaryRefund")}
          title={t("combat.legendaryRefund")}
        >
          <Undo2 className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

/** Reaction available / used. Resets at the start of the creature's turn. */
function ReactionToggle({
  participant: p,
  onToggle,
}: {
  participant: CombatParticipant;
  onToggle: (id: number) => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => onToggle(p.id)}
      aria-pressed={!p.reactionAvailable}
      title={t("combat.reactionHint")}
      className={cn(
        "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] leading-none transition-colors",
        p.reactionAvailable
          ? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
          : "border-border text-muted-foreground line-through",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          p.reactionAvailable ? "bg-emerald-400" : "bg-muted-foreground",
        )}
      />
      {t("combat.reaction")}
    </button>
  );
}

/** Legendary-action count and lair flag, for boss fights. */
function BossDialog({
  participant: p,
  onSave,
}: {
  participant: CombatParticipant;
  onSave: (id: number, patch: Partial<CombatParticipant>) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [max, setMax] = useState(String(p.legendaryActionsMax));
  const [lair, setLair] = useState(p.hasLairAction);

  function save() {
    const legendaryActionsMax = Math.max(0, Math.min(10, Math.round(Number(max) || 0)));
    onSave(p.id, {
      legendaryActionsMax,
      legendaryActionsUsed: Math.min(p.legendaryActionsUsed, legendaryActionsMax),
      hasLairAction: lair,
    });
    setOpen(false);
  }

  const isBoss = p.legendaryActionsMax > 0 || p.hasLairAction;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setMax(String(p.legendaryActionsMax));
          setLair(p.hasLairAction);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn("size-8", isBoss ? "text-amber-400" : "text-muted-foreground")}
          aria-label={t("combat.bossSettings")}
          title={t("combat.bossSettings")}
        >
          <Crown className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{p.name} — {t("combat.bossSettings")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Field label={t("combat.legendaryPerRound")} hint={t("combat.legendaryPerRoundHint")}>
            <Input
              type="number"
              min={0}
              max={10}
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={lair}
              onChange={(e) => setLair(e.target.checked)}
              className="mt-0.5 accent-primary"
            />
            <span>
              {t("combat.hasLair")}
              <span className="block text-xs text-muted-foreground">{t("combat.hasLairHint")}</span>
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The combatant's name, renamed in place. Monsters land in the fight under their
 * template name ("Goblin 2"); clicking lets the DM call it whatever it is at the
 * table — "Jerry", "Goblin with the crossbow", "Boss".
 */
function EditableName({
  participant: p,
  isDown,
  onSave,
}: {
  participant: CombatParticipant;
  isDown: boolean;
  onSave: (id: number, patch: Partial<CombatParticipant>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p.name);

  function begin() {
    setDraft(p.name);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const name = draft.trim();
    if (!name || name === p.name) return;
    onSave(p.id, { name });
  }

  if (editing) {
    return (
      <Input
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        maxLength={120}
        className="h-7 w-44 px-2 text-sm font-medium"
        aria-label="Combatant name"
      />
    );
  }

  return (
    <button
      onClick={begin}
      title="Click to rename"
      className={cn(
        "group flex items-center gap-1.5 rounded px-1 -mx-1 text-left font-medium hover:bg-accent",
        isDown && "text-muted-foreground line-through",
      )}
    >
      {p.name}
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function DeathSaves({
  participant: p,
  onSave,
}: {
  participant: CombatParticipant;
  onSave: (id: number, patch: Partial<CombatParticipant>) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-4 rounded-lg bg-destructive/10 px-3 py-2">
      <span className="text-xs font-medium text-red-200">Death Saves</span>
      <Pips
        label="Successes"
        color="bg-success"
        count={p.deathSaveSuccesses}
        onChange={(n) => onSave(p.id, { deathSaveSuccesses: n })}
      />
      <Pips
        label="Failures"
        color="bg-destructive"
        count={p.deathSaveFailures}
        onChange={(n) => onSave(p.id, { deathSaveFailures: n })}
      />
    </div>
  );
}

function Pips({
  label,
  color,
  count,
  onChange,
}: {
  label: string;
  color: string;
  count: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {[1, 2, 3].map((i) => (
        <button
          key={i}
          onClick={() => onChange(count >= i ? i - 1 : i)}
          className={cn(
            "size-4 rounded-full border border-border transition-colors",
            count >= i ? color : "bg-transparent",
          )}
          aria-label={`${label} ${i}`}
        />
      ))}
    </div>
  );
}

/**
 * Quick HP +/- controls. A tap adjusts by 1; press-and-hold repeats in steps
 * of 5 so the DM can rip through big hits without spamming clicks.
 */
function HpStepper({
  participantId,
  onAdjustHp,
}: {
  participantId: number;
  onAdjustHp: (id: number, delta: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <HoldRepeatButton
        ariaLabel="Damage 1 (hold for faster)"
        className="text-muted-foreground hover:text-destructive"
        onStep={(magnitude) => onAdjustHp(participantId, -magnitude)}
      >
        <Minus className="size-4" />
      </HoldRepeatButton>
      <HoldRepeatButton
        ariaLabel="Heal 1 (hold for faster)"
        className="text-muted-foreground hover:text-success"
        onStep={(magnitude) => onAdjustHp(participantId, magnitude)}
      >
        <Plus className="size-4" />
      </HoldRepeatButton>
    </div>
  );
}

function HoldRepeatButton({
  onStep,
  ariaLabel,
  className,
  children,
}: {
  /** Called with 1 on a tap, and repeatedly with 5 while held. */
  onStep: (magnitude: number) => void;
  ariaLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const didRepeat = useRef(false);

  function clearTimers() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (repeatTimer.current) clearInterval(repeatTimer.current);
    holdTimer.current = null;
    repeatTimer.current = null;
  }

  function start(e: React.PointerEvent) {
    e.preventDefault();
    didRepeat.current = false;
    holdTimer.current = setTimeout(() => {
      didRepeat.current = true;
      onStep(5);
      repeatTimer.current = setInterval(() => onStep(5), 150);
    }, 400);
  }

  function end() {
    const wasTap = !didRepeat.current && holdTimer.current !== null;
    clearTimers();
    if (wasTap) onStep(1);
  }

  function cancel() {
    clearTimers();
  }

  useEffect(() => clearTimers, []);

  return (
    <Button
      size="icon"
      variant="ghost"
      className={cn("size-8", className)}
      aria-label={ariaLabel}
      onPointerDown={start}
      onPointerUp={end}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
    >
      {children}
    </Button>
  );
}

function HpDialog({
  participant: p,
  onSave,
  onAdjustHp,
}: {
  participant: CombatParticipant;
  onSave: (id: number, patch: Partial<CombatParticipant>) => void;
  onAdjustHp: (id: number, delta: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [temp, setTemp] = useState("");

  function apply(kind: "damage" | "heal") {
    const value = Math.abs(Number(amount || 0));
    if (!value) return;
    // Route through adjustHp so temp-HP absorption, concentration checks and
    // combat-log damage entries all apply consistently.
    onAdjustHp(p.id, kind === "damage" ? -value : value);
    setAmount("");
    setOpen(false);
  }

  function applyTemp() {
    const value = Math.max(0, Number(temp || 0));
    onSave(p.id, { hpTemp: value });
    setTemp("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="size-8" aria-label="Adjust HP">
          <Heart className="size-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{p.name} — HP</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <HpBar current={p.hpCurrent} max={p.hpMax} temp={p.hpTemp} />
          <div className="space-y-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="destructive" onClick={() => apply("damage")}>
                <Heart className="size-4" /> Damage
              </Button>
              <Button className="bg-success text-success-foreground hover:bg-success/90" onClick={() => apply("heal")}>
                <ShieldPlus className="size-4" /> Heal
              </Button>
            </div>
          </div>
          <Field label="Set temporary HP">
            <div className="flex gap-2">
              <Input type="number" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder={String(p.hpTemp)} />
              <Button variant="outline" onClick={applyTemp}>Set</Button>
            </div>
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** How a condition's timer reads on its badge: "Stunned · 1 (end)". */
function ConditionBadge({ entry }: { entry: ConditionEntry }) {
  const t = useT();
  const timer = conditionTimer(entry);
  const name = conditionName(entry);
  if (!timer) {
    return <Badge variant="secondary" className="text-xs">{name}</Badge>;
  }
  const when = t(expiryKey(timer.expiry));
  return (
    <Badge
      variant="secondary"
      className="gap-1 text-xs"
      title={
        timer.expiry === "endOfCombat"
          ? when
          : `${timer.rounds ?? 1} × ${when}`
      }
    >
      {name}
      <span className="text-muted-foreground tabular-nums">
        {timer.expiry === "endOfCombat" ? "∞" : `${timer.rounds ?? 1}`}
      </span>
    </Badge>
  );
}

function expiryKey(expiry: ConditionExpiry) {
  return expiry === "startOfTurn"
    ? ("conditions.startOfTurn" as const)
    : expiry === "endOfTurn"
      ? ("conditions.endOfTurn" as const)
      : ("conditions.endOfCombat" as const);
}

/** Per-condition timer being edited in the dialog. Blank rounds = no timer. */
type TimerDraft = { rounds: string; expiry: ConditionExpiry };

function ConditionsDialog({
  participant: p,
  onSave,
}: {
  participant: CombatParticipant;
  onSave: (id: number, patch: Partial<CombatParticipant>) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [conditions, setConditions] = useState<string[]>(p.conditions.map(conditionName));
  const [timers, setTimers] = useState<Record<string, TimerDraft>>({});
  const [exhaustion, setExhaustion] = useState(p.exhaustionLevel);

  function load() {
    setConditions(p.conditions.map(conditionName));
    const drafts: Record<string, TimerDraft> = {};
    for (const entry of p.conditions) {
      const timer = conditionTimer(entry);
      if (timer) {
        drafts[conditionName(entry)] = {
          rounds: timer.rounds ? String(timer.rounds) : "",
          expiry: timer.expiry,
        };
      }
    }
    setTimers(drafts);
    setExhaustion(p.exhaustionLevel);
  }

  function save() {
    // Untimed conditions stay plain strings, exactly as they always were.
    const entries: ConditionEntry[] = conditions.map((name) => {
      const draft = timers[name];
      if (!draft) return name;
      if (draft.expiry === "endOfCombat") return { name, expiry: "endOfCombat" };
      const rounds = Math.round(Number(draft.rounds));
      return rounds > 0 ? { name, rounds, expiry: draft.expiry } : name;
    });
    onSave(p.id, { conditions: entries, exhaustionLevel: exhaustion });
    setOpen(false);
  }

  function setTimer(name: string, patch: Partial<TimerDraft>) {
    setTimers((prev) => ({
      ...prev,
      [name]: { ...(prev[name] ?? { rounds: "", expiry: "endOfTurn" }), ...patch },
    }));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) load();
      }}
    >
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="size-8" aria-label="Conditions">
          <Plus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{p.name} — Conditions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <CheckboxGroup
            columns={2}
            options={[...new Set([...CONDITIONS, ...conditions])]}
            value={conditions}
            onChange={setConditions}
          />
          {conditions.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("conditions.duration")}</p>
              {conditions.map((name) => {
                const draft = timers[name];
                return (
                  <div key={name} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="w-28 truncate">{name}</span>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={draft?.expiry === "endOfCombat" ? "" : (draft?.rounds ?? "")}
                      disabled={draft?.expiry === "endOfCombat"}
                      onChange={(e) => setTimer(name, { rounds: e.target.value })}
                      placeholder="—"
                      className="h-8 w-16 text-center tabular-nums"
                      aria-label={`${name}: ${t("conditions.rounds")}`}
                    />
                    <span className="text-xs text-muted-foreground">{t("conditions.rounds")}</span>
                    <Select
                      value={draft?.expiry ?? "endOfTurn"}
                      onValueChange={(v) => setTimer(name, { expiry: v as ConditionExpiry })}
                    >
                      <SelectTrigger className="h-8 w-44" aria-label={`${name}: ${t("conditions.expires")}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="startOfTurn">{t("conditions.startOfTurn")}</SelectItem>
                        <SelectItem value="endOfTurn">{t("conditions.endOfTurn")}</SelectItem>
                        <SelectItem value="endOfCombat">{t("conditions.endOfCombat")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">{t("conditions.durationHint")}</p>
            </div>
          ) : null}
          <Field label="Exhaustion Level">
            <Select value={String(exhaustion)} onValueChange={(v) => setExhaustion(Number(v))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EXHAUSTION_EFFECTS).map(([lvl, eff]) => (
                  <SelectItem key={lvl} value={lvl}>{lvl} — {eff}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A roster entry in the "Add combatant" menu. A creature with no HP set, or one
 * that's been dropped to 0 HP, can't join the fight — it's disabled with a
 * short reason so it's clear why (rather than just greyed out).
 */
function CombatantOption({ entity, onAdd }: { entity: Addable; onAdd: () => void }) {
  const noHpSet = entity.hpMax <= 0;
  const isDown = !noHpSet && entity.hpCurrent <= 0;
  const blocked = noHpSet || isDown;
  const reason = noHpSet ? "No HP set" : "Down · 0 HP";
  const title = noHpSet
    ? "Can't add — set this creature's Max HP first"
    : "Can't add — currently at 0 HP";
  return (
    <DropdownMenuItem
      disabled={blocked}
      onSelect={() => {
        if (blocked) return;
        onAdd();
      }}
      className="flex items-center justify-between gap-2"
      title={blocked ? title : undefined}
    >
      <span className="truncate">{entity.name}</span>
      {blocked ? (
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          {isDown ? <Skull className="size-3" /> : null}
          {reason}
        </span>
      ) : null}
    </DropdownMenuItem>
  );
}

function AddCombatantMenu({
  characters,
  npcs,
  bestiary,
  onAdd,
}: {
  characters: Addable[];
  npcs: Addable[];
  bestiary: Addable[];
  onAdd: (input: AddInput) => void;
}) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [quick, setQuick] = useState({ name: "", hpMax: 10, armorClass: 10, initiativeMod: 0 });
  const [bestiaryOpen, setBestiaryOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Plus className="size-4" /> Add combatant
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-96 w-64 overflow-y-auto">
          <DropdownMenuItem onSelect={() => setQuickOpen(true)}>
            <Plus className="size-4" /> Quick add creature…
          </DropdownMenuItem>
          {bestiary.length > 0 ? (
            <DropdownMenuItem onSelect={() => setBestiaryOpen(true)}>
              <BookOpen className="size-4" /> Add from Bestiary…
            </DropdownMenuItem>
          ) : null}
          {characters.length > 0 ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Player Characters</DropdownMenuLabel>
              {characters.map((c) => (
                <CombatantOption
                  key={`c-${c.id}`}
                  entity={c}
                  onAdd={() =>
                    onAdd({ name: c.name, hpMax: c.hpMax, armorClass: c.armorClass, initiativeMod: c.initiativeMod, entityId: c.id, entityType: "character" })
                  }
                />
              ))}
            </>
          ) : null}
          {npcs.length > 0 ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>NPCs & Monsters</DropdownMenuLabel>
              {npcs.map((n) => (
                <CombatantOption
                  key={`n-${n.id}`}
                  entity={n}
                  onAdd={() =>
                    onAdd({ name: n.name, hpMax: n.hpMax, armorClass: n.armorClass, initiativeMod: n.initiativeMod, entityId: n.id, entityType: "npc" })
                  }
                />
              ))}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Quick add creature</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Field label="Name" hint="Defaults to “Goblin 1” if left blank">
              <Input value={quick.name} onChange={(e) => setQuick((q) => ({ ...q, name: e.target.value }))} placeholder="Goblin 1" autoFocus />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Max HP">
                <Input type="number" value={quick.hpMax} onChange={(e) => setQuick((q) => ({ ...q, hpMax: Number(e.target.value || 0) }))} />
              </Field>
              <Field label="Armor Class">
                <Input type="number" value={quick.armorClass} onChange={(e) => setQuick((q) => ({ ...q, armorClass: Number(e.target.value || 0) }))} />
              </Field>
              <Field label="Init Mod">
                <Input type="number" value={quick.initiativeMod} onChange={(e) => setQuick((q) => ({ ...q, initiativeMod: Number(e.target.value || 0) }))} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setQuickOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                // Fall back to the placeholder defaults so a blank Add still
                // produces a usable combatant (Goblin 1, 10 HP, AC 10).
                const name = quick.name.trim() || "Goblin 1";
                const hpMax = quick.hpMax > 0 ? quick.hpMax : 10;
                onAdd({ name, hpMax, armorClass: quick.armorClass, initiativeMod: quick.initiativeMod });
                setQuick({ name: "", hpMax: 10, armorClass: 10, initiativeMod: 0 });
                setQuickOpen(false);
              }}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BestiaryPicker
        open={bestiaryOpen}
        onOpenChange={setBestiaryOpen}
        bestiary={bestiary}
        onAdd={onAdd}
      />
    </>
  );
}

function ConcentrationDialog({
  participant: p,
  onSave,
}: {
  participant: CombatParticipant;
  onSave: (id: number, patch: Partial<CombatParticipant>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [spell, setSpell] = useState(p.concentrationSpell ?? "");

  function save() {
    onSave(p.id, { concentrationSpell: spell.trim() || null });
    setOpen(false);
  }

  function clear() {
    onSave(p.id, { concentrationSpell: null });
    setSpell("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setSpell(p.concentrationSpell ?? ""); }}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn("size-8", p.concentrationSpell ? "text-blue-400" : "text-muted-foreground")}
          aria-label="Concentration"
          title={p.concentrationSpell ? `Concentrating: ${p.concentrationSpell}` : "Set concentration spell"}
        >
          {p.concentrationSpell ? <Zap className="size-4" /> : <ZapOff className="size-4" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{p.name} — Concentration</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input
            value={spell}
            onChange={(e) => setSpell(e.target.value)}
            placeholder="Spell name (e.g. Hold Person)"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            When this combatant takes damage, you&apos;ll see the concentration check DC.
          </p>
        </div>
        <DialogFooter className="flex gap-2">
          {p.concentrationSpell && (
            <Button variant="outline" onClick={clear}>Clear</Button>
          )}
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>Set</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CombatLogPanel({
  encounterId,
  round,
  participants,
  entries,
  onAdd,
}: {
  encounterId: number;
  round: number;
  participants: CombatParticipant[];
  entries: CombatLogEntry[];
  onAdd: (actorName: string, action: string, details: string) => void;
}) {
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [details, setDetails] = useState("");

  function submit() {
    if (!action.trim()) { toast.error("Action is required"); return; }
    onAdd(actor || "Unknown", action.trim(), details.trim());
    setAction("");
    setDetails("");
  }

  const grouped = entries.reduce<Record<number, CombatLogEntry[]>>((acc, e) => {
    acc[e.round] = acc[e.round] ?? [];
    acc[e.round].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Quick log form */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Actor…</option>
          {participants.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
        <Input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Action (e.g. Attack with longsword)"
          className="flex-1"
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <Input
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Details (optional)"
          className="flex-1"
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <Button size="sm" onClick={submit}>Log</Button>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No log entries yet.</p>
      ) : (
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {Object.entries(grouped)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([r, rEntries]) => (
              <div key={r}>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Round {r}</p>
                <ul className="space-y-1">
                  {rEntries.map((e) => (
                    <li key={e.id} className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                      {e.actorName && (
                        <span className="shrink-0 font-medium text-primary">{e.actorName}:</span>
                      )}
                      <span className="min-w-0 flex-1">
                        {e.action}
                        {e.details ? (
                          <span className="text-muted-foreground"> — {e.details}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

/**
 * Searchable picker for dropping Bestiary templates straight into the fight.
 * Tapping a creature adds it immediately (so a DM can rattle off a whole pack);
 * the tag button opens a small form to name it and add several at once.
 */
function BestiaryPicker({
  open,
  onOpenChange,
  bestiary,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bestiary: Addable[];
  onAdd: (input: AddInput) => void;
}) {
  const [search, setSearch] = useState("");
  // The creature currently being named, if any — swaps the list for a form.
  const [naming, setNaming] = useState<Addable | null>(null);
  const [customName, setCustomName] = useState("");
  const [count, setCount] = useState("1");
  const [asGroup, setAsGroup] = useState(true);
  const t = useT();

  const q = search.trim().toLowerCase();
  const filtered = q
    ? bestiary.filter(
        (b) =>
          b.name.toLowerCase().includes(q) || (b.cr ?? "").toLowerCase().includes(q),
      )
    : bestiary;

  function startNaming(entity: Addable) {
    setNaming(entity);
    setCustomName(entity.name);
    setCount("1");
  }

  function confirmNaming() {
    if (!naming) return;
    const qty = Math.max(1, Math.min(30, Math.round(Number(count) || 1)));
    onAdd({
      name: customName.trim() || naming.name,
      hpMax: naming.hpMax,
      armorClass: naming.armorClass,
      initiativeMod: naming.initiativeMod,
      entityId: naming.id,
      entityType: "npc",
      count: qty,
      group: qty > 1 && asGroup,
    });
    setNaming(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setSearch("");
          setNaming(null);
        }
      }}
    >
      <DialogContent className="flex max-h-[85vh] max-w-md flex-col">
        <DialogHeader>
          <DialogTitle>
            {naming ? `Add ${naming.name}` : "Add from Bestiary"}
          </DialogTitle>
        </DialogHeader>

        {naming ? (
          <div className="space-y-4 py-1">
            <Field
              label="Name in this fight"
              hint="What you'll call it at the table — “Jerry”, “Goblin Boss”, “Archer”."
            >
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={naming.name}
                maxLength={120}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmNaming();
                }}
              />
            </Field>
            <Field label="How many?" hint="More than one gets numbered — Jerry 1, Jerry 2…">
              <Input
                type="number"
                min={1}
                max={30}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </Field>
            {Number(count) > 1 ? (
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={asGroup}
                  onChange={(e) => setAsGroup(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  {t("combat.addAsGroup")}
                  <span className="block text-xs text-muted-foreground">{t("combat.addAsGroupHint")}</span>
                </span>
              </label>
            ) : null}
            <p className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>HP {naming.hpMax}</span>
              <span className="flex items-center gap-0.5">
                <Shield className="size-3" /> {naming.armorClass}
              </span>
              <span>
                Init {naming.initiativeMod >= 0 ? "+" : ""}
                {naming.initiativeMod}
              </span>
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setNaming(null)}>
                Back
              </Button>
              <Button onClick={confirmNaming}>Add</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search monsters…"
                className="pl-8"
                autoFocus
              />
            </div>
            <p className="-mt-1 text-xs text-muted-foreground">
              Tap a creature to add it, or use{" "}
              <Tag className="inline size-3 align-[-2px]" /> to name it and add several.
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No monsters match.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map((b) => {
                    const noHpSet = b.hpMax <= 0;
                    const isDown = !noHpSet && b.hpCurrent <= 0;
                    const blocked = noHpSet || isDown;
                    const blockedReason = noHpSet
                      ? "Can't add — set this creature's Max HP first"
                      : "Can't add — currently at 0 HP";
                    return (
                      <div
                        key={b.id}
                        className="flex items-stretch transition-colors hover:bg-accent"
                      >
                        <button
                          type="button"
                          disabled={blocked}
                          title={blocked ? blockedReason : `Add ${b.name}`}
                          onClick={() =>
                            onAdd({
                              name: b.name,
                              hpMax: b.hpMax,
                              armorClass: b.armorClass,
                              initiativeMod: b.initiativeMod,
                              entityId: b.id,
                              entityType: "npc",
                            })
                          }
                          className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="min-w-0 truncate font-medium">{b.name}</span>
                          {blocked ? (
                            <span className="flex shrink-0 items-center gap-1 text-xs text-destructive/80">
                              {isDown ? <Skull className="size-3" /> : null}
                              {noHpSet ? "No HP set" : "Down · 0 HP"}
                            </span>
                          ) : (
                            <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                              {b.cr ? <span>CR {b.cr}</span> : null}
                              <span>HP {b.hpMax}</span>
                              <span className="flex items-center gap-0.5">
                                <Shield className="size-3" />
                                {b.armorClass}
                              </span>
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={blocked}
                          onClick={() => startNaming(b)}
                          title={blocked ? blockedReason : `Name ${b.name} and add several`}
                          aria-label={`Add ${b.name} with a custom name`}
                          className="flex shrink-0 items-center border-l border-border px-2.5 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Tag className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
