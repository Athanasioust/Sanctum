"use client";

import { useCallback, useEffect, useState } from "react";
import { Swords, Heart, Shield, Skull, Image } from "lucide-react";
import { api } from "@/lib/client";
import { hpBarColor } from "@/lib/ui";
import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import type { Character, CombatParticipant, Encounter, Handout } from "@/db/schema";

type ScreenState = {
  active: boolean;
  encounterName: string;
  round: number;
  turnIndex: number;
  participants: CombatParticipant[];
  party: Character[];
  handouts: Handout[];
};

const EMPTY: ScreenState = {
  active: false,
  encounterName: "",
  round: 1,
  turnIndex: 0,
  participants: [],
  party: [],
  handouts: [],
};

export function PlayerScreen({
  campaignId,
  campaignName,
}: {
  campaignId: number;
  campaignName: string;
}) {
  const [state, setState] = useState<ScreenState>(EMPTY);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const [encounters, party, allHandouts] = await Promise.all([
        api.get<Encounter[]>(`/api/encounters?campaignId=${campaignId}`),
        api.get<Character[]>(`/api/characters?campaignId=${campaignId}`),
        api.get<Handout[]>(`/api/handouts?campaignId=${campaignId}`),
      ]);
      const handouts = allHandouts.filter((h) => h.isRevealed);
      const active = encounters.find((e) => e.status === "active") ?? null;
      let next: ScreenState = { ...EMPTY, party, handouts };
      if (active) {
        const full = await api.get<Encounter & { participants: CombatParticipant[] }>(
          `/api/encounters/${active.id}`,
        );
        next = {
          active: true,
          encounterName: full.name,
          round: full.roundNumber,
          turnIndex: full.currentTurnIndex,
          participants: [...full.participants].sort((a, b) => a.turnOrder - b.turnOrder),
          party,
          handouts,
        };
      }
      setState(next);
    } catch {
      // keep last known state on a transient error
    } finally {
      setReady(true);
    }
  }, [campaignId]);

  useEffect(() => {
    // Defer the first fetch a tick so the effect body doesn't setState
    // synchronously; refreshes then run on the interval.
    const run = () => {
      load();
    };
    const initial = setTimeout(run, 0);
    const interval = setInterval(run, 4000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [load]);

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Swords className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{campaignName}</h1>
            <p className="text-xs text-muted-foreground">Player view · updates live</p>
          </div>
        </div>
        {state.active ? (
          <div className="text-right">
            <p className="text-xs uppercase text-muted-foreground">Round</p>
            <p className="font-heading text-3xl font-semibold tabular-nums">{state.round}</p>
          </div>
        ) : null}
      </header>

      {!ready ? (
        <p className="py-20 text-center text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Initiative */}
            <section>
              <h2 className="mb-3 font-heading text-lg font-semibold text-muted-foreground">
                {state.active ? state.encounterName || "Initiative" : "Initiative"}
              </h2>
              {state.active && state.participants.length > 0 ? (
                <div className="space-y-2">
                  {state.participants.map((p, i) => (
                    <InitiativeRow key={p.id} p={p} current={i === state.turnIndex} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-card/40 py-16 text-center">
                  <p className="text-lg text-muted-foreground">No active encounter</p>
                  <p className="text-sm text-muted-foreground">The party rests… for now.</p>
                </div>
              )}
            </section>

            {/* Party */}
            <section>
              <h2 className="mb-3 font-heading text-lg font-semibold text-muted-foreground">The Party</h2>
              {state.party.length === 0 ? (
                <p className="text-sm text-muted-foreground">No characters yet.</p>
              ) : (
                <div className="space-y-2">
                  {state.party.map((c) => (
                    <PartyRow key={c.id} c={c} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Handouts */}
          {state.handouts.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold text-muted-foreground">
                <Image className="size-4" /> Handouts
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {state.handouts.map((h) => (
                  <HandoutCard key={h.id} handout={h} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function InitiativeRow({ p, current }: { p: CombatParticipant; current: boolean }) {
  const isPc = p.entityType === "character";
  const down = p.hpCurrent <= 0;
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-card p-3 transition-colors",
        current ? "border-primary ring-2 ring-primary/40" : "border-border",
        down && "opacity-60",
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-semibold tabular-nums">
        {p.initiativeTotal}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-lg font-medium", down && "line-through")}>{p.name}</p>
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
          Turn
        </span>
      ) : null}
    </div>
  );
}

function MonsterStatus({ current, max }: { current: number; max: number }) {
  const ratio = max > 0 ? current / max : 0;
  let label = "Healthy";
  let tone = "text-success";
  if (current <= 0) {
    label = "Down";
    tone = "text-destructive";
  } else if (ratio <= 0.5) {
    label = "Bloodied";
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
