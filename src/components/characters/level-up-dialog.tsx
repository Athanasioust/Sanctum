"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, Dices, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form";
import { Combobox } from "@/components/shared/combobox";
import { useCampaignOptions } from "@/components/campaigns/campaign-options-context";
import { api } from "@/lib/client";
import { roll } from "@/lib/dice";
import {
  CLASS_CATALOG,
  optionsFor,
  subclassOptions,
  withCampaignValues,
} from "@/lib/character-options";
import {
  averageHitDieRoll,
  classRules,
  describePrereq,
  hitPointsGained,
  meetsMulticlassPrereq,
  spellSlotsFor,
} from "@/lib/class-rules";
import { classLevels, syncSpellSlots } from "@/lib/spell-slot-sync";
import { abilityModifier, formatModifier, proficiencyBonusForLevel } from "@/lib/dnd";
import { cn } from "@/lib/utils";
import type { AbilityKey } from "@/lib/constants";
import type { Character, MulticlassEntry } from "@/db/schema";

type HpMethod = "average" | "rolled";

export function LevelUpDialog({ character }: { character: Character }) {
  const router = useRouter();
  const { rulebooks, used } = useCampaignOptions();

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [hpMethod, setHpMethod] = useState<HpMethod>("average");
  const [rolledHp, setRolledHp] = useState<number | null>(null);
  /** Which class takes the new level — the primary class or a multiclass. */
  const [targetClass, setTargetClass] = useState(character.class);
  const [newSubclass, setNewSubclass] = useState("");

  const scores: Record<AbilityKey, number> = {
    str: character.str, dex: character.dex, con: character.con,
    int: character.int, wis: character.wis, cha: character.cha,
  };

  const multiclass = useMemo(
    () => (character.multiclassInfo ?? []) as MulticlassEntry[],
    [character.multiclassInfo],
  );
  const nextLevel = character.level + 1;
  const atMaxLevel = character.level >= 20;

  const before = useMemo(
    () => classLevels(character.class, character.level, multiclass),
    [character.class, character.level, multiclass],
  );
  const isNewClass =
    targetClass.trim() !== "" &&
    !before.some((c) => c.className.toLowerCase() === targetClass.trim().toLowerCase());

  /** The class distribution after this level lands. */
  const after = useMemo(() => {
    const entries = before.map((c) => ({ ...c }));
    const match = entries.find(
      (c) => c.className.toLowerCase() === targetClass.trim().toLowerCase(),
    );
    if (match) match.level += 1;
    else if (targetClass.trim()) entries.push({ className: targetClass.trim(), level: 1 });
    return entries;
  }, [before, targetClass]);

  const targetRules = classRules(targetClass);
  const hitDie = targetRules?.hitDie ?? 8;
  const conMod = abilityModifier(character.con);

  const hpGain = hitPointsGained(
    hitDie,
    conMod,
    hpMethod === "rolled" ? (rolledHp ?? undefined) : undefined,
  );

  const profBefore = character.proficiencyBonus;
  const profAfter = proficiencyBonusForLevel(nextLevel);

  const slotsBefore = spellSlotsFor(before);
  const slotsAfter = spellSlotsFor(after);
  const slotChanges = Object.entries(slotsAfter)
    .filter(([level, total]) => (slotsBefore[Number(level)] ?? 0) !== total)
    .map(([level, total]) => ({
      level: Number(level),
      from: slotsBefore[Number(level)] ?? 0,
      to: total,
    }));

  // The level in the target class after this level-up, which is what decides
  // whether a subclass is now due.
  const targetLevelAfter =
    after.find((c) => c.className.toLowerCase() === targetClass.trim().toLowerCase())?.level ?? 1;
  const existingSubclass = isNewClass
    ? ""
    : targetClass.toLowerCase() === character.class.toLowerCase()
      ? character.subclass
      : (multiclass.find((m) => m.className.toLowerCase() === targetClass.toLowerCase())?.subclass ?? "");
  const subclassDue =
    !!targetRules && targetLevelAfter >= targetRules.subclassLevel && !existingSubclass;

  const prereq = isNewClass ? meetsMulticlassPrereq(targetClass, scores) : { ok: true, reason: null };
  const blocked = !prereq.ok;

  const subclassChoices = useMemo(
    () => withCampaignValues(subclassOptions(targetClass, rulebooks), used.subclasses),
    [targetClass, rulebooks, used.subclasses],
  );

  // Classes already taken sort to the top; the rest are the multiclass options.
  const classChoices = useMemo(() => {
    const current = new Set(before.map((c) => c.className.toLowerCase()));
    const catalog = optionsFor(CLASS_CATALOG, rulebooks).map((value) => ({
      value,
      group: current.has(value.toLowerCase()) ? "Current classes" : "Multiclass into",
    }));
    const missing = before
      .filter((c) => !catalog.some((o) => o.value.toLowerCase() === c.className.toLowerCase()))
      .map((c) => ({ value: c.className, group: "Current classes" }));
    return withCampaignValues([...missing, ...catalog], used.classes);
  }, [before, rulebooks, used.classes]);

  function rollHp() {
    const result = roll(`1d${hitDie}`);
    setRolledHp(result.total);
    setHpMethod("rolled");
  }

  async function levelUp() {
    if (blocked) return;
    setPending(true);
    try {
      const patch: Record<string, unknown> = {
        level: nextLevel,
        proficiencyBonus: profAfter,
        hpMax: character.hpMax + hpGain,
        hpCurrent: character.hpCurrent + hpGain,
        hitDiceTotal: character.hitDiceTotal + 1,
      };

      // Where the new level lands: the primary class, an existing multiclass
      // entry, or a brand new one.
      if (isNewClass) {
        patch.multiclassInfo = [
          ...multiclass,
          { className: targetClass.trim(), subclass: subclassDue ? newSubclass : "", level: 1 },
        ];
      } else if (targetClass.toLowerCase() !== character.class.toLowerCase()) {
        patch.multiclassInfo = multiclass.map((m) =>
          m.className.toLowerCase() === targetClass.toLowerCase()
            ? {
                ...m,
                level: m.level + 1,
                // Never blank an existing subclass just because the prompt was skipped.
                subclass: subclassDue && newSubclass ? newSubclass : m.subclass,
              }
            : m,
        );
      } else if (subclassDue && newSubclass) {
        patch.subclass = newSubclass;
      }

      await api.patch(`/api/characters/${character.id}`, patch);
      await syncSpellSlots(character.id, "character", after);

      toast.success(`${character.name} is now level ${nextLevel}`);
      setOpen(false);
      setRolledHp(null);
      setNewSubclass("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to level up");
    } finally {
      setPending(false);
    }
  }

  if (atMaxLevel) {
    return (
      <Button variant="outline" disabled title="Level 20 is the cap">
        <ChevronUp className="size-4" /> Max level
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ChevronUp className="size-4" /> Level Up
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Level {character.level} → {nextLevel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Which class gains the level */}
          <Field
            label="Class gaining the level"
            hint={
              isNewClass
                ? `Multiclassing into ${targetClass}.`
                : "Pick another class to multiclass instead."
            }
          >
            <Combobox
              value={targetClass}
              onValueChange={(v) => {
                setTargetClass(v);
                setNewSubclass("");
              }}
              options={classChoices}
              placeholder="Select a class"
            />
          </Field>

          {blocked && (
            <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <TriangleAlert className="size-4 shrink-0" />
              <div>
                <p>{prereq.reason}</p>
                <p className="mt-1 text-xs opacity-80">
                  Multiclassing into {targetClass} requires {describePrereq(targetClass)}.
                </p>
              </div>
            </div>
          )}

          {/* Hit points */}
          <Field label="Hit points gained" hint={`d${hitDie} + CON ${formatModifier(conMod)}`}>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={hpMethod === "average" ? "default" : "outline"}
                onClick={() => setHpMethod("average")}
              >
                Average ({averageHitDieRoll(hitDie)})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={hpMethod === "rolled" ? "default" : "outline"}
                onClick={rollHp}
              >
                <Dices className="size-3" /> Roll
              </Button>
              {hpMethod === "rolled" && (
                <Input
                  type="number"
                  min={1}
                  max={hitDie}
                  value={rolledHp ?? ""}
                  onChange={(e) =>
                    setRolledHp(Math.max(1, Math.min(hitDie, Number(e.target.value || 1))))
                  }
                  className="h-8 w-20 text-center tabular-nums"
                  aria-label="Rolled hit die"
                />
              )}
              <span className="text-sm font-medium text-primary">+{hpGain} HP</span>
            </div>
          </Field>

          {/* Subclass prompt */}
          {subclassDue && (
            <Field
              label={targetRules?.subclassLabel ?? "Subclass"}
              hint={`${targetRules?.name} chooses this at level ${targetRules?.subclassLevel}.`}
            >
              <Combobox
                value={newSubclass}
                onValueChange={setNewSubclass}
                options={subclassChoices}
                placeholder="Select a subclass"
              />
            </Field>
          )}

          {/* What changes */}
          <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              What this applies
            </p>
            <Change label="Level" from={character.level} to={nextLevel} />
            <Change
              label="Proficiency bonus"
              from={formatModifier(profBefore)}
              to={formatModifier(profAfter)}
              highlight={profBefore !== profAfter}
            />
            <Change
              label="Max HP"
              from={character.hpMax}
              to={character.hpMax + hpGain}
              highlight
            />
            <Change
              label="Hit dice"
              from={`${character.hitDiceTotal}`}
              to={`${character.hitDiceTotal + 1}`}
            />
            {slotChanges.length > 0 ? (
              <div className="pt-1">
                <p className="text-xs text-muted-foreground">Spell slots</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {slotChanges.map((s) => (
                    <Badge key={s.level} className="bg-primary/15 text-primary">
                      Level {s.level}: {s.from} → {s.to}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="pt-1 text-xs text-muted-foreground">No spell slot changes.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={levelUp} disabled={pending || blocked}>
            {pending ? "Applying…" : `Level up to ${nextLevel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Change({
  label,
  from,
  to,
  highlight,
}: {
  label: string;
  from: string | number;
  to: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">
        <span className="text-muted-foreground">{from}</span>
        <span className="mx-1 text-muted-foreground">→</span>
        <span className={cn("font-medium", highlight && "text-primary")}>{to}</span>
      </span>
    </div>
  );
}
