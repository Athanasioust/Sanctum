import { Badge } from "@/components/ui/badge";
import { HpBar } from "@/components/shared/hp-bar";
import { ABILITIES, SKILLS, EXHAUSTION_EFFECTS } from "@/lib/constants";
import {
  abilityModifier,
  formatModifier,
  proficiencyBonusForCR,
} from "@/lib/dnd";
import type { AbilityKey } from "@/lib/constants";
import type { Npc, StatBlockAction } from "@/db/schema";

export function StatBlock({ npc }: { npc: Npc }) {
  const prof = proficiencyBonusForCR(npc.challengeRating || "0");
  const scores: Record<AbilityKey, number> = {
    str: npc.str, dex: npc.dex, con: npc.con, int: npc.int, wis: npc.wis, cha: npc.cha,
  };

  const saves = ABILITIES.filter((a) => npc.savingThrowProficiencies.includes(a.key)).map(
    (a) => `${a.short} ${formatModifier(abilityModifier(scores[a.key]) + prof)}`,
  );
  const skills = SKILLS.filter((s) => npc.skillProficiencies.includes(s.key)).map(
    (s) => `${s.label} ${formatModifier(abilityModifier(scores[s.ability]) + prof)}`,
  );

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
          {ABILITIES.map((a) => (
            <div key={a.key} className="text-center">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{a.short}</p>
              <p className="font-semibold tabular-nums">{scores[a.key]}</p>
              <p className="text-xs text-primary">{formatModifier(abilityModifier(scores[a.key]))}</p>
            </div>
          ))}
        </div>

        <dl className="space-y-1.5 text-sm">
          {saves.length > 0 ? <Line term="Saving Throws" desc={saves.join(", ")} /> : null}
          {skills.length > 0 ? <Line term="Skills" desc={skills.join(", ")} /> : null}
          {npc.resistances.length > 0 ? <Line term="Resistances" desc={npc.resistances.join(", ")} /> : null}
          {npc.immunities.length > 0 ? <Line term="Immunities" desc={npc.immunities.join(", ")} /> : null}
          {npc.vulnerabilities.length > 0 ? <Line term="Vulnerabilities" desc={npc.vulnerabilities.join(", ")} /> : null}
          {npc.senses.length > 0 ? <Line term="Senses" desc={npc.senses.join(", ")} /> : null}
          {npc.languages.length > 0 ? <Line term="Languages" desc={npc.languages.join(", ")} /> : null}
        </dl>
      </div>

      <ActionGroup title="Traits" entries={npc.traits} />
      <ActionGroup title="Actions" entries={npc.actions} />
      <ActionGroup title="Reactions" entries={npc.reactions} />
      <ActionGroup title="Legendary Actions" entries={npc.legendaryActions} />
      <ActionGroup title="Lair Actions" entries={npc.lairActions} />

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

function ActionGroup({ title, entries }: { title: string; entries: StatBlockAction[] }) {
  if (!entries || entries.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-2 font-heading text-base font-semibold text-primary">{title}</h3>
      <div className="space-y-2">
        {entries.map((e, i) => (
          <p key={i} className="text-sm">
            <span className="font-semibold italic">{e.name}. </span>
            <span className="whitespace-pre-wrap text-muted-foreground">{e.description}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
