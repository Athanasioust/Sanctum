"use client";

import { ABILITIES } from "@/lib/constants";
import { abilityModifier, formatModifier } from "@/lib/dnd";
import { Input } from "@/components/ui/input";

type Scores = { str: number; dex: number; con: number; int: number; wis: number; cha: number };

export function AbilityScoresEditor({
  scores,
  onChange,
}: {
  scores: Scores;
  onChange: (key: keyof Scores, value: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {ABILITIES.map((ability) => {
        const score = scores[ability.key as keyof Scores];
        const mod = abilityModifier(score);
        return (
          <div
            key={ability.key}
            className="flex flex-col items-center rounded-lg border border-border bg-muted/30 p-2"
          >
            <label
              htmlFor={`ability-${ability.key}`}
              className="text-xs font-semibold uppercase text-muted-foreground"
            >
              {ability.short}
            </label>
            <Input
              id={`ability-${ability.key}`}
              type="number"
              min={1}
              max={30}
              value={score}
              onChange={(e) =>
                onChange(ability.key as keyof Scores, Number(e.target.value || 0))
              }
              className="mt-1 h-9 text-center text-base font-semibold"
            />
            <span className="mt-1 rounded-full bg-primary/15 px-2 text-sm font-medium text-primary tabular-nums">
              {formatModifier(mod)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
