/**
 * Dice notation parser and roller.
 *
 * Dependency-free by design (see the offline guardrail): supports the subset of
 * dice notation a 5e table actually uses — `2d6+3`, `1d20-1`, `4d6kh3`, `d%` —
 * plus advantage/disadvantage, which rewrites a lone d20 into `2d20kh1`/`2d20kl1`
 * so the dropped die is still visible in the result.
 */

export type RollMode = "normal" | "advantage" | "disadvantage";

export type DieRoll = {
  sides: number;
  value: number;
  /** True when a keep/drop rule discarded this die (still shown, struck through). */
  dropped: boolean;
};

export type RollResult = {
  /** The formula as rolled, after any advantage rewrite. */
  formula: string;
  total: number;
  /** Every die rolled, in formula order, including dropped ones. */
  rolls: DieRoll[];
  /** Sum of the flat modifiers in the formula. */
  modifier: number;
  /** Human-readable maths, e.g. "2d6 (4, 5) + 3". */
  breakdown: string;
  mode: RollMode;
  /**
   * Natural 20 / natural 1 on a single-d20 check. Null when the roll isn't a
   * d20 check or rolls more than one d20 group.
   */
  critical: "hit" | "miss" | null;
};

export class DiceError extends Error {}

/** The dice a quick-roll button bar offers. */
export const DIE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;

const MAX_DICE = 100;
const MAX_SIDES = 1000;

type Term =
  | { kind: "dice"; sign: 1 | -1; count: number; sides: number; keep?: { mode: "h" | "l"; n: number } }
  | { kind: "flat"; sign: 1 | -1; value: number };

const DICE_TERM = /^(\d*)d(%|\d+)(?:(kh|kl|dh|dl)(\d*))?$/i;

/** Roll a single fair die. */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function parse(formula: string): Term[] {
  const cleaned = formula.replace(/\s+/g, "").toLowerCase();
  if (!cleaned) throw new DiceError("Enter a dice formula, e.g. 1d20+5");

  // Split into signed chunks: "2d6+3-1" -> ["+2d6", "+3", "-1"].
  const chunks = cleaned.replace(/^([^+-])/, "+$1").match(/[+-][^+-]*/g);
  if (!chunks) throw new DiceError(`Can't read "${formula}"`);

  return chunks.map((chunk) => {
    const sign: 1 | -1 = chunk[0] === "-" ? -1 : 1;
    const body = chunk.slice(1);
    if (!body) throw new DiceError(`Can't read "${formula}"`);

    const dice = DICE_TERM.exec(body);
    if (dice) {
      const count = dice[1] === "" ? 1 : Number(dice[1]);
      const sides = dice[2] === "%" ? 100 : Number(dice[2]);
      if (count < 1) throw new DiceError("Dice count must be at least 1");
      if (count > MAX_DICE) throw new DiceError(`Too many dice (max ${MAX_DICE})`);
      if (sides < 2) throw new DiceError("A die needs at least 2 sides");
      if (sides > MAX_SIDES) throw new DiceError(`Too many sides (max ${MAX_SIDES})`);

      let keep: { mode: "h" | "l"; n: number } | undefined;
      if (dice[3]) {
        const op = dice[3];
        const n = dice[4] === "" || dice[4] === undefined ? 1 : Number(dice[4]);
        if (n < 1 || n >= count) {
          throw new DiceError(`Keep/drop count must be between 1 and ${count - 1}`);
        }
        // dh/dl drop N, which is the same as keeping the other (count - N).
        keep =
          op === "kh" ? { mode: "h", n }
          : op === "kl" ? { mode: "l", n }
          : op === "dl" ? { mode: "h", n: count - n }
          : { mode: "l", n: count - n };
      }
      return { kind: "dice", sign, count, sides, keep };
    }

    if (/^\d+$/.test(body)) {
      return { kind: "flat", sign, value: Number(body) };
    }
    throw new DiceError(`Can't read "${body}" in "${formula}"`);
  });
}

function termToString(term: Term): string {
  if (term.kind === "flat") return String(term.value);
  const keep = term.keep ? `k${term.keep.mode}${term.keep.n}` : "";
  return `${term.count}d${term.sides}${keep}`;
}

function formatTerms(terms: Term[]): string {
  return terms
    .map((term, i) => {
      const body = termToString(term);
      if (i === 0) return term.sign === -1 ? `-${body}` : body;
      return `${term.sign === -1 ? " - " : " + "}${body}`;
    })
    .join("");
}

/**
 * Apply advantage/disadvantage by turning a single d20 into 2d20 keep
 * highest/lowest. Only the first d20 term is affected — damage dice in the same
 * formula roll normally, which is what 5e means by "attack with advantage".
 */
function applyMode(terms: Term[], mode: RollMode): Term[] {
  if (mode === "normal") return terms;
  let done = false;
  return terms.map((term) => {
    if (done || term.kind !== "dice" || term.sides !== 20 || term.keep) return term;
    done = true;
    return {
      ...term,
      count: term.count + 1,
      keep: { mode: mode === "advantage" ? "h" : "l", n: term.count },
    };
  });
}

/**
 * Roll a dice formula.
 *
 * @example roll("2d6+3")
 * @example roll("1d20+5", "advantage")
 */
export function roll(formula: string, mode: RollMode = "normal"): RollResult {
  const terms = applyMode(parse(formula), mode);

  const rolls: DieRoll[] = [];
  const parts: string[] = [];
  let total = 0;
  let modifier = 0;
  let d20Groups = 0;
  let d20Natural: number | null = null;

  terms.forEach((term, i) => {
    const prefix = i === 0 ? (term.sign === -1 ? "-" : "") : term.sign === -1 ? " - " : " + ";

    if (term.kind === "flat") {
      modifier += term.sign * term.value;
      total += term.sign * term.value;
      parts.push(`${prefix}${term.value}`);
      return;
    }

    const values = Array.from({ length: term.count }, () => rollDie(term.sides));

    // Rank indices by value to decide which dice the keep rule discards.
    let keptIndices: Set<number>;
    if (term.keep) {
      const ranked = values
        .map((value, index) => ({ value, index }))
        .sort((a, b) => (term.keep!.mode === "h" ? b.value - a.value : a.value - b.value));
      keptIndices = new Set(ranked.slice(0, term.keep.n).map((r) => r.index));
    } else {
      keptIndices = new Set(values.map((_, index) => index));
    }

    let sum = 0;
    values.forEach((value, index) => {
      const dropped = !keptIndices.has(index);
      rolls.push({ sides: term.sides, value, dropped });
      if (!dropped) sum += value;
    });

    total += term.sign * sum;

    if (term.sides === 20) {
      d20Groups += 1;
      const kept = values.filter((_, index) => keptIndices.has(index));
      d20Natural = kept.length === 1 ? kept[0] : null;
    }

    // Dropped dice stay visible in square brackets so the player can see what
    // advantage actually discarded.
    const shown = values
      .map((value, index) => (keptIndices.has(index) ? String(value) : `[${value}]`))
      .join(", ");
    parts.push(`${prefix}${termToString(term)} (${shown})`);
  });

  return {
    formula: formatTerms(terms),
    total,
    rolls,
    modifier,
    breakdown: parts.join(""),
    mode,
    critical:
      d20Groups === 1 && d20Natural === 20 ? "hit"
      : d20Groups === 1 && d20Natural === 1 ? "miss"
      : null,
  };
}

/** Validate a formula without rolling it. Returns null when it parses. */
export function formulaError(formula: string): string | null {
  try {
    parse(formula);
    return null;
  } catch (err) {
    return err instanceof DiceError ? err.message : "Invalid formula";
  }
}

/** Format a modifier for use inside a formula, e.g. 3 -> "+3", 0 -> "". */
export function modifierSuffix(modifier: number): string {
  if (modifier === 0) return "";
  return modifier > 0 ? `+${modifier}` : `${modifier}`;
}

/** Build a `1d20+N` check formula from a bonus. */
export function checkFormula(bonus: number): string {
  return `1d20${modifierSuffix(bonus)}`;
}

/** Short suffix naming the roll mode, for labels and log lines. */
export function modeSuffix(mode: RollMode): string {
  return mode === "advantage" ? " (adv)" : mode === "disadvantage" ? " (dis)" : "";
}

/** One-line summary for toasts, e.g. "1d20+5 (adv) → 18". */
export function describeRoll(result: RollResult): string {
  return `${result.formula}${modeSuffix(result.mode)} → ${result.total}`;
}
