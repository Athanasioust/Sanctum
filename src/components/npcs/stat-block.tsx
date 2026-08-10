"use client";

import { Badge } from "@/components/ui/badge";
import { HpBar } from "@/components/shared/hp-bar";
import { rollDice } from "@/components/dice/dice-roller";
import { RollableFormula } from "@/components/dice/rollable-stat";
import { RollableText } from "@/components/dice/rollable-text";
import { ABILITIES, SKILLS, EXHAUSTION_EFFECTS } from "@/lib/constants";
import { checkFormula } from "@/lib/dice";
import {
  abilityModifier,
  formatModifier,
  proficiencyBonusForCR,
} from "@/lib/dnd";
import type { AbilityKey } from "@/lib/constants";
import type { Npc, StatBlockAction } from "@/db/schema";

/** A named d20 check with its bonus, e.g. a monster's proficient save or skill. */
type NamedCheck = { name: string; bonus: number };

export function StatBlock({ npc }: { npc: Npc }) {
  const prof = proficiencyBonusForCR(npc.challengeRating || "0");
  const scores: Record<AbilityKey, number> = {
    str: npc.str, dex: npc.dex, con: npc.con, int: npc.int, wis: npc.wis, cha: npc.cha,
  };

  const saves: NamedCheck[] = ABILITIES.filter((a) =>
    npc.savingThrowProficiencies.includes(a.key),
  ).map((a) => ({
    name: `${a.short} save`,
    bonus: abilityModifier(scores[a.key]) + prof,
  }));
  const skills: NamedCheck[] = SKILLS.filter((s) =>
    npc.skillProficiencies.includes(s.key),
  ).map((s) => ({
    name: s.label,
    bonus: abilityModifier(scores[s.ability]) + prof,
  }));

  const typeLine = [npc.size, npc.race || (npc.type === "monster" ? "monster" : "NPC"), npc.alignment]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-5">
      {/* Conditions banner */}
      {(npc.conditions.length > 0 || npc.exhaustionLevel > 0) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
          {npc.conditions.map((c) => (
            <Badge key={c} className="bg-amber-500/20 text-amber-200">{c}</Badge>
          ))}
          {npc.exhaustionLevel > 0 ? (
            <Badge className="bg-destructive/20 text-red-200">
              Exhaustion {npc.exhaustionLevel} — {EXHAUSTION_EFFECTS[npc.exhaustionLevel]}
            </Badge>
          ) : null}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm italic text-muted-foreground">{typeLine}</p>

        <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Armor Class" value={npc.armorClass} />
          <Stat label="Hit Points" value={`${npc.hpMax}`} />
          <Stat label="Speed" value={npc.speed} />
          <Stat label="Challenge" value={npc.challengeRating ? `${npc.challengeRating} (${npc.experiencePoints.toLocaleString()} XP)` : "—"} />
        </div>

        <HpBar current={npc.hpCurrent} max={npc.hpMax} />

        {/* Ability scores */}
        <div className="my-4 grid grid-cols-6 gap-2 border-y border-border py-3">
          {ABILITIES.map((a) => {
            const mod = abilityModifier(scores[a.key]);
            return (
              <button
                key={a.key}
                type="button"
                onClick={() =>
                  rollDice({
                    formula: checkFormula(mod),
                    label: `${a.label} check`,
                    actorName: npc.name,
                  })
                }
                title={`Roll a ${a.label} check`}
                className="rounded-lg py-1 text-center transition-colors hover:bg-primary/10"
              >
                <p className="text-xs font-semibold uppercase text-muted-foreground">{a.short}</p>
                <p className="font-semibold tabular-nums">{scores[a.key]}</p>
                <p className="text-xs text-primary">{formatModifier(mod)}</p>
              </button>
            );
          })}
        </div>

        <dl className="space-y-1.5 text-sm">
          {saves.length > 0 ? <CheckLine term="Saving Throws" checks={saves} actorName={npc.name} /> : null}
          {skills.length > 0 ? <CheckLine term="Skills" checks={skills} actorName={npc.name} /> : null}
          {npc.resistances.length > 0 ? <Line term="Resistances" desc={npc.resistances.join(", ")} /> : null}
          {npc.immunities.length > 0 ? <Line term="Immunities" desc={npc.immunities.join(", ")} /> : null}
          {npc.vulnerabilities.length > 0 ? <Line term="Vulnerabilities" desc={npc.vulnerabilities.join(", ")} /> : null}
          {npc.senses.length > 0 ? <Line term="Senses" desc={npc.senses.join(", ")} /> : null}
          {npc.languages.length > 0 ? <Line term="Languages" desc={npc.languages.join(", ")} /> : null}
        </dl>
      </div>

      <ActionGroup title="Traits" entries={npc.traits} actorName={npc.name} />
      <ActionGroup title="Actions" entries={npc.actions} actorName={npc.name} />
      <ActionGroup title="Reactions" entries={npc.reactions} actorName={npc.name} />
      <ActionGroup title="Legendary Actions" entries={npc.legendaryActions} actorName={npc.name} />
      <ActionGroup title="Lair Actions" entries={npc.lairActions} actorName={npc.name} />

      {npc.notes ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-1 text-sm font-medium">DM Notes</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{npc.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Line({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="flex gap-2">
      <dt className="font-semibold text-foreground">{term}</dt>
      <dd className="text-muted-foreground">{desc}</dd>
    </div>
  );
}

/** Proficient saves/skills, each clickable to roll `1d20 + bonus`. */
function CheckLine({
  term,
  checks,
  actorName,
}: {
  term: string;
  checks: NamedCheck[];
  actorName: string;
}) {
  return (
    <div className="flex gap-2">
      <dt className="font-semibold text-foreground">{term}</dt>
      <dd className="text-muted-foreground">
        {checks.map((check, i) => (
          <span key={check.name}>
            {i > 0 ? ", " : ""}
            {check.name}{" "}
            <RollableFormula
              formula={checkFormula(check.bonus)}
              label={check.name}
              actorName={actorName}
              display={formatModifier(check.bonus)}
            />
          </span>
        ))}
      </dd>
    </div>
  );
}

function ActionGroup({
  title,
  entries,
  actorName,
}: {
  title: string;
  entries: StatBlockAction[];
  actorName: string;
}) {
  if (!entries || entries.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-2 font-heading text-base font-semibold text-primary">{title}</h3>
      <div className="space-y-2">
        {entries.map((e, i) => (
          <p key={i} className="text-sm">
            <span className="font-semibold italic">{e.name}. </span>
            <span className="whitespace-pre-wrap text-muted-foreground">
              <RollableText text={e.description} label={e.name} actorName={actorName} />
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}
