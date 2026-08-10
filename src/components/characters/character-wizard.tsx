"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dices,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/shared/form";
import { Combobox } from "@/components/shared/combobox";
import { CheckboxGroup } from "@/components/shared/checkbox-group";
import { useCampaignOptions } from "@/components/campaigns/campaign-options-context";
import { api } from "@/lib/client";
import { roll } from "@/lib/dice";
import {
  BACKGROUND_CATALOG,
  CLASS_CATALOG,
  RACE_CATALOG,
  optionsFor,
  subclassOptions,
  withCampaignValues,
} from "@/lib/character-options";
import {
  POINT_BUY_BUDGET,
  POINT_BUY_COST,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  STANDARD_ARRAY,
  classRules,
  pointBuySpent,
  startingHitPoints,
} from "@/lib/class-rules";
import { backgroundTraits, speciesTraits } from "@/lib/species-rules";
import { classLevels, syncSpellSlots } from "@/lib/spell-slot-sync";
import { ABILITIES, SKILLS } from "@/lib/constants";
import { abilityModifier, formatModifier, proficiencyBonusForLevel } from "@/lib/dnd";
import { cn } from "@/lib/utils";
import type { AbilityKey } from "@/lib/constants";
import type { Character } from "@/db/schema";

type AbilityScores = Record<AbilityKey, number>;
type ScoreMethod = "point-buy" | "standard-array" | "roll" | "manual";

const STEPS = [
  { key: "species", label: "Species" },
  { key: "class", label: "Class" },
  { key: "background", label: "Background" },
  { key: "abilities", label: "Ability Scores" },
  { key: "skills", label: "Skills" },
  { key: "review", label: "Review" },
] as const;

const BASE_SCORES: AbilityScores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
const SKILL_LABELS = new Map(SKILLS.map((s) => [s.key, s.label]));

export function CharacterWizard({ campaignId }: { campaignId: number }) {
  const router = useRouter();
  const { rulebooks, used } = useCampaignOptions();

  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [className, setClassName] = useState("");
  const [subclass, setSubclass] = useState("");
  const [level, setLevel] = useState(1);
  const [background, setBackground] = useState("");
  const [method, setMethod] = useState<ScoreMethod>("point-buy");
  const [base, setBase] = useState<AbilityScores>(BASE_SCORES);
  const [skills, setSkills] = useState<string[]>([]);

  const rules = classRules(className);
  const traits = speciesTraits(species);
  const bgTraits = backgroundTraits(background);

  /** Species bonuses are layered on top of the numbers the player assigned. */
  const finalScores = useMemo(() => {
    const result = { ...base };
    for (const [ability, bonus] of Object.entries(traits.abilityBonuses)) {
      result[ability as AbilityKey] += bonus ?? 0;
    }
    return result;
  }, [base, traits]);

  const proficiencyBonus = proficiencyBonusForLevel(level);
  const conMod = abilityModifier(finalScores.con);
  const hitDie = rules?.hitDie ?? 8;
  const hpMax = startingHitPoints(hitDie, conMod);

  // Background skills are granted outright; the class list is what the player
  // still gets to choose from, minus anything the background already covers.
  const grantedSkills = bgTraits.skills;
  const classSkillPool = rules?.skillChoices.from ?? SKILLS.map((s) => s.key);
  const classSkillCount = rules?.skillChoices.count ?? 2;
  const chosenClassSkills = skills.filter((s) => !grantedSkills.includes(s));
  const skillsRemaining = classSkillCount - chosenClassSkills.length;

  const raceChoices = useMemo(
    () => withCampaignValues(optionsFor(RACE_CATALOG, rulebooks).map((value) => ({ value })), used.races),
    [rulebooks, used.races],
  );
  const classChoices = useMemo(
    () => withCampaignValues(optionsFor(CLASS_CATALOG, rulebooks).map((value) => ({ value })), used.classes),
    [rulebooks, used.classes],
  );
  const backgroundChoices = useMemo(
    () => withCampaignValues(optionsFor(BACKGROUND_CATALOG, rulebooks).map((value) => ({ value })), used.backgrounds),
    [rulebooks, used.backgrounds],
  );
  const subclassChoices = useMemo(
    () => withCampaignValues(subclassOptions(className, rulebooks), used.subclasses),
    [className, rulebooks, used.subclasses],
  );

  const subclassDue = rules ? level >= rules.subclassLevel : level >= 3;

  function stepError(index: number): string | null {
    switch (STEPS[index].key) {
      case "species":
        return name.trim() ? null : "Give your character a name.";
      case "class":
        return className.trim() ? null : "Pick a class.";
      case "abilities":
        if (method === "point-buy" && pointBuySpent(base) > POINT_BUY_BUDGET) {
          return `You've spent ${pointBuySpent(base)} of ${POINT_BUY_BUDGET} points.`;
        }
        return null;
      case "skills":
        return skillsRemaining < 0
          ? `Pick ${classSkillCount} class skills — you've chosen ${chosenClassSkills.length}.`
          : null;
      default:
        return null;
    }
  }

  const currentError = stepError(step);
  const isLast = step === STEPS.length - 1;

  function next() {
    if (currentError) {
      toast.error(currentError);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  /**
   * Switching background swaps its granted skills in the ticked list, leaving
   * the player's own class picks untouched.
   */
  function chooseBackground(nextBackground: string) {
    const previous = backgroundTraits(background).skills;
    const granted = backgroundTraits(nextBackground).skills;
    setBackground(nextBackground);
    setSkills((current) => [
      ...new Set([...current.filter((s) => !previous.includes(s)), ...granted]),
    ]);
  }

  function applyMethod(nextMethod: ScoreMethod) {
    setMethod(nextMethod);
    if (nextMethod === "point-buy") setBase(BASE_SCORES);
    else if (nextMethod === "standard-array") {
      // Assign the array in ability order; the player reorders from there.
      const assigned = { ...BASE_SCORES };
      ABILITIES.forEach((a, i) => {
        assigned[a.key] = STANDARD_ARRAY[i];
      });
      setBase(assigned);
    } else if (nextMethod === "roll") {
      rollScores();
    }
  }

  /** 4d6 drop lowest, six times — the classic rolled array. */
  function rollScores() {
    const rolled = { ...BASE_SCORES };
    for (const ability of ABILITIES) {
      rolled[ability.key] = roll("4d6kh3").total;
    }
    setBase(rolled);
  }

  async function create() {
    const error = STEPS.map((_, i) => stepError(i)).find(Boolean);
    if (error) {
      toast.error(error);
      return;
    }

    setPending(true);
    try {
      const perceptionProficient = skills.includes("perception");
      const created = await api.post<Character>("/api/characters", {
        campaignId,
        name: name.trim(),
        race: species,
        class: className,
        subclass: subclassDue ? subclass : "",
        level,
        background,
        proficiencyBonus,
        ...finalScores,
        hpMax,
        hpCurrent: hpMax,
        armorClass: 10 + abilityModifier(finalScores.dex),
        speed: traits.speed,
        darkvision: traits.darkvision,
        initiativeBonus: abilityModifier(finalScores.dex),
        passivePerception:
          10 + abilityModifier(finalScores.wis) + (perceptionProficient ? proficiencyBonus : 0),
        savingThrowProficiencies: rules?.savingThrows ?? [],
        skillProficiencies: skills,
        languages: traits.languages,
        hitDiceTotal: level,
        hitDiceUsed: 0,
      });

      // Grant the spell slots this class and level should have.
      await syncSpellSlots(created.id, "character", classLevels(className, level, []));

      toast.success(`${created.name} created`);
      router.push(`/campaign/${campaignId}/characters/${created.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create character");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Progress */}
      <ol className="flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                i === step
                  ? "border-primary bg-primary/10 text-primary"
                  : i < step
                    ? "border-border text-muted-foreground hover:bg-muted"
                    : "border-border/50 text-muted-foreground/60 hover:bg-muted",
              )}
            >
              {i < step ? <Check className="size-3" /> : <span className="tabular-nums">{i + 1}</span>}
              {s.label}
            </button>
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-border bg-card p-5">
        {STEPS[step].key === "species" && (
          <StepPanel
            title="Who are they?"
            description="Species sets your speed, darkvision, starting languages and ability bonuses."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="wizard-name" required>
                <Input
                  id="wizard-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Character name"
                  autoFocus
                />
              </Field>
              <Field label="Species" htmlFor="wizard-species">
                <Combobox
                  id="wizard-species"
                  value={species}
                  onValueChange={setSpecies}
                  options={raceChoices}
                  placeholder="Select a species"
                />
              </Field>
            </div>

            {species && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(traits.abilityBonuses).map(([ability, bonus]) => (
                    <Badge key={ability} variant="secondary">
                      {ability.toUpperCase()} +{bonus}
                    </Badge>
                  ))}
                  <Badge variant="secondary">Speed {traits.speed} ft</Badge>
                  {traits.darkvision > 0 && (
                    <Badge variant="secondary">Darkvision {traits.darkvision} ft</Badge>
                  )}
                  {traits.languages.map((l) => (
                    <Badge key={l} variant="secondary">{l}</Badge>
                  ))}
                </div>
                {traits.flexible && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {traits.flexible} — set these yourself on the Ability Scores step.
                  </p>
                )}
              </div>
            )}
          </StepPanel>
        )}

        {STEPS[step].key === "class" && (
          <StepPanel
            title="What do they do?"
            description="Class sets your hit die, saving throws and spellcasting."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Class" htmlFor="wizard-class" required>
                <Combobox
                  id="wizard-class"
                  value={className}
                  onValueChange={setClassName}
                  options={classChoices}
                  placeholder="Select a class"
                />
              </Field>
              <Field label="Level">
                <Select value={String(level)} onValueChange={(v) => setLevel(Number(v))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((l) => (
                      <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {subclassDue && (
                <Field
                  label={rules?.subclassLabel ?? "Subclass"}
                  htmlFor="wizard-subclass"
                  className="sm:col-span-2"
                  hint={
                    rules
                      ? `${rules.name}s choose this at level ${rules.subclassLevel}.`
                      : undefined
                  }
                >
                  <Combobox
                    id="wizard-subclass"
                    value={subclass}
                    onValueChange={setSubclass}
                    options={subclassChoices}
                    placeholder="Select a subclass"
                  />
                </Field>
              )}
            </div>

            {rules && (
              <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <Badge variant="secondary">Hit die d{rules.hitDie}</Badge>
                <Badge variant="secondary">
                  Saves: {rules.savingThrows.map((s) => s.toUpperCase()).join(", ")}
                </Badge>
                {rules.caster !== "none" && (
                  <Badge variant="secondary">
                    {rules.caster === "pact" ? "Pact Magic" : `${rules.caster} caster`}
                  </Badge>
                )}
                <Badge variant="secondary">Proficiency {formatModifier(proficiencyBonus)}</Badge>
              </div>
            )}
            {!rules && className && (
              <InfoNote>
                {className} isn&apos;t a class Sanctum knows, so hit die, saves and spell
                slots are left for you to fill in. Everything else still works.
              </InfoNote>
            )}
          </StepPanel>
        )}

        {STEPS[step].key === "background" && (
          <StepPanel
            title="Where did they come from?"
            description="Background grants a couple of skill proficiencies."
          >
            <Field label="Background" htmlFor="wizard-background" className="sm:max-w-sm">
              <Combobox
                id="wizard-background"
                value={background}
                onValueChange={chooseBackground}
                options={backgroundChoices}
                placeholder="Select a background"
              />
            </Field>
            {background && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                {grantedSkills.length > 0 ? (
                  <p>
                    Grants{" "}
                    <span className="font-medium">
                      {grantedSkills.map((s) => SKILL_LABELS.get(s) ?? s).join(" and ")}
                    </span>
                    .
                  </p>
                ) : (
                  <p className="text-muted-foreground">No fixed skills.</p>
                )}
                {bgTraits.note && (
                  <p className="mt-1 text-xs text-muted-foreground">{bgTraits.note}</p>
                )}
              </div>
            )}
          </StepPanel>
        )}

        {STEPS[step].key === "abilities" && (
          <StepPanel
            title="Ability scores"
            description="Species bonuses are added on top of the numbers you assign here."
          >
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["point-buy", "Point buy"],
                  ["standard-array", "Standard array"],
                  ["roll", "Roll 4d6"],
                  ["manual", "Manual"],
                ] as [ScoreMethod, string][]
              ).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={method === value ? "default" : "outline"}
                  onClick={() => applyMethod(value)}
                >
                  {label}
                </Button>
              ))}
              {method === "roll" && (
                <Button type="button" size="sm" variant="ghost" onClick={rollScores}>
                  <RotateCcw className="size-3" /> Reroll
                </Button>
              )}
            </div>

            {method === "point-buy" && <PointBuyMeter scores={base} />}
            {method === "standard-array" && (
              <p className="text-xs text-muted-foreground">
                Standard array: {STANDARD_ARRAY.join(", ")} — assign them however you like.
              </p>
            )}
            {method === "roll" && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Dices className="size-3" /> Rolled 4d6, dropping the lowest die, for each ability.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {ABILITIES.map((ability) => (
                <AbilityCard
                  key={ability.key}
                  label={ability.short}
                  fullLabel={ability.label}
                  value={base[ability.key]}
                  bonus={traits.abilityBonuses[ability.key] ?? 0}
                  total={finalScores[ability.key]}
                  method={method}
                  onChange={(value) => setBase((s) => ({ ...s, [ability.key]: value }))}
                />
              ))}
            </div>
          </StepPanel>
        )}

        {STEPS[step].key === "skills" && (
          <StepPanel
            title="Skill proficiencies"
            description={
              rules
                ? `${rules.name}s choose ${classSkillCount} skills. Background skills are already ticked.`
                : "Pick the skills this character is proficient in."
            }
          >
            {grantedSkills.length > 0 && (
              <p className="text-xs text-muted-foreground">
                From {background}:{" "}
                {grantedSkills.map((s) => SKILL_LABELS.get(s) ?? s).join(", ")}
              </p>
            )}
            <p
              className={cn(
                "text-sm font-medium",
                skillsRemaining === 0 ? "text-primary" : skillsRemaining < 0 ? "text-destructive" : "",
              )}
            >
              {skillsRemaining > 0
                ? `${skillsRemaining} class skill${skillsRemaining === 1 ? "" : "s"} left to choose`
                : skillsRemaining === 0
                  ? "All class skills chosen"
                  : `${-skillsRemaining} too many chosen`}
            </p>
            <CheckboxGroup
              columns={3}
              options={SKILLS.map((s) => ({
                value: s.key,
                label: classSkillPool.includes(s.key) ? s.label : `${s.label} (off-list)`,
              }))}
              value={skills}
              onChange={setSkills}
            />
          </StepPanel>
        )}

        {STEPS[step].key === "review" && (
          <StepPanel title="Review" description="Everything the wizard will create.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Summary label="Name" value={name || "—"} />
              <Summary label="Species" value={species || "—"} />
              <Summary label="Class" value={className ? `${className} ${level}` : "—"} />
              <Summary label={rules?.subclassLabel ?? "Subclass"} value={(subclassDue && subclass) || "—"} />
              <Summary label="Background" value={background || "—"} />
              <Summary label="Max HP" value={`${hpMax} (d${hitDie}${formatModifier(conMod)})`} />
              <Summary label="Armor Class" value={String(10 + abilityModifier(finalScores.dex))} />
              <Summary label="Proficiency" value={formatModifier(proficiencyBonus)} />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ABILITIES.map((a) => (
                <div key={a.key} className="rounded-lg border border-border bg-muted/40 p-2 text-center">
                  <p className="text-xs uppercase text-muted-foreground">{a.short}</p>
                  <p className="text-lg font-semibold tabular-nums">{finalScores[a.key]}</p>
                  <p className="text-xs text-primary">
                    {formatModifier(abilityModifier(finalScores[a.key]))}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-sm">
              <ReviewLine
                label="Saving throws"
                value={rules?.savingThrows.map((s) => s.toUpperCase()).join(", ") || "None set"}
              />
              <ReviewLine
                label="Skills"
                value={
                  skills.length
                    ? skills.map((s) => SKILL_LABELS.get(s) ?? s).join(", ")
                    : "None"
                }
              />
              <ReviewLine label="Languages" value={traits.languages.join(", ")} />
              <ReviewLine label="Hit dice" value={`${level}d${hitDie}`} />
              {rules && rules.caster !== "none" && (
                <ReviewLine label="Spell slots" value="Granted automatically for this class and level" />
              )}
            </div>
          </StepPanel>
        )}
      </div>

      {currentError && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <TriangleAlert className="size-4" /> {currentError}
        </p>
      )}

      {/* Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-5 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <Button variant="ghost" asChild>
            <Link href={`/campaign/${campaignId}/characters/new/advanced`}>
              Use the full form instead
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || pending}
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            {isLast ? (
              <Button onClick={create} disabled={pending}>
                <Sparkles className="size-4" />
                {pending ? "Creating…" : "Create character"}
              </Button>
            ) : (
              <Button onClick={next} disabled={pending}>
                Next <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
      {children}
    </p>
  );
}

function PointBuyMeter({ scores }: { scores: AbilityScores }) {
  const spent = pointBuySpent(scores);
  const over = spent > POINT_BUY_BUDGET;
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all", over ? "bg-destructive" : "bg-primary")}
          style={{ width: `${Math.min(100, (spent / POINT_BUY_BUDGET) * 100)}%` }}
        />
      </div>
      <p className={cn("text-sm tabular-nums", over && "text-destructive")}>
        {spent} / {POINT_BUY_BUDGET} points
      </p>
    </div>
  );
}

function AbilityCard({
  label,
  fullLabel,
  value,
  bonus,
  total,
  method,
  onChange,
}: {
  label: string;
  fullLabel: string;
  value: number;
  bonus: number;
  total: number;
  method: ScoreMethod;
  onChange: (value: number) => void;
}) {
  // Point buy is capped at 8-15 (the buyable range); every other method lets
  // any legal score be typed, including rolled 16s and 17s.
  const min = method === "point-buy" ? POINT_BUY_MIN : 1;
  const max = method === "point-buy" ? POINT_BUY_MAX : 30;
  const cost = POINT_BUY_COST[value];

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
      <p className="text-xs font-semibold uppercase text-muted-foreground" title={fullLabel}>
        {label}
      </p>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const next = Number(e.target.value || 0);
          onChange(Math.max(min, Math.min(max, next)));
        }}
        className="mt-1 h-8 text-center tabular-nums"
        aria-label={fullLabel}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {bonus > 0 ? `+${bonus} species → ` : ""}
        <span className="font-medium text-foreground">{total}</span>{" "}
        <span className="text-primary">{formatModifier(abilityModifier(total))}</span>
      </p>
      {method === "point-buy" && cost !== undefined && (
        <p className="text-[10px] text-muted-foreground">{cost} pts</p>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-medium" title={value}>{value}</p>
    </div>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 font-medium">{label}:</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}
