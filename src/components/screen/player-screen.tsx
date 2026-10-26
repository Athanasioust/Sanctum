"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { Swords, Heart, Shield, Skull, Image, Grid3x3, Castle } from "lucide-react";
import { api } from "@/lib/client";
import { fogForGrid, resolveTokenImages, tokenVisibleToPlayers } from "@/lib/battle-map";
import { currentSlotIndex, keepGroupsTogether, turnSlots } from "@/lib/combat-turns";
import { hpBarColor } from "@/lib/ui";
import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";
import { ClockFace } from "@/components/clocks/clock-face";
import type {
  BattleMap,
  Character,
  Clock,
  CombatParticipant,
  Encounter,
  Handout,
} from "@/db/schema";

const BattleMapCanvas = dynamic(() => import("@/components/combat/battle-map-canvas"), {
  ssr: false,
});

export type ScreenState = {
  active: boolean;
  encounterName: string;
  round: number;
  turnIndex: number;
  /** Initiative is on the lair's count-20 row rather than a creature. */
  lairActive: boolean;
  participants: CombatParticipant[];
  party: Character[];
  handouts: Handout[];
  /** The battle map the DM is currently showing, if any. */
  battleMap: BattleMap | null;
  /** Art for the map's tokens, by token id (hidden tokens are never drawn). */
  tokenArt: Record<string, string>;
  /** The DM lets players drag the tokens handed to them. */
  playerMoves: boolean;
  /** Progress clocks the DM has revealed. */
  clocks: Clock[];
};

export const EMPTY_SCREEN_STATE: ScreenState = {
  active: false,
  encounterName: "",
  round: 1,
  turnIndex: 0,
  lairActive: false,
  participants: [],
  party: [],
  handouts: [],
  battleMap: null,
  tokenArt: {},
  playerMoves: false,
  clocks: [],
};

/** How long a poll may take before it's abandoned and retried on the next tick. */
const POLL_TIMEOUT_MS = 8000;
/** Consecutive failed polls before the screen admits it's out of touch. */
const STALE_AFTER_FAILURES = 3;

export function PlayerScreen({
  campaignId,
  campaignName,
  initialState,
}: {
  campaignId: number;
  campaignName: string;
  /**
   * Rendered on the server, so the screen is readable the instant the HTML
   * lands — before, and even without, any client JavaScript.
   */
  initialState: ScreenState;
}) {
  const [state, setState] = useState<ScreenState>(initialState);
  const [failures, setFailures] = useState(0);
  const t = useT();

  const load = useCallback(async () => {
    // A poll that never settles used to wedge the screen forever. Abort it and
    // let the next tick try again.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), POLL_TIMEOUT_MS);
    const signal = controller.signal;

    try {
      const [encounters, party, allHandouts, maps, moves, allClocks] = await Promise.all([
        api.get<Encounter[]>(`/api/encounters?campaignId=${campaignId}`, { signal }),
        api.get<Character[]>(`/api/characters?campaignId=${campaignId}`, { signal }),
        api.get<Handout[]>(`/api/handouts?campaignId=${campaignId}`, { signal }),
        api.get<BattleMap[]>(`/api/battle-maps?campaignId=${campaignId}`, { signal }),
        api.get<{ allowed: boolean }>("/api/screen/move-token", { signal }),
        api.get<Clock[]>(`/api/clocks?campaignId=${campaignId}`, { signal }),
      ]);
      const clocks = allClocks.filter((c) => c.revealToPlayers);
      const playerMoves = moves.allowed;
      const handouts = allHandouts.filter((h) => h.isRevealed);
      // Maps come back newest-updated first, so the most recently touched map
      // wins if the DM left more than one flagged.
      const battleMap = maps.find((m) => m.revealToPlayers) ?? null;
      const active = encounters.find((e) => e.status === "active") ?? null;
      type FullEncounter = Encounter & {
        participants: CombatParticipant[];
        portraits?: Record<string, string>;
      };
      // Token art comes from the encounter the map is linked to, which is
      // usually — but not necessarily — the one being fought.
      const mapEncounterId = battleMap?.encounterId ?? null;
      const [full, linked] = await Promise.all([
        active
          ? api.get<FullEncounter>(`/api/encounters/${active.id}`, { signal })
          : Promise.resolve(null),
        mapEncounterId && mapEncounterId !== active?.id
          ? api.get<FullEncounter>(`/api/encounters/${mapEncounterId}`, { signal }).catch(() => null)
          : Promise.resolve(null),
      ]);
      const art = linked ?? full;
      const tokenArt = battleMap
        ? resolveTokenImages(battleMap.tokens, art?.participants ?? [], art?.portraits ?? {})
        : {};
      let next: ScreenState = {
        ...EMPTY_SCREEN_STATE,
        party,
        handouts,
        battleMap,
        tokenArt,
        playerMoves,
        clocks,
      };
      if (active && full) {
        next = {
          active: true,
          encounterName: full.name,
          round: full.roundNumber,
          turnIndex: full.currentTurnIndex,
          lairActive: full.lairTurnActive,
          participants: keepGroupsTogether(
            [...full.participants].sort((a, b) => a.turnOrder - b.turnOrder),
          ),
          party,
          handouts,
          battleMap,
          tokenArt,
          playerMoves,
          clocks,
        };
      }
      setState(next);
      setFailures(0);
    } catch {
      // Keep showing the last known state, but start counting — a screen that
      // has quietly stopped updating is worse than one that says so.
      setFailures((n) => n + 1);
    } finally {
      clearTimeout(timeout);
    }
  }, [campaignId]);

  useEffect(() => {
    // The server already rendered the current state, so the first refresh can
    // wait for the normal interval rather than firing immediately.
    const interval = setInterval(() => {
      load();
    }, 4000);
    return () => clearInterval(interval);
  }, [load]);

  const stale = failures >= STALE_AFTER_FAILURES;

  return (
    <main className="min-h-screen bg-background px-3 py-4 sm:px-8 sm:py-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Swords className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">{campaignName}</h1>
            <p className="text-xs text-muted-foreground">{t("player.live")}</p>
          </div>
        </div>
        {state.active ? (
          <div className="text-right">
            <p className="text-xs uppercase text-muted-foreground">{t("common.round")}</p>
            <p className="font-heading text-3xl font-semibold tabular-nums">{state.round}</p>
          </div>
        ) : null}
      </header>

      {stale ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-200">
          {t("player.reconnecting")}
        </p>
      ) : null}

      {/* Battle map — only when the DM has flagged one to show */}
        {state.battleMap && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-muted-foreground">
              <Grid3x3 className="size-4" /> {state.battleMap.name}
            </h2>
            <PlayerBattleMap
              campaignId={campaignId}
              map={state.battleMap}
              tokenArt={state.tokenArt}
              playerMoves={state.playerMoves}
            />
          </section>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
          {/* Initiative */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-muted-foreground">
              {state.active ? state.encounterName || t("player.initiative") : t("player.initiative")}
            </h2>
            {state.active && state.participants.length > 0 ? (
              <InitiativeList state={state} />
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/40 py-16 text-center">
                <p className="text-lg text-muted-foreground">{t("player.noEncounter")}</p>
                <p className="text-sm text-muted-foreground">{t("player.resting")}</p>
              </div>
            )}
          </section>

          {/* Party */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-muted-foreground">{t("player.party")}</h2>
            {state.party.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("player.noCharacters")}</p>
            ) : (
              <div className="space-y-2">
                {state.party.map((c) => (
                  <PartyRow key={c.id} c={c} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Clocks */}
        {state.clocks.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 font-heading text-lg font-semibold text-muted-foreground">
              {t("clocks.title")}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {state.clocks.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center"
                >
                  <ClockFace
                    segments={c.segments}
                    filled={c.filled}
                    color={c.color}
                    size={96}
                    label={`${c.name}: ${c.filled} / ${c.segments}`}
                  />
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    {c.filled} / {c.segments}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Handouts */}
        {state.handouts.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold text-muted-foreground">
              <Image className="size-4" /> {t("player.handouts")}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {state.handouts.map((h) => (
                <HandoutCard key={h.id} handout={h} />
              ))}
            </div>
          </section>
        )}
    </main>
  );
}

/**
 * The DM's battle map, read-only. Fog renders solid black and tokens the DM
 * hid — or that stand in unrevealed squares — are never drawn, so nothing
 * reaches this screen that the players aren't meant to see.
 */
/**
 * Which player this phone belongs to, remembered in the browser. There are no
 * accounts; this only decides which tokens the phone offers to drag.
 */
const PLAYER_KEY = "sanctum:player-name";
const PLAYER_EVENT = "sanctum:player-name-changed";

function subscribePlayer(onChange: () => void) {
  window.addEventListener(PLAYER_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PLAYER_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readPlayer(): string {
  try {
    return window.localStorage.getItem(PLAYER_KEY) ?? "";
  } catch {
    return "";
  }
}

function writePlayer(name: string) {
  try {
    if (name) window.localStorage.setItem(PLAYER_KEY, name);
    else window.localStorage.removeItem(PLAYER_KEY);
  } catch {
    /* private mode — the choice just won't be remembered */
  }
  window.dispatchEvent(new Event(PLAYER_EVENT));
}

function PlayerBattleMap({
  campaignId,
  map,
  tokenArt,
  playerMoves,
}: {
  campaignId: number;
  map: BattleMap;
  tokenArt: Record<string, string>;
  playerMoves: boolean;
}) {
  const t = useT();
  const player = useSyncExternalStore(subscribePlayer, readPlayer, () => "");
  // A drag shows at once; it's tied to the map snapshot it was made on, so
  // the next poll (which already carries the move) simply replaces it.
  const [pending, setPending] = useState<{ map: BattleMap; id: string; x: number; y: number } | null>(null);
  const [error, setError] = useState("");

  const fog = fogForGrid(map.fog, map.gridCols, map.gridRows);
  const tokens =
    pending && pending.map === map
      ? map.tokens.map((tk) => (tk.id === pending.id ? { ...tk, x: pending.x, y: pending.y } : tk))
      : map.tokens;

  // Players can only claim tokens they can actually see.
  const handed = playerMoves
    ? tokens.filter(
        (tk) => tk.playerControllable && tk.controllerName && tokenVisibleToPlayers(tk, fog, map.fogEnabled),
      )
    : [];
  const names = [...new Set(handed.map((tk) => tk.controllerName!.trim()))].sort();
  const mine = handed
    .filter((tk) => player && tk.controllerName!.trim().toLowerCase() === player.toLowerCase())
    .map((tk) => tk.id);

  async function move(id: string, x: number, y: number) {
    setError("");
    setPending({ map, id, x, y });
    try {
      await api.post("/api/screen/move-token", {
        campaignId,
        battleMapId: map.id,
        tokenId: id,
        controllerName: player,
        x,
        y,
      });
    } catch (err) {
      setPending(null);
      setError(err instanceof Error ? err.message : t("player.moveFailed"));
    }
  }

  return (
    <div className="space-y-2">
      {names.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("player.whoAreYou")}</span>
          {names.map((name) => {
            const active = player.toLowerCase() === name.toLowerCase();
            return (
              <button
                key={name}
                type="button"
                onClick={() => writePlayer(active ? "" : name)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1 transition-colors",
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border hover:bg-muted",
                )}
              >
                {name}
              </button>
            );
          })}
          {mine.length > 0 ? (
            <span className="text-xs text-muted-foreground">{t("player.dragHint")}</span>
          ) : null}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border bg-[#0b0b0c]">
        <BattleMapCanvas
          map={{
            imageUrl: map.imageUrl,
            gridSize: map.gridSize,
            gridCols: map.gridCols,
            gridRows: map.gridRows,
            feetPerCell: map.feetPerCell,
            diagonalRule: map.diagonalRule,
            tokens,
            annotations: map.annotations,
            fog,
            fogEnabled: map.fogEnabled,
          }}
          statuses={{}}
          tokenImages={tokenArt}
          draggableTokenIds={mine}
          onMoveToken={move}
          readOnly
          playerView
          fitWidth
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

/** Initiative in turn order, with the lair's count-20 row when there is one. */
function InitiativeList({ state }: { state: ScreenState }) {
  const t = useT();
  const slots = turnSlots(state.participants);
  const current = currentSlotIndex(slots, state.turnIndex, state.lairActive);
  return (
    <div className="space-y-2">
      {slots.map((slot, si) =>
        slot.kind === "lair" ? (
          <div
            key="lair"
            className={cn(
              "flex items-center gap-3 rounded-xl border border-dashed bg-card/60 p-3 sm:gap-4",
              si === current ? "border-primary ring-2 ring-primary/40" : "border-border",
            )}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-semibold tabular-nums sm:size-10">
              20
            </div>
            <p className="flex flex-1 items-center gap-2 text-base font-medium sm:text-lg">
              <Castle className="size-4 text-primary" /> {t("combat.lairRow")}
            </p>
            {si === current ? (
              <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                {t("common.turn")}
              </span>
            ) : null}
          </div>
        ) : slot.ids.length > 1 ? (
          <GroupInitiativeRow
            key={slot.ids[0]}
            members={state.participants.slice(slot.start, slot.start + slot.ids.length)}
            current={si === current}
          />
        ) : (
          <InitiativeRow
            key={slot.ids[0]}
            p={state.participants[slot.start]}
            current={si === current}
          />
        ),
      )}
    </div>
  );
}

/** A minion group — one row, with how many are still standing. */
function GroupInitiativeRow({
  members,
  current,
}: {
  members: CombatParticipant[];
  current: boolean;
}) {
  const t = useT();
  const lead = members[0];
  const down = members.filter((m) => m.hpCurrent <= 0).length;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors sm:gap-4",
        current ? "border-primary ring-2 ring-primary/40" : "border-border",
        down === members.length && "opacity-60",
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-semibold tabular-nums sm:size-10">
        {lead.initiativeTotal}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium sm:text-lg">
          {members.length}× {lead.groupLabel || lead.name}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("combat.groupSummary")
            .replace("{up}", String(members.length - down))
            .replace("{down}", String(down))}
        </p>
      </div>
      {current ? (
        <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
          {t("common.turn")}
        </span>
      ) : null}
    </div>
  );
}

function InitiativeRow({ p, current }: { p: CombatParticipant; current: boolean }) {
  const t = useT();
  const isPc = p.entityType === "character";
  const down = p.hpCurrent <= 0;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors sm:gap-4",
        current ? "border-primary ring-2 ring-primary/40" : "border-border",
        down && "opacity-60",
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-semibold tabular-nums sm:size-10">
        {p.initiativeTotal}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-base font-medium sm:text-lg", down && "line-through")}>{p.name}</p>
        {/* PCs show real HP; monsters show only a status so players can't metagame. */}
        {isPc ? (
          <div className="mt-1 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", hpBarColor(p.hpMax > 0 ? p.hpCurrent / p.hpMax : 0))}
              style={{ width: `${p.hpMax > 0 ? Math.max(0, Math.min(100, (p.hpCurrent / p.hpMax) * 100)) : 0}%` }}
            />
          </div>
        ) : (
          <MonsterStatus current={p.hpCurrent} max={p.hpMax} />
        )}
      </div>
      {current ? (
        <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
          {t("common.turn")}
        </span>
      ) : null}
    </div>
  );
}

function MonsterStatus({ current, max }: { current: number; max: number }) {
  const t = useT();
  const ratio = max > 0 ? current / max : 0;
  let label = t("player.healthy");
  let tone = "text-success";
  if (current <= 0) {
    label = t("player.down");
    tone = "text-destructive";
  } else if (ratio <= 0.5) {
    label = t("player.bloodied");
    tone = "text-orange-400";
  }
  return (
    <p className={cn("mt-0.5 flex items-center gap-1.5 text-sm font-medium", tone)}>
      {current <= 0 ? <Skull className="size-3.5" /> : <Heart className="size-3.5" />}
      {label}
    </p>
  );
}

function HandoutCard({ handout }: { handout: Handout }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-2 font-semibold">{handout.title}</h3>
      {handout.imageUrl && (
        <img
          src={handout.imageUrl}
          alt={handout.title}
          className="mb-3 max-h-48 w-full rounded-lg object-contain"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      )}
      {handout.content && (
        <div
          className="prose prose-invert prose-sm text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(handout.content) }}
        />
      )}
    </div>
  );
}

function PartyRow({ c }: { c: Character }) {
  const ratio = c.hpMax > 0 ? c.hpCurrent / c.hpMax : 0;
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-medium">{c.name}</p>
        <span className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Shield className="size-3.5 text-primary" /> {c.armorClass}
          </span>
          <span className="tabular-nums">
            {c.hpCurrent}
            <span className="text-muted-foreground">/{c.hpMax}</span>
            {c.hpTemp > 0 ? <span className="text-blue-400"> +{c.hpTemp}</span> : null}
          </span>
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", hpBarColor(ratio))}
          style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
        />
      </div>
    </div>
  );
}
