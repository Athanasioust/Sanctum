"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, Users, Skull, Swords } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/shared/empty-state";
import { api } from "@/lib/client";
import { rateEncounter, DIFFICULTY_STYLES } from "@/lib/encounter";
import { cn } from "@/lib/utils";

export type BuilderChar = {
  id: number;
  name: string;
  level: number;
  hpMax: number;
  armorClass: number;
};

export type BuilderMonster = {
  id: number;
  name: string;
  cr: string;
  xp: number;
  hpMax: number;
  armorClass: number;
  initiativeMod: number;
  isTemplate: boolean;
};

export function EncounterBuilder({
  campaignId,
  party,
  monsters,
}: {
  campaignId: number;
  party: BuilderChar[];
  monsters: BuilderMonster[];
}) {
  const router = useRouter();
  const [included, setIncluded] = useState<Set<number>>(
    () => new Set(party.map((c) => c.id)),
  );
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [starting, setStarting] = useState(false);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? monsters.filter(
        (m) => m.name.toLowerCase().includes(q) || m.cr.toLowerCase().includes(q),
      )
    : monsters;

  const partyLevels = party.filter((c) => included.has(c.id)).map((c) => c.level);
  const monsterXps = useMemo(() => {
    const xps: number[] = [];
    for (const m of monsters) {
      const n = counts[m.id] ?? 0;
      for (let i = 0; i < n; i++) xps.push(m.xp);
    }
    return xps;
  }, [counts, monsters]);

  const rating = rateEncounter(monsterXps, partyLevels);
  const monsterTotal = monsterXps.length;

  function setCount(id: number, next: number) {
    setCounts((c) => {
      const n = Math.max(0, Math.min(30, next));
      const copy = { ...c };
      if (n === 0) delete copy[id];
      else copy[id] = n;
      return copy;
    });
  }

  function toggleChar(id: number) {
    setIncluded((s) => {
      const copy = new Set(s);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  async function start() {
    if (monsterTotal === 0 && included.size === 0) {
      toast.error("Add at least one combatant first");
      return;
    }
    const encounterName = name.trim() || "New Encounter";
    setStarting(true);
    try {
      const encounter = await api.post<{ id: number }>("/api/encounters", {
        campaignId,
        name: encounterName,
      });

      type PartPayload = {
        encounterId: number;
        entityId: number;
        entityType: "character" | "npc";
        name: string;
        hpMax: number;
        hpCurrent: number;
        armorClass: number;
        turnOrder: number;
      };
      const payloads: PartPayload[] = [];

      for (const c of party.filter((p) => included.has(p.id))) {
        payloads.push({
          encounterId: encounter.id,
          entityId: c.id,
          entityType: "character",
          name: c.name,
          hpMax: c.hpMax,
          hpCurrent: c.hpMax,
          armorClass: c.armorClass,
          turnOrder: payloads.length,
        });
      }
      for (const m of monsters) {
        const n = counts[m.id] ?? 0;
        for (let i = 0; i < n; i++) {
          payloads.push({
            encounterId: encounter.id,
            entityId: m.id,
            entityType: "npc",
            name: n > 1 ? `${m.name} ${i + 1}` : m.name,
            hpMax: m.hpMax,
            hpCurrent: m.hpMax,
            armorClass: m.armorClass,
            turnOrder: payloads.length,
          });
        }
      }

      await Promise.all(payloads.map((p) => api.post("/api/participants", p)));
      toast.success(`Started "${encounterName}" with ${payloads.length} combatants`);
      router.push(`/campaign/${campaignId}/combat`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start encounter");
      setStarting(false);
    }
  }

  if (party.length === 0 && monsters.length === 0) {
    return (
      <EmptyState
        icon={Swords}
        title="Nothing to build with yet"
        description="Add some player characters and import monsters into your Bestiary, then come back to plan a balanced fight."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Difficulty meter */}
      <DifficultyMeter rating={rating} monsterTotal={monsterTotal} partySize={partyLevels.length} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Party */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 font-heading font-semibold">
            <Users className="size-4 text-primary" /> Party
            <span className="text-sm font-normal text-muted-foreground">
              ({partyLevels.length} of {party.length})
            </span>
          </h2>
          {party.length === 0 ? (
            <p className="text-sm text-muted-foreground">No player characters yet.</p>
          ) : (
            <div className="space-y-1">
              {party.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-accent"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Checkbox checked={included.has(c.id)} onCheckedChange={() => toggleChar(c.id)} />
                    {c.name}
                  </span>
                  <Badge variant="secondary">Lvl {c.level}</Badge>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* Monsters */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 font-heading font-semibold">
            <Skull className="size-4 text-primary" /> Monsters
            {monsterTotal > 0 ? (
              <span className="text-sm font-normal text-muted-foreground">({monsterTotal} added)</span>
            ) : null}
          </h2>
          {monsters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No monsters yet — import SRD monsters from the Bestiary first.
            </p>
          ) : (
            <>
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search monsters…"
                  className="pl-8"
                />
              </div>
              <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
                {filtered.map((m) => {
                  const n = counts[m.id] ?? 0;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-sm",
                        n > 0 ? "border-primary/40 bg-primary/5" : "border-border",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="font-medium">{m.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {m.cr ? `CR ${m.cr} · ` : ""}{m.xp.toLocaleString()} XP
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <Button size="icon" variant="outline" className="size-7" onClick={() => setCount(m.id, n - 1)} disabled={n === 0} aria-label={`Remove ${m.name}`}>
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-5 text-center tabular-nums">{n}</span>
                        <Button size="icon" variant="outline" className="size-7" onClick={() => setCount(m.id, n + 1)} aria-label={`Add ${m.name}`}>
                          <Plus className="size-3.5" />
                        </Button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Start bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Encounter name (e.g. Ambush at the bridge)"
          className="sm:max-w-xs"
        />
        <Button onClick={start} disabled={starting}>
          <Swords className="size-4" />
          {starting ? "Starting…" : "Start this encounter"}
        </Button>
      </div>
    </div>
  );
}

function DifficultyMeter({
  rating,
  monsterTotal,
  partySize,
}: {
  rating: ReturnType<typeof rateEncounter>;
  monsterTotal: number;
  partySize: number;
}) {
  const tiers = [
    { key: "Easy", value: rating.thresholds.easy },
    { key: "Medium", value: rating.thresholds.medium },
    { key: "Hard", value: rating.thresholds.hard },
    { key: "Deadly", value: rating.thresholds.deadly },
  ] as const;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Difficulty</p>
          <p className={cn("font-heading text-3xl font-semibold", DIFFICULTY_STYLES[rating.difficulty])}>
            {partySize === 0 ? "Add party" : monsterTotal === 0 ? "—" : rating.difficulty}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Adjusted XP:{" "}
          <span className="font-medium text-foreground tabular-nums">
            {rating.adjustedXp.toLocaleString()}
          </span>{" "}
          {rating.multiplier !== 1 ? `(${rating.totalXp.toLocaleString()} × ${rating.multiplier})` : null}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {tiers.map((t) => {
          const active = rating.difficulty === t.key;
          return (
            <div
              key={t.key}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-center",
                active ? "border-primary bg-primary/10" : "border-border bg-muted/30",
              )}
            >
              <p className={cn("text-xs font-medium", active ? DIFFICULTY_STYLES[t.key] : "text-muted-foreground")}>
                {t.key}
              </p>
              <p className="text-sm tabular-nums">{t.value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Thresholds are the party&apos;s total XP budget for each difficulty. The fight&apos;s adjusted XP is
        compared against them.
      </p>
    </div>
  );
}
