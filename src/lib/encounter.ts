/**
 * 5e encounter-difficulty math (2014 DMG XP-threshold method). Used by the
 * Encounter Builder to rate a planned fight against the party, and by the
 * combat tracker to rate the fight that is actually running.
 */

import { CR_XP } from "@/lib/constants";

export type Difficulty = "Trivial" | "Easy" | "Medium" | "Hard" | "Deadly";

/** Per-character XP thresholds by level: [easy, medium, hard, deadly]. */
const XP_THRESHOLDS: Record<number, [number, number, number, number]> = {
  1: [25, 50, 75, 100],
  2: [50, 100, 150, 200],
  3: [75, 150, 225, 400],
  4: [125, 250, 375, 500],
  5: [250, 500, 750, 1100],
  6: [300, 600, 900, 1400],
  7: [350, 750, 1100, 1700],
  8: [450, 900, 1400, 2100],
  9: [550, 1100, 1600, 2400],
  10: [600, 1200, 1900, 2800],
  11: [800, 1600, 2400, 3600],
  12: [1000, 2000, 3000, 4500],
  13: [1100, 2200, 3400, 5100],
  14: [1250, 2500, 3800, 5700],
  15: [1400, 2800, 4300, 6400],
  16: [1600, 3200, 4800, 7200],
  17: [2000, 3900, 5900, 8800],
  18: [2100, 4200, 6300, 9500],
  19: [2400, 4900, 7300, 10900],
  20: [2800, 5700, 8500, 12700],
};

export type PartyThresholds = {
  easy: number;
  medium: number;
  hard: number;
  deadly: number;
};

/** Sum each present character's thresholds into a party budget. */
export function partyThresholds(levels: number[]): PartyThresholds {
  const sum = { easy: 0, medium: 0, hard: 0, deadly: 0 };
  for (const lvl of levels) {
    const t = XP_THRESHOLDS[Math.max(1, Math.min(20, Math.round(lvl)))];
    sum.easy += t[0];
    sum.medium += t[1];
    sum.hard += t[2];
    sum.deadly += t[3];
  }
  return sum;
}

/**
 * The DMG's multiplier ladder. The ×0.5 and ×5 rungs are only reachable through
 * the party-size shift below: a lone monster against six or more characters, or
 * a horde of 15+ against a party of one or two.
 */
const MULTIPLIER_TIERS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5];

function tierForCount(count: number): number {
  if (count <= 1) return 1;
  if (count === 2) return 2;
  if (count <= 6) return 3;
  if (count <= 10) return 4;
  if (count <= 14) return 5;
  return 6;
}

/**
 * Encounter XP multiplier for `monsterCount`, shifted one step by party size as
 * the DMG describes: a party of fewer than three uses the next multiplier up
 * (they feel the pressure sooner), a party of six or more the next one down.
 */
export function encounterMultiplier(monsterCount: number, partySize: number): number {
  if (monsterCount <= 0) return 1;
  let tier = tierForCount(monsterCount);
  if (partySize > 0 && partySize < 3) tier += 1;
  else if (partySize > 5) tier -= 1;
  tier = Math.max(0, Math.min(MULTIPLIER_TIERS.length - 1, tier));
  return MULTIPLIER_TIERS[tier];
}

/** XP for a challenge rating ("1/4", "5"…), or 0 for an unknown/blank CR. */
export function crToXp(cr: string | null | undefined): number {
  if (!cr) return 0;
  return CR_XP[cr.trim()] ?? 0;
}

/** Monster XP total × the group multiplier for a party of `partySize`. */
export function adjustedXp(monsterXps: number[], partySize: number): number {
  const total = monsterXps.reduce((a, b) => a + Math.max(0, b), 0);
  return Math.round(total * encounterMultiplier(monsterXps.length, partySize));
}

/** Which band an adjusted XP total falls in against a party's thresholds. */
export function difficulty(adjusted: number, thresholds: PartyThresholds): Difficulty {
  if (adjusted <= 0) return "Trivial";
  if (adjusted >= thresholds.deadly) return "Deadly";
  if (adjusted >= thresholds.hard) return "Hard";
  if (adjusted >= thresholds.medium) return "Medium";
  if (adjusted >= thresholds.easy) return "Easy";
  return "Trivial";
}

export type EncounterRating = {
  difficulty: Difficulty;
  totalXp: number;
  adjustedXp: number;
  multiplier: number;
  thresholds: PartyThresholds;
};

/** Rate a set of monsters (by XP) against a party (by character levels). */
export function rateEncounter(
  monsterXps: number[],
  partyLevels: number[],
): EncounterRating {
  const totalXp = monsterXps.reduce((a, b) => a + Math.max(0, b), 0);
  const multiplier = encounterMultiplier(monsterXps.length, partyLevels.length);
  const adjusted = adjustedXp(monsterXps, partyLevels.length);
  const thresholds = partyThresholds(partyLevels);
  const rated: Difficulty =
    partyLevels.length > 0 ? difficulty(adjusted, thresholds) : "Trivial";

  return { difficulty: rated, totalXp, adjustedXp: adjusted, multiplier, thresholds };
}

export const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Trivial: "text-muted-foreground",
  Easy: "text-success",
  Medium: "text-amber-400",
  Hard: "text-orange-400",
  Deadly: "text-destructive",
};

/** Dictionary key for a difficulty band's display name. */
export function difficultyKey(d: Difficulty) {
  return `difficulty.${d.toLowerCase()}` as
    | "difficulty.trivial"
    | "difficulty.easy"
    | "difficulty.medium"
    | "difficulty.hard"
    | "difficulty.deadly";
}
