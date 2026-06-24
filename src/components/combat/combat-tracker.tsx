"use client";

import { useEffect, useRef, useState } from "react";
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
import { api } from "@/lib/client";
import { CONDITIONS, EXHAUSTION_EFFECTS } from "@/lib/constants";
import { rollDie } from "@/lib/dnd";
import { cn } from "@/lib/utils";
import type { CombatParticipant, Encounter } from "@/db/schema";

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

export function CombatTracker({
  encounter,
  addableCharacters,
  addableNpcs,
  addableBestiary,
}: {
  encounter: EncounterWithParts;
  addableCharacters: Addable[];
  addableNpcs: Addable[];
  addableBestiary: Addable[];
}) {
  const router = useRouter();
  const [parts, setParts] = useState<CombatParticipant[]>(
    [...encounter.participants].sort((a, b) => a.turnOrder - b.turnOrder),
  );
  const [round, setRound] = useState(encounter.roundNumber);
  const [turnIndex, setTurnIndex] = useState(encounter.currentTurnIndex);
  const [endOpen, setEndOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const modLookup = new Map<string, number>();
  for (const a of [...addableCharacters, ...addableNpcs, ...addableBestiary]) {
    modLookup.set(`${a.type}:${a.id}`, a.initiativeMod);
  }
  function initiativeMod(p: CombatParticipant): number {
    if (p.entityId && p.entityType) {
      return modLookup.get(`${p.entityType}:${p.entityId}`) ?? 0;
    }
    return 0;
  }

  // Mirror of `parts` for synchronous reads while the +/- HP steppers fire in
  // rapid succession (so each press computes from the freshest HP).
  const partsRef = useRef(parts);
  useEffect(() => {
    partsRef.current = parts;
  }, [parts]);

  // Per-participant debounced HP persistence: a long press updates the UI on
  // every tick but only writes the final value to the server.
  const hpSaveTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const timers = hpSaveTimers.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  function scheduleHpSave(id: number, patch: Partial<CombatParticipant>) {
    const timers = hpSaveTimers.current;
    const existing = timers.get(id);
    if (existing) clearTimeout(existing);
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        api.patch(`/api/participants/${id}`, patch).catch(() =>
          toast.error("Failed to save HP"),
        );
      }, 400),
    );
  }

  /** Apply a signed HP delta (negative = damage, positive = heal). */
  function adjustHp(id: number, delta: number) {
    const p = partsRef.current.find((x) => x.id === id);
    if (!p) return;
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

  async function addParticipant(input: {
    name: string;
    hpMax: number;
    armorClass: number;
    entityId?: number;
    entityType?: "character" | "npc";
  }) {
    try {
      const created = await api.post<CombatParticipant>("/api/participants", {
        encounterId: encounter.id,
        name: input.name,
        hpMax: input.hpMax,
        hpCurrent: input.hpMax,
        armorClass: input.armorClass,
        entityId: input.entityId ?? null,
        entityType: input.entityType ?? null,
        turnOrder: parts.length,
      });
      setParts((prev) => [...prev, created]);
      toast.success(`Added ${input.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add combatant");
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

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = parts.findIndex((p) => p.id === active.id);
    const newIndex = parts.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(parts, oldIndex, newIndex).map((p, i) => ({
      ...p,
      turnOrder: i,
    }));
    setParts(reordered);
    persistOrder(reordered);
  }

  function rollAll() {
    const rolled = parts
      .map((p) => {
        const roll = rollDie(20);
        return { ...p, initiativeRoll: roll, initiativeTotal: roll + initiativeMod(p) };
      })
      .sort((a, b) => b.initiativeTotal - a.initiativeTotal)
      .map((p, i) => ({ ...p, turnOrder: i }));
    setParts(rolled);
    setTurnIndex(0);
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
    saveEncounter({ currentTurnIndex: 0, roundNumber: 1 });
    toast.success("Initiative rolled");
  }

  function setInitiative(id: number, total: number) {
    savePart(id, { initiativeTotal: total });
  }

  function sortByInitiative() {
    const sorted = [...parts]
      .sort((a, b) => b.initiativeTotal - a.initiativeTotal)
      .map((p, i) => ({ ...p, turnOrder: i }));
    setParts(sorted);
    persistOrder(sorted);
  }

  function nextTurn() {
    if (parts.length === 0) return;
    let idx = turnIndex + 1;
    let r = round;
    if (idx >= parts.length) {
      idx = 0;
      r = round + 1;
      setRound(r);
    }
    setTurnIndex(idx);
    saveEncounter({ currentTurnIndex: idx, roundNumber: r });
  }

  function prevTurn() {
    if (parts.length === 0) return;
    let idx = turnIndex - 1;
    let r = round;
    if (idx < 0) {
      if (round > 1) {
        idx = parts.length - 1;
        r = round - 1;
        setRound(r);
      } else {
        idx = 0;
      }
    }
    setTurnIndex(idx);
    saveEncounter({ currentTurnIndex: idx, roundNumber: r });
  }

  async function endEncounter() {
    await api.patch(`/api/encounters/${encounter.id}`, { status: "completed" });
    toast.success("Encounter ended");
    router.refresh();
  }

  return (
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
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={rollAll} disabled={parts.length === 0}>
            <Dices className="size-4" /> Roll initiative
          </Button>
          <Button variant="outline" onClick={sortByInitiative} disabled={parts.length === 0}>
            Sort
          </Button>
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
          <SortableContext items={parts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {parts.map((p, i) => (
                <ParticipantRow
                  key={p.id}
                  participant={p}
                  isCurrent={i === turnIndex}
                  onSave={savePart}
                  onAdjustHp={adjustHp}
                  onRemove={removeParticipant}
                  onSetInitiative={setInitiative}
                />
              ))}
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ParticipantRow({
  participant: p,
  isCurrent,
  onSave,
  onAdjustHp,
  onRemove,
  onSetInitiative,
}: {
  participant: CombatParticipant;
  isCurrent: boolean;
  onSave: (id: number, patch: Partial<CombatParticipant>) => void;
  onAdjustHp: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
  onSetInitiative: (id: number, total: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: p.id });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isDown = p.hpCurrent <= 0;
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
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-5" />
        </button>

        {/* Initiative */}
        <div className="flex w-14 flex-col items-center">
          <span className="text-[10px] uppercase text-muted-foreground">Init</span>
          <Input
            value={p.initiativeTotal}
            onChange={(e) => onSetInitiative(p.id, Number(e.target.value || 0))}
            className="h-8 w-12 px-1 text-center text-sm tabular-nums"
          />
        </div>

        {/* Name + status */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("font-medium", isDown && "text-muted-foreground line-through")}>
              {p.name}
            </span>
            {isCurrent ? <Badge className="bg-primary text-primary-foreground">Turn</Badge> : null}
            {isDown ? (
              <Badge variant="destructive" className="gap-1">
                <Skull className="size-3" /> Down
              </Badge>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {p.conditions.map((c) => (
              <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
            ))}
            {p.exhaustionLevel > 0 ? (
              <Badge className="bg-destructive/20 text-red-200 text-xs">Exhaustion {p.exhaustionLevel}</Badge>
            ) : null}
          </div>
        </div>

        {/* HP + AC */}
        <div className="hidden w-44 sm:block">
          <HpBar current={p.hpCurrent} max={p.hpMax} temp={p.hpTemp} />
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Shield className="size-4 text-primary" /> {p.armorClass}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <HpStepper participantId={p.id} onAdjustHp={onAdjustHp} />
          <HpDialog participant={p} onSave={onSave} />
          <ConditionsDialog participant={p} onSave={onSave} />
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
}: {
  participant: CombatParticipant;
  onSave: (id: number, patch: Partial<CombatParticipant>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [temp, setTemp] = useState("");

  function apply(kind: "damage" | "heal") {
    const value = Math.abs(Number(amount || 0));
    if (!value) return;
    if (kind === "damage") {
      let remaining = value;
      let newTemp = p.hpTemp;
      if (newTemp > 0) {
        const absorbed = Math.min(newTemp, remaining);
        newTemp -= absorbed;
        remaining -= absorbed;
      }
      const newHp = Math.max(0, p.hpCurrent - remaining);
      onSave(p.id, { hpCurrent: newHp, hpTemp: newTemp });
    } else {
      onSave(p.id, { hpCurrent: Math.min(p.hpMax, p.hpCurrent + value) });
    }
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

function ConditionsDialog({
  participant: p,
  onSave,
}: {
  participant: CombatParticipant;
  onSave: (id: number, patch: Partial<CombatParticipant>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [conditions, setConditions] = useState<string[]>(p.conditions);
  const [exhaustion, setExhaustion] = useState(p.exhaustionLevel);

  function save() {
    onSave(p.id, { conditions, exhaustionLevel: exhaustion });
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setConditions(p.conditions);
          setExhaustion(p.exhaustionLevel);
        }
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
          <CheckboxGroup columns={2} options={[...CONDITIONS]} value={conditions} onChange={setConditions} />
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
 * A roster entry in the "Add combatant" menu. A character/NPC at 0 HP is
 * disabled — a downed creature can't join the fight.
 */
function CombatantOption({ entity, onAdd }: { entity: Addable; onAdd: () => void }) {
  const isDown = entity.hpCurrent <= 0;
  return (
    <DropdownMenuItem
      disabled={isDown}
      onSelect={() => {
        if (isDown) return;
        onAdd();
      }}
      className="flex items-center justify-between gap-2"
    >
      <span className="truncate">{entity.name}</span>
      {isDown ? (
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Skull className="size-3" /> 0 HP
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
  onAdd: (input: {
    name: string;
    hpMax: number;
    armorClass: number;
    entityId?: number;
    entityType?: "character" | "npc";
  }) => void;
}) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [quick, setQuick] = useState({ name: "", hpMax: 10, armorClass: 10 });
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
                    onAdd({ name: c.name, hpMax: c.hpMax, armorClass: c.armorClass, entityId: c.id, entityType: "character" })
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
                    onAdd({ name: n.name, hpMax: n.hpMax, armorClass: n.armorClass, entityId: n.id, entityType: "npc" })
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
            <Field label="Name" required>
              <Input value={quick.name} onChange={(e) => setQuick((q) => ({ ...q, name: e.target.value }))} placeholder="Goblin 1" autoFocus />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Max HP">
                <Input type="number" value={quick.hpMax} onChange={(e) => setQuick((q) => ({ ...q, hpMax: Number(e.target.value || 0) }))} />
              </Field>
              <Field label="Armor Class">
                <Input type="number" value={quick.armorClass} onChange={(e) => setQuick((q) => ({ ...q, armorClass: Number(e.target.value || 0) }))} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setQuickOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!quick.name.trim()) {
                  toast.error("Name is required");
                  return;
                }
                if (quick.hpMax <= 0) {
                  toast.error("Max HP must be greater than 0");
                  return;
                }
                onAdd({ name: quick.name, hpMax: quick.hpMax, armorClass: quick.armorClass });
                setQuick({ name: "", hpMax: 10, armorClass: 10 });
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

/**
 * Searchable picker for dropping Bestiary templates straight into the fight.
 * Stays open after each pick so a DM can add a whole pack of monsters quickly.
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
  onAdd: (input: {
    name: string;
    hpMax: number;
    armorClass: number;
    entityId?: number;
    entityType?: "character" | "npc";
  }) => void;
}) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const filtered = q
    ? bestiary.filter(
        (b) =>
          b.name.toLowerCase().includes(q) || (b.cr ?? "").toLowerCase().includes(q),
      )
    : bestiary;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setSearch("");
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add from Bestiary</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
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
          <p className="text-xs text-muted-foreground">
            Tap a creature to add it — add several to drop in a whole pack.
          </p>
          <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No monsters match.
              </p>
            ) : (
              filtered.map((b) => {
                const isDown = b.hpCurrent <= 0;
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={isDown}
                    onClick={() =>
                      onAdd({
                        name: b.name,
                        hpMax: b.hpMax,
                        armorClass: b.armorClass,
                        entityId: b.id,
                        entityType: "npc",
                      })
                    }
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/50 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="min-w-0 truncate font-medium">{b.name}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      {b.cr ? <span>CR {b.cr}</span> : null}
                      <span>HP {b.hpMax}</span>
                      <span className="flex items-center gap-0.5">
                        <Shield className="size-3" />
                        {b.armorClass}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
