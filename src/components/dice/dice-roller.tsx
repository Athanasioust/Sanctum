"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dices, Minus, Plus, Swords, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api } from "@/lib/client";
import {
  DIE_SIDES,
  DiceError,
  formulaError,
  modeSuffix,
  modifierSuffix,
  roll,
  type RollMode,
  type RollResult,
} from "@/lib/dice";
import { cn } from "@/lib/utils";
import type { Encounter } from "@/db/schema";

/** Dispatched to roll from anywhere (character sheets, stat blocks, palette). */
export const ROLL_DICE_EVENT = "sanctum:roll-dice";
/** Dispatched to open the dice panel without rolling (the combat "d" shortcut). */
export const OPEN_DICE_EVENT = "sanctum:open-dice";
/** Dispatched after a roll is written to the combat log, so the tracker reloads. */
export const COMBAT_LOG_ADDED_EVENT = "sanctum:combat-log-added";

export type DiceRequest = {
  formula: string;
  /** What's being rolled, e.g. "Perception" or "Longsword damage". */
  label?: string;
  mode?: RollMode;
  /** Attribute the combat-log entry to a combatant. */
  actorName?: string;
};

/**
 * Roll from anywhere in the app. The global panel picks this up, opens, rolls,
 * and logs to the active encounter if there is one.
 */
export function rollDice(request: DiceRequest) {
  window.dispatchEvent(new CustomEvent<DiceRequest>(ROLL_DICE_EVENT, { detail: request }));
}

type HistoryEntry = {
  id: number;
  result: RollResult;
  label?: string;
  logged: boolean;
};

const MODES: { value: RollMode; label: string; hint: string }[] = [
  { value: "disadvantage", label: "Dis", hint: "Disadvantage — roll twice, keep the lowest" },
  { value: "normal", label: "Normal", hint: "Roll once" },
  { value: "advantage", label: "Adv", hint: "Advantage — roll twice, keep the highest" },
];

let nextEntryId = 1;

export function DiceRoller({ campaignId }: { campaignId: number }) {
  const [open, setOpen] = useState(false);
  const [formula, setFormula] = useState("1d20");
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [mode, setMode] = useState<RollMode>("normal");
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Read inside the event handler, which is registered once — refs keep it from
  // rolling with a stale modifier/mode after the user changes them.
  const modeRef = useRef(mode);
  const modifierRef = useRef(modifier);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    modifierRef.current = modifier;
  }, [modifier]);

  /**
   * Write a roll to the active encounter's combat log, if one is running.
   * Returns true when it was logged. The active encounter is looked up per roll
   * rather than cached so the log lands on the right encounter and round.
   */
  const logToCombat = useCallback(
    async (result: RollResult, label?: string, actorName?: string) => {
      try {
        const encounters = await api.get<Encounter[]>(
          `/api/encounters?campaignId=${campaignId}`,
        );
        const active = encounters.find((e) => e.status === "active");
        if (!active) return false;

        const action = `${label ? `${label}: ` : ""}${result.formula}${modeSuffix(
          result.mode,
        )} → ${result.total}`;
        await api.post("/api/combat-log", {
          encounterId: active.id,
          round: active.roundNumber,
          actorName: (actorName ?? "").slice(0, 120),
          action: action.slice(0, 200),
          details: result.breakdown.slice(0, 2000),
        });
        window.dispatchEvent(new Event(COMBAT_LOG_ADDED_EVENT));
        return true;
      } catch {
        // A roll is still a valid roll if the log write fails — don't lose it.
        return false;
      }
    },
    [campaignId],
  );

  const performRoll = useCallback(
    (raw: string, rollMode: RollMode, label?: string, actorName?: string) => {
      let result: RollResult;
      try {
        result = roll(raw, rollMode);
      } catch (err) {
        toast.error(err instanceof DiceError ? err.message : "Invalid dice formula");
        return;
      }

      const id = nextEntryId++;
      setHistory((prev) => [{ id, result, label, logged: false }, ...prev].slice(0, 25));

      void logToCombat(result, label, actorName).then((logged) => {
        if (logged) {
          setHistory((prev) =>
            prev.map((e) => (e.id === id ? { ...e, logged: true } : e)),
          );
        }
      });
    },
    [logToCombat],
  );

  // Contextual rolls dispatched from sheets and stat blocks.
  useEffect(() => {
    function onRollRequest(event: Event) {
      const detail = (event as CustomEvent<DiceRequest>).detail;
      if (!detail?.formula) return;
      const rollMode = detail.mode ?? modeRef.current;
      setFormula(detail.formula);
      setOpen(true);
      performRoll(detail.formula, rollMode, detail.label, detail.actorName);
    }
    window.addEventListener(ROLL_DICE_EVENT, onRollRequest);
    return () => window.removeEventListener(ROLL_DICE_EVENT, onRollRequest);
  }, [performRoll]);

  useEffect(() => {
    const openPanel = () => setOpen(true);
    window.addEventListener(OPEN_DICE_EVENT, openPanel);
    return () => window.removeEventListener(OPEN_DICE_EVENT, openPanel);
  }, []);

  const inputError = formulaError(formula);
  const latest = history[0];

  function rollQuickDie(sides: number) {
    const next = `${count}d${sides}${modifierSuffix(modifier)}`;
    setFormula(next);
    performRoll(next, mode);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" title="Dice roller">
          <Dices className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
        <SheetHeader className="mb-2">
          <SheetTitle className="flex items-center gap-2">
            <Dices className="size-4 text-primary" /> Dice Roller
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          {/* Quick dice */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Quick roll
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {DIE_SIDES.map((sides) => (
                <Button
                  key={sides}
                  variant="outline"
                  onClick={() => rollQuickDie(sides)}
                  title={`Roll ${count}d${sides}${modifierSuffix(modifier)}`}
                >
                  d{sides}
                </Button>
              ))}
            </div>
          </div>

          {/* Count + modifier steppers */}
          <div className="grid grid-cols-2 gap-3">
            <Stepper
              label="Dice"
              value={count}
              min={1}
              max={20}
              onChange={setCount}
              format={(v) => `${v}`}
            />
            <Stepper
              label="Modifier"
              value={modifier}
              min={-20}
              max={20}
              onChange={setModifier}
              format={(v) => (v > 0 ? `+${v}` : `${v}`)}
            />
          </div>

          {/* Advantage / disadvantage */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Roll mode
            </p>
            <div className="flex rounded-lg border border-border p-0.5">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  title={m.hint}
                  onClick={() => setMode(m.value)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    mode === m.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formula */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Formula
            </p>
            <div className="flex gap-2">
              <Input
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !inputError) performRoll(formula, mode);
                }}
                placeholder="2d6+3"
                aria-invalid={formula.length > 0 && inputError !== null}
                className="font-mono"
              />
              <Button onClick={() => performRoll(formula, mode)} disabled={!!inputError}>
                Roll
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {formula && inputError ? (
                <span className="text-destructive">{inputError}</span>
              ) : (
                "Supports 2d6+3, 1d20-1, 4d6kh3, d%."
              )}
            </p>
          </div>

          {/* Latest result */}
          {latest && <ResultCard entry={latest} />}

          {/* History */}
          {history.length > 1 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  History
                </p>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setHistory([])}
                  title="Clear history"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
              <ul className="space-y-1">
                {history.slice(1).map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-baseline gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs"
                  >
                    <span className="font-semibold tabular-nums">{entry.result.total}</span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {entry.label ? `${entry.label} · ` : ""}
                      {entry.result.formula}
                      {modeSuffix(entry.result.mode)}
                    </span>
                    {entry.logged && (
                      <Swords className="size-3 shrink-0 text-muted-foreground" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="size-3" />
        </Button>
        <span className="flex-1 text-center text-sm font-semibold tabular-nums">
          {format(value)}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus className="size-3" />
        </Button>
      </div>
    </div>
  );
}

function ResultCard({ entry }: { entry: HistoryEntry }) {
  const { result } = entry;
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        result.critical === "hit"
          ? "border-primary/50 bg-primary/5"
          : result.critical === "miss"
            ? "border-destructive/50 bg-destructive/5"
            : "border-border bg-muted/40",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">
          {entry.label ? `${entry.label} · ` : ""}
          {result.formula}
          {modeSuffix(result.mode)}
        </p>
        {result.critical && (
          <span
            className={cn(
              "shrink-0 text-xs font-semibold uppercase",
              result.critical === "hit" ? "text-primary" : "text-destructive",
            )}
          >
            {result.critical === "hit" ? "Nat 20" : "Nat 1"}
          </span>
        )}
      </div>

      <p className="font-heading text-4xl font-semibold tabular-nums">{result.total}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1">
        {result.rolls.map((die, i) => (
          <span
            key={i}
            title={`d${die.sides}${die.dropped ? " (dropped)" : ""}`}
            className={cn(
              "inline-flex min-w-7 items-center justify-center rounded-md border px-1.5 py-0.5 text-xs tabular-nums",
              die.dropped
                ? "border-border/50 text-muted-foreground/60 line-through"
                : "border-border bg-background font-medium",
            )}
          >
            {die.value}
          </span>
        ))}
        {result.modifier !== 0 && (
          <span className="text-xs font-medium text-muted-foreground">
            {result.modifier > 0 ? `+${result.modifier}` : result.modifier}
          </span>
        )}
      </div>

      {entry.logged && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Swords className="size-3" /> Added to the combat log
        </p>
      )}
    </div>
  );
}
