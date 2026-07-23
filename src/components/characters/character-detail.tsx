"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Pencil, Heart, Shield, Gauge, Zap, Eye, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HpBar } from "@/components/shared/hp-bar";
import { EntityActions } from "@/components/shared/entity-actions";
import { SpellsTab } from "@/components/characters/spells-tab";
import { InventoryTab } from "@/components/characters/inventory-tab";
import { ABILITIES, SKILLS, EXHAUSTION_EFFECTS, hitDieForClass } from "@/lib/constants";
import { abilityModifier, formatModifier } from "@/lib/dnd";
import { api } from "@/lib/client";
import type { AbilityKey } from "@/lib/constants";
import type { Character, MagicItem, SpellSlot } from "@/db/schema";
import type { Currency } from "@/db/schema";

export function CharacterDetail({
  character,
  campaignId,
}: {
  character: Character;
  campaignId: number;
}) {
  const prof = character.proficiencyBonus;
  const scores: Record<AbilityKey, number> = {
    str: character.str,
    dex: character.dex,
    con: character.con,
    int: character.int,
    wis: character.wis,
    cha: character.cha,
  };

  const classLine = [
    character.race,
    character.class && `${character.class}${character.subclass ? ` (${character.subclass})` : ""}`,
    character.background,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">{character.name}</h1>
            <Badge variant="secondary">Level {character.level}</Badge>
          </div>
          <p className="mt-1 text-muted-foreground">{classLine || "Adventurer"}</p>
          {character.alignment ? (
            <p className="text-sm text-muted-foreground">{character.alignment}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/campaign/${campaignId}/characters/${character.id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </Button>
          <EntityActions
            deleteEndpoint={`/api/characters/${character.id}`}
            entityLabel="Character"
            redirectTo={`/campaign/${campaignId}/characters`}
          />
        </div>
      </div>

      {/* Conditions banner */}
      {(character.conditions.length > 0 || character.exhaustionLevel > 0) && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
          <span className="text-sm font-medium text-amber-300">Conditions:</span>
          {character.conditions.map((c) => (
            <Badge key={c} className="bg-amber-500/20 text-amber-200">{c}</Badge>
          ))}
          {character.exhaustionLevel > 0 ? (
            <Badge className="bg-destructive/20 text-red-200">
              Exhaustion {character.exhaustionLevel} — {EXHAUSTION_EFFECTS[character.exhaustionLevel]}
            </Badge>
          ) : null}
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex w-full flex-wrap justify-start gap-1 h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="abilities">Abilities</TabsTrigger>
          <TabsTrigger value="spells">Spells</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="magic-items">Magic Items</TabsTrigger>
          <TabsTrigger value="background">Background</TabsTrigger>
          <TabsTrigger value="features">Features &amp; Feats</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile icon={Shield} label="Armor Class" value={character.armorClass} />
            <StatTile icon={Gauge} label="Speed" value={`${character.speed} ft`} />
            <StatTile icon={Zap} label="Initiative" value={character.initiative} />
            <StatTile icon={Zap} label="Initiative Bonus" value={formatModifier(character.initiativeBonus)} />
            <StatTile icon={Eye} label="Passive Perception" value={character.passivePerception} />
            <StatTile icon={Award} label="Proficiency" value={formatModifier(prof)} />
            <StatTile icon={Heart} label="Experience" value={character.experiencePoints} />
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <HpBar current={character.hpCurrent} max={character.hpMax} temp={character.hpTemp} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DefenseList title="Resistances" items={character.resistances} tone="text-blue-300" />
            <DefenseList title="Immunities" items={character.immunities} tone="text-green-300" />
            <DefenseList title="Vulnerabilities" items={character.vulnerabilities} tone="text-red-300" />
          </div>

          <ChipSection title="Languages" items={character.languages} />

          {/* Currency */}
          <CurrencyTracker characterId={character.id} initial={character.currency as Currency} />

          {/* Hit Dice & Rests */}
          <HitDiceTracker
            characterId={character.id}
            level={character.level}
            initialTotal={character.hitDiceTotal}
            initialUsed={character.hitDiceUsed}
            initialHp={character.hpCurrent}
            initialExhaustion={character.exhaustionLevel}
            hpMax={character.hpMax}
            conMod={abilityModifier(character.con)}
            hitDie={hitDieForClass(character.class)}
          />
        </TabsContent>

        {/* Abilities */}
        <TabsContent value="abilities" className="space-y-6">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {ABILITIES.map((a) => {
              const score = scores[a.key];
              return (
                <div key={a.key} className="rounded-xl border border-border bg-card p-3 text-center">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{a.short}</p>
                  <p className="text-2xl font-semibold tabular-nums">{score}</p>
                  <p className="text-sm font-medium text-primary">{formatModifier(abilityModifier(score))}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 font-medium">Saving Throws</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {ABILITIES.map((a) => {
                  const proficient = character.savingThrowProficiencies.includes(a.key);
                  const bonus = abilityModifier(scores[a.key]) + (proficient ? prof : 0);
                  return (
                    <div key={a.key} className="flex items-center justify-between rounded-md px-2 py-1 text-sm odd:bg-muted/40">
                      <span className="flex items-center gap-1.5">
                        <span className={`size-2 rounded-full ${proficient ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        {a.label}
                      </span>
                      <span className="font-medium tabular-nums">{formatModifier(bonus)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 font-medium">Skills</h3>
              <div className="grid grid-cols-1 gap-1">
                {SKILLS.map((s) => {
                  const proficient = character.skillProficiencies.includes(s.key);
                  const bonus = abilityModifier(scores[s.ability]) + (proficient ? prof : 0);
                  return (
                    <div key={s.key} className="flex items-center justify-between rounded-md px-2 py-1 text-sm odd:bg-muted/40">
                      <span className="flex items-center gap-1.5">
                        <span className={`size-2 rounded-full ${proficient ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        {s.label}
                        <span className="text-xs uppercase text-muted-foreground">{s.ability}</span>
                      </span>
                      <span className="font-medium tabular-nums">{formatModifier(bonus)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="spells">
          <SpellsTab ownerId={character.id} ownerType="character" />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryTab ownerId={character.id} ownerType="character" />
        </TabsContent>

        <TabsContent value="magic-items">
          <CharacterMagicItemsTab characterId={character.id} campaignId={campaignId} />
        </TabsContent>

        {/* Background */}
        <TabsContent value="background" className="space-y-4">
          <TextBlock title="Personality Traits" text={character.personalityTraits} />
          <TextBlock title="Ideals" text={character.ideals} />
          <TextBlock title="Bonds" text={character.bonds} />
          <TextBlock title="Flaws" text={character.flaws} />
        </TabsContent>

        {/* Features & feats */}
        <TabsContent value="features" className="space-y-6">
          <EntryList title="Features & Traits" entries={character.featuresAndTraits} empty="No features recorded." />
          <EntryList title="Feats" entries={character.feats} empty="No feats recorded." />
          {character.multiclassInfo.length > 0 ? (
            <div>
              <h3 className="mb-2 font-medium">Multiclassing</h3>
              <div className="flex flex-wrap gap-2">
                {character.multiclassInfo.map((m, i) => (
                  <Badge key={i} variant="secondary">
                    {m.className}{m.subclass ? ` (${m.subclass})` : ""} {m.level}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="notes">
          {character.notes ? (
            <div className="whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm">
              {character.notes}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No notes.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function DefenseList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((i) => (
            <span key={i} className={`rounded-full border border-border bg-muted px-2 py-0.5 text-xs ${tone}`}>{i}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ChipSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((i) => (
            <Badge key={i} variant="secondary">{i}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-1 text-sm font-medium">{title}</h3>
      {text ? (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{text}</p>
      ) : (
        <p className="text-sm text-muted-foreground/60">—</p>
      )}
    </div>
  );
}

function EntryList({ title, entries, empty }: { title: string; entries: { name: string; description: string }[]; empty: string }) {
  return (
    <div>
      <h3 className="mb-2 font-medium">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3">
              <p className="font-medium">{e.name}</p>
              {e.description ? (
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{e.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Currency tracker ─────────────────────────────────────────────────────── */

const COINS = [
  { key: "pp" as const, label: "PP", color: "text-purple-300" },
  { key: "gp" as const, label: "GP", color: "text-amber-300" },
  { key: "ep" as const, label: "EP", color: "text-blue-300" },
  { key: "sp" as const, label: "SP", color: "text-slate-300" },
  { key: "cp" as const, label: "CP", color: "text-orange-300" },
];

function CurrencyTracker({ characterId, initial }: { characterId: number; initial: Currency | null }) {
  const defaultCurrency: Currency = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
  const [currency, setCurrency] = useState<Currency>(initial ?? defaultCurrency);
  const [editing, setEditing] = useState<Record<string, string>>({});

  async function save(updated: Currency) {
    setCurrency(updated);
    try {
      await api.patch(`/api/characters/${characterId}`, { currency: updated });
    } catch {
      toast.error("Failed to save currency");
    }
  }

  function startEdit(key: keyof Currency) {
    setEditing((prev) => ({ ...prev, [key]: String(currency[key]) }));
  }

  function commitEdit(key: keyof Currency) {
    const raw = editing[key];
    if (raw === undefined) return;
    const val = Math.max(0, parseInt(raw, 10) || 0);
    const updated = { ...currency, [key]: val };
    setEditing((prev) => { const n = { ...prev }; delete n[key]; return n; });
    save(updated);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 font-medium">Currency</h3>
      <div className="grid grid-cols-5 gap-2">
        {COINS.map(({ key, label, color }) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <span className={`text-xs font-bold ${color}`}>{label}</span>
            {key in editing ? (
              <input
                autoFocus
                type="number"
                min={0}
                value={editing[key]}
                onChange={(e) => setEditing((prev) => ({ ...prev, [key]: e.target.value }))}
                onBlur={() => commitEdit(key)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Tab") commitEdit(key); }}
                className="w-full rounded border border-primary bg-background px-1 py-1.5 text-center text-sm font-semibold tabular-nums outline-none"
              />
            ) : (
              <button
                onClick={() => startEdit(key)}
                className="w-full rounded border border-border bg-muted/40 px-1 py-1.5 text-center text-sm font-semibold tabular-nums hover:border-primary/50 hover:bg-muted"
              >
                {currency[key]}
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground text-center">Click a value to edit</p>
    </div>
  );
}

/* ── Hit dice & rests ─────────────────────────────────────────────────────── */

function HitDiceTracker({
  characterId,
  level,
  initialTotal,
  initialUsed,
  initialHp,
  initialExhaustion,
  hpMax,
  conMod,
  hitDie,
}: {
  characterId: number;
  level: number;
  initialTotal: number;
  initialUsed: number;
  initialHp: number;
  initialExhaustion: number;
  hpMax: number;
  conMod: number;
  hitDie: number;
}) {
  const [used, setUsed] = useState(initialUsed);
  const [hp, setHp] = useState(initialHp);
  const [exhaustion, setExhaustion] = useState(initialExhaustion);
  const total = initialTotal > 0 ? initialTotal : level;
  const available = Math.max(0, total - used);

  async function spendHitDie() {
    if (available <= 0) { toast.error("No hit dice remaining"); return; }
    const roll = Math.floor(Math.random() * hitDie) + 1;
    const healed = Math.max(1, roll + conMod);
    const newHp = Math.min(hpMax, hp + healed);
    const newUsed = used + 1;
    setUsed(newUsed);
    setHp(newHp);
    toast.success(`Spent hit die — rolled d${hitDie} (${roll}) + CON ${conMod} = +${healed} HP`);
    try {
      await api.patch(`/api/characters/${characterId}`, { hitDiceUsed: newUsed, hpCurrent: newHp });
    } catch {
      toast.error("Failed to save");
    }
  }

  async function longRest() {
    // Recover HP to full, half your hit dice (min 1), one level of exhaustion,
    // clear temp HP / death saves, and reset all spell slots.
    const newUsed = Math.max(0, used - Math.max(1, Math.floor(total / 2)));
    const nextExhaustion = Math.max(0, exhaustion - 1);
    setUsed(newUsed);
    setHp(hpMax);
    setExhaustion(nextExhaustion);
    try {
      await api.patch(`/api/characters/${characterId}`, {
        hitDiceUsed: newUsed,
        hpCurrent: hpMax,
        hpTemp: 0,
        exhaustionLevel: nextExhaustion,
        deathSaveSuccesses: 0,
        deathSaveFailures: 0,
      });
      const slots = await api.get<SpellSlot[]>(
        `/api/spell-slots?ownerId=${characterId}&ownerType=character`,
      );
      await Promise.all(
        slots
          .filter((s) => s.used > 0)
          .map((s) => api.patch(`/api/spell-slots/${s.id}`, { used: 0 })),
      );
      toast.success("Long rest taken — HP, hit dice and spell slots restored");
    } catch {
      toast.error("Failed to save");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 font-medium">Hit Dice &amp; Rests</h3>
      <div className="mb-3 flex items-center gap-3">
        <div className="text-center">
          <p className="text-2xl font-semibold tabular-nums">{available}</p>
          <p className="text-xs text-muted-foreground">available / {total}</p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={`size-5 rounded-sm border ${
                i < available
                  ? "border-primary bg-primary/20"
                  : "border-border bg-muted/20 opacity-40"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={spendHitDie}
          disabled={available <= 0}
        >
          Short Rest (spend 1d{hitDie})
        </Button>
        <Button variant="outline" size="sm" onClick={longRest}>
          Long Rest
        </Button>
      </div>
    </div>
  );
}

/* ── Character Magic Items tab ────────────────────────────────────────────── */

function CharacterMagicItemsTab({ characterId, campaignId }: { characterId: number; campaignId: number }) {
  const [items, setItems] = useState<MagicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/magic-items?campaignId=${campaignId}&characterId=${characterId}`)
      .then((r) => r.json())
      .then((items: MagicItem[]) => setItems(items))
      .catch(() => toast.error("Failed to load magic items"))
      .finally(() => setLoading(false));
  }, [characterId, campaignId]);

  if (loading) return <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Sparkles className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No magic items assigned to this character.</p>
        <p className="text-xs text-muted-foreground">Assign items on the Magic Items page.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs capitalize text-muted-foreground">{item.rarity} · {item.itemType}</p>
          {item.description && (
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.requiresAttunement && (
              <Badge variant="secondary" className={item.isAttuned ? "bg-primary/15 text-primary" : ""}>
                {item.isAttuned ? "Attuned" : "Needs Attunement"}
              </Badge>
            )}
            {item.isCursed && <Badge variant="destructive">Cursed</Badge>}
            {item.charges !== null && (
              <Badge variant="outline">{item.charges}{item.chargesMax !== null ? `/${item.chargesMax}` : ""} charges</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
