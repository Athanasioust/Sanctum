"use client";

import { Dices } from "lucide-react";
import { rollDice } from "@/components/dice/dice-roller";
import { checkFormula, modifierSuffix } from "@/lib/dice";
import { formatModifier } from "@/lib/dnd";
import { cn } from "@/lib/utils";

/**
 * A save/skill/ability row that rolls `1d20 + bonus` when clicked. Used on
 * character sheets and monster stat blocks so the DM never has to retype a
 * modifier into the dice panel.
 */
export function RollableStat({
  label,
  ability,
  bonus,
  proficient,
  rollLabel,
  actorName,
  className,
}: {
  label: string;
  /** Short ability tag shown after the label, e.g. "wis" on a skill row. */
  ability?: string;
  bonus: number;
  proficient?: boolean;
  /** What the combat log calls this roll. Defaults to the label. */
  rollLabel?: string;
  actorName?: string;
  className?: string;
}) {
  const name = rollLabel ?? label;
  return (
    <button
      type="button"
      onClick={() => rollDice({ formula: checkFormula(bonus), label: name, actorName })}
      title={`Roll ${name} — 1d20${modifierSuffix(bonus)}`}
      className={cn(
        "group flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-primary/10",
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        {proficient !== undefined && (
          <span
            className={cn(
              "size-2 rounded-full",
              proficient ? "bg-primary" : "bg-muted-foreground/30",
            )}
          />
        )}
        {label}
        {ability && (
          <span className="text-xs uppercase text-muted-foreground">{ability}</span>
        )}
      </span>
      <span className="flex items-center gap-1.5">
        <Dices className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        <span className="font-medium tabular-nums">{formatModifier(bonus)}</span>
      </span>
    </button>
  );
}

/** A damage/attack formula rendered as a clickable roll, e.g. "2d6+3". */
export function RollableFormula({
  formula,
  label,
  actorName,
  display,
  className,
}: {
  formula: string;
  label: string;
  actorName?: string;
  /** Text to show instead of the formula, e.g. "+5 to hit" rolling 1d20+5. */
  display?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => rollDice({ formula, label, actorName })}
      title={`Roll ${formula} — ${label}`}
      className={cn(
        "inline rounded-sm px-0.5 font-medium text-primary underline decoration-primary/40 decoration-dotted underline-offset-2 transition-colors hover:bg-primary/10 hover:decoration-solid",
        className,
      )}
    >
      {display ?? formula}
    </button>
  );
}
