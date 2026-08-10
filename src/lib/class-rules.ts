/**
 * Mechanical class data for the character wizard and the level-up flow:
 * hit dice, saving throws, skill lists, subclass timing, spell-slot
 * progressions and multiclass prerequisites.
 *
 * Only rules mechanics live here (numbers and lists), not rules text —
 * `character-options.ts` remains the catalog of pickable *names*. Anything not
 * listed here degrades gracefully: a homebrew class name falls back to a d8 hit
 * die, no automatic slots and no prerequisites.
 */

import type { AbilityKey } from "./constants";

/**
 * `artificer` is deliberately separate from `half`: it rounds its caster level
 * up and has slots from level 1, where paladins and rangers round up but only
 * from level 2.
 */
export type CasterKind = "full" | "half" | "third" | "artificer" | "pact" | "none";

/** Ability-score prerequisites for multiclassing into or out of a class. */
export type MulticlassPrereq = {
  /** Every listed ability must meet its minimum. */
  all?: Partial<Record<AbilityKey, number>>;
  /** At least one listed ability must meet its minimum (Fighter's STR or DEX). */
  any?: Partial<Record<AbilityKey, number>>;
};

export type ClassRules = {
  name: string;
  hitDie: number;
  savingThrows: AbilityKey[];
  /** Skill keys (see `SKILLS`) this class may choose from, and how many. */
  skillChoices: { count: number; from: string[] };
  /** Level at which the subclass is chosen. */
  subclassLevel: number;
  /** What this class calls its subclass, e.g. "Divine Domain". */
  subclassLabel: string;
  caster: CasterKind;
  /** Levels granting an Ability Score Improvement (or a feat). */
  asiLevels: number[];
  multiclassPrereq: MulticlassPrereq;
};

/** Every skill key, for classes that choose from the full list (Bard). */
const ANY_SKILL = [
  "acrobatics", "animal_handling", "arcana", "athletics", "deception", "history",
  "insight", "intimidation", "investigation", "medicine", "nature", "perception",
  "performance", "persuasion", "religion", "sleight_of_hand", "stealth", "survival",
];

const STANDARD_ASI = [4, 8, 12, 16, 19];

export const CLASS_RULES: ClassRules[] = [
  {
    name: "Barbarian",
    hitDie: 12,
    savingThrows: ["str", "con"],
    skillChoices: {
      count: 2,
      from: ["animal_handling", "athletics", "intimidation", "nature", "perception", "survival"],
    },
    subclassLevel: 3,
    subclassLabel: "Primal Path",
    caster: "none",
    asiLevels: STANDARD_ASI,
    multiclassPrereq: { all: { str: 13 } },
  },
  {
    name: "Bard",
    hitDie: 8,
    savingThrows: ["dex", "cha"],
    skillChoices: { count: 3, from: ANY_SKILL },
    subclassLevel: 3,
    subclassLabel: "Bard College",
    caster: "full",
    asiLevels: STANDARD_ASI,
    multiclassPrereq: { all: { cha: 13 } },
  },
  {
    name: "Cleric",
    hitDie: 8,
    savingThrows: ["wis", "cha"],
    skillChoices: {
      count: 2,
      from: ["history", "insight", "medicine", "persuasion", "religion"],
    },
    subclassLevel: 1,
    subclassLabel: "Divine Domain",
    caster: "full",
    asiLevels: STANDARD_ASI,
    multiclassPrereq: { all: { wis: 13 } },
  },
  {
    name: "Druid",
    hitDie: 8,
    savingThrows: ["int", "wis"],
    skillChoices: {
      count: 2,
      from: ["arcana", "animal_handling", "insight", "medicine", "nature", "perception", "religion", "survival"],
    },
    subclassLevel: 2,
    subclassLabel: "Druid Circle",
    caster: "full",
    asiLevels: STANDARD_ASI,
    multiclassPrereq: { all: { wis: 13 } },
  },
  {
    name: "Fighter",
    hitDie: 10,
    savingThrows: ["str", "con"],
    skillChoices: {
      count: 2,
      from: ["acrobatics", "animal_handling", "athletics", "history", "insight", "intimidation", "perception", "survival"],
    },
    subclassLevel: 3,
    subclassLabel: "Martial Archetype",
    // Only the Eldritch Knight casts; slots are granted from the subclass, so
    // the class itself is treated as non-casting until that is picked.
    caster: "none",
    asiLevels: [4, 6, 8, 12, 14, 16, 19],
    multiclassPrereq: { any: { str: 13, dex: 13 } },
  },
  {
    name: "Monk",
    hitDie: 8,
    savingThrows: ["str", "dex"],
    skillChoices: {
      count: 2,
      from: ["acrobatics", "athletics", "history", "insight", "religion", "stealth"],
    },
    subclassLevel: 3,
    subclassLabel: "Monastic Tradition",
    caster: "none",
    asiLevels: STANDARD_ASI,
    multiclassPrereq: { all: { dex: 13, wis: 13 } },
  },
  {
    name: "Paladin",
    hitDie: 10,
    savingThrows: ["wis", "cha"],
    skillChoices: {
      count: 2,
      from: ["athletics", "insight", "intimidation", "medicine", "persuasion", "religion"],
    },
    subclassLevel: 3,
    subclassLabel: "Sacred Oath",
    caster: "half",
    asiLevels: STANDARD_ASI,
    multiclassPrereq: { all: { str: 13, cha: 13 } },
  },
  {
    name: "Ranger",
    hitDie: 10,
    savingThrows: ["str", "dex"],
    skillChoices: {
      count: 3,
      from: ["animal_handling", "athletics", "insight", "investigation", "nature", "perception", "stealth", "survival"],
    },
    subclassLevel: 3,
    subclassLabel: "Ranger Archetype",
    caster: "half",
    asiLevels: STANDARD_ASI,
    multiclassPrereq: { all: { dex: 13, wis: 13 } },
  },
  {
    name: "Rogue",
    hitDie: 8,
    savingThrows: ["dex", "int"],
    skillChoices: {
      count: 4,
      from: ["acrobatics", "athletics", "deception", "insight", "intimidation", "investigation", "perception", "performance", "persuasion", "sleight_of_hand", "stealth"],
    },
    subclassLevel: 3,
    subclassLabel: "Roguish Archetype",
    caster: "none",
    asiLevels: [4, 8, 10, 12, 16, 19],
    multiclassPrereq: { all: { dex: 13 } },
  },
  {
    name: "Sorcerer",
    hitDie: 6,
    savingThrows: ["con", "cha"],
    skillChoices: {
      count: 2,
      from: ["arcana", "deception", "insight", "intimidation", "persuasion", "religion"],
    },
    subclassLevel: 1,
    subclassLabel: "Sorcerous Origin",
    caster: "full",
    asiLevels: STANDARD_ASI,
    multiclassPrereq: { all: { cha: 13 } },
  },
  {
    name: "Warlock",
    hitDie: 8,
    savingThrows: ["wis", "cha"],
    skillChoices: {
      count: 2,
      from: ["arcana", "deception", "history", "intimidation", "investigation", "nature", "religion"],
    },
    subclassLevel: 1,
    subclassLabel: "Otherworldly Patron",
    caster: "pact",
    asiLevels: STANDARD_ASI,
    multiclassPrereq: { all: { cha: 13 } },
  },
  {
    name: "Wizard",
    hitDie: 6,
    savingThrows: ["int", "wis"],
    skillChoices: {
      count: 2,
      from: ["arcana", "history", "insight", "investigation", "medicine", "religion"],
    },
    subclassLevel: 2,
    subclassLabel: "Arcane Tradition",
    caster: "full",
    asiLevels: STANDARD_ASI,
    multiclassPrereq: { all: { int: 13 } },
  },
  {
    name: "Artificer",
    hitDie: 8,
    savingThrows: ["con", "int"],
    skillChoices: {
      count: 2,
      from: ["arcana", "history", "investigation", "medicine", "nature", "perception", "sleight_of_hand"],
    },
    subclassLevel: 3,
    subclassLabel: "Artificer Specialist",
    caster: "artificer",
    asiLevels: STANDARD_ASI,
    multiclassPrereq: { all: { int: 13 } },
  },
];

const BY_NAME = new Map(CLASS_RULES.map((c) => [c.name.toLowerCase(), c]));

/** Rules for a (possibly homebrew or misspelled) class name. */
export function classRules(className: string): ClassRules | null {
  return BY_NAME.get(className?.trim().toLowerCase() ?? "") ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Spell slots                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Slots per spell level 1-9 by *caster level*. Index 0 is caster level 1.
 * Half and third casters index this same table at a reduced caster level, which
 * is exactly how the multiclass spellcaster table works.
 */
const FULL_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // 20
];

/** Warlock Pact Magic: slot count and slot level by warlock level. */
const PACT_MAGIC: { slots: number; level: number }[] = [
  { slots: 1, level: 1 },  // 1
  { slots: 2, level: 1 },  // 2
  { slots: 2, level: 2 },  // 3
  { slots: 2, level: 2 },  // 4
  { slots: 2, level: 3 },  // 5
  { slots: 2, level: 3 },  // 6
  { slots: 2, level: 4 },  // 7
  { slots: 2, level: 4 },  // 8
  { slots: 2, level: 5 },  // 9
  { slots: 2, level: 5 },  // 10
  { slots: 3, level: 5 },  // 11
  { slots: 3, level: 5 },  // 12
  { slots: 3, level: 5 },  // 13
  { slots: 3, level: 5 },  // 14
  { slots: 3, level: 5 },  // 15
  { slots: 3, level: 5 },  // 16
  { slots: 4, level: 5 },  // 17
  { slots: 4, level: 5 },  // 18
  { slots: 4, level: 5 },  // 19
  { slots: 4, level: 5 },  // 20
];

/** One class's contribution to the shared (Vancian) caster level. */
export function casterLevelContribution(caster: CasterKind, level: number): number {
  if (level <= 0) return 0;
  switch (caster) {
    case "full":
      return level;
    // A paladin/ranger has no slots at level 1 and tracks ceil(level/2) after.
    case "half":
      return level < 2 ? 0 : Math.ceil(level / 2);
    // The artificer casts from level 1, always rounding up.
    case "artificer":
      return Math.ceil(level / 2);
    // Eldritch Knight / Arcane Trickster come online at level 3.
    case "third":
      return level < 3 ? 0 : Math.ceil(level / 3);
    default:
      return 0;
  }
}

export type ClassLevel = { className: string; level: number };

/**
 * Spell slots for a character, keyed by spell level (1-9). Warlock pact slots
 * are merged in by taking whichever is larger at that level, since Sanctum
 * stores a single slot pool per level.
 */
export function spellSlotsFor(classes: ClassLevel[]): Record<number, number> {
  let casterLevel = 0;
  let pact: { slots: number; level: number } | null = null;

  for (const entry of classes) {
    const rules = classRules(entry.className);
    if (!rules || entry.level <= 0) continue;
    if (rules.caster === "pact") {
      const row = PACT_MAGIC[Math.min(entry.level, 20) - 1];
      if (row) pact = row;
      continue;
    }
    casterLevel += casterLevelContribution(rules.caster, entry.level);
  }

  const slots: Record<number, number> = {};
  const row = FULL_CASTER_SLOTS[Math.min(casterLevel, 20) - 1];
  if (row) {
    row.forEach((count, index) => {
      if (count > 0) slots[index + 1] = count;
    });
  }
  if (pact) {
    slots[pact.level] = Math.max(slots[pact.level] ?? 0, pact.slots);
  }
  return slots;
}

/* -------------------------------------------------------------------------- */
/*  Level-up maths                                                             */
/* -------------------------------------------------------------------------- */

/** Average HP gained per level from a hit die (5e "take the average" rule). */
export function averageHitDieRoll(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1;
}

/**
 * HP gained for one level. Constitution modifier applies per level and the
 * total gain is never less than 1, matching the rule for a negative CON mod.
 */
export function hitPointsGained(hitDie: number, conModifier: number, rolled?: number): number {
  const base = rolled ?? averageHitDieRoll(hitDie);
  return Math.max(1, base + conModifier);
}

/** Level 1 HP is the maximum of the hit die plus the CON modifier. */
export function startingHitPoints(hitDie: number, conModifier: number): number {
  return Math.max(1, hitDie + conModifier);
}

/* -------------------------------------------------------------------------- */
/*  Multiclassing                                                              */
/* -------------------------------------------------------------------------- */

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export type PrereqCheck = { ok: boolean; reason: string | null };

/**
 * Whether `scores` satisfy the prerequisites for taking a level in `className`.
 * Unknown (homebrew) classes have no prerequisites and always pass.
 */
export function meetsMulticlassPrereq(
  className: string,
  scores: Record<AbilityKey, number>,
): PrereqCheck {
  const rules = classRules(className);
  if (!rules) return { ok: true, reason: null };

  const { all, any } = rules.multiclassPrereq;

  if (all) {
    const missing = (Object.entries(all) as [AbilityKey, number][]).filter(
      ([ability, min]) => (scores[ability] ?? 0) < min,
    );
    if (missing.length > 0) {
      const needs = missing
        .map(([ability, min]) => `${ABILITY_LABELS[ability]} ${min}`)
        .join(" and ");
      return {
        ok: false,
        reason: `${rules.name} needs ${needs} (you have ${missing
          .map(([ability]) => `${ABILITY_LABELS[ability]} ${scores[ability] ?? 0}`)
          .join(", ")}).`,
      };
    }
  }

  if (any) {
    const entries = Object.entries(any) as [AbilityKey, number][];
    const met = entries.some(([ability, min]) => (scores[ability] ?? 0) >= min);
    if (!met) {
      const needs = entries
        .map(([ability, min]) => `${ABILITY_LABELS[ability]} ${min}`)
        .join(" or ");
      return { ok: false, reason: `${rules.name} needs ${needs}.` };
    }
  }

  return { ok: true, reason: null };
}

/** Human-readable prerequisite line, e.g. "Strength 13 and Charisma 13". */
export function describePrereq(className: string): string | null {
  const rules = classRules(className);
  if (!rules) return null;
  const { all, any } = rules.multiclassPrereq;
  if (all) {
    return (Object.entries(all) as [AbilityKey, number][])
      .map(([ability, min]) => `${ABILITY_LABELS[ability]} ${min}`)
      .join(" and ");
  }
  if (any) {
    return (Object.entries(any) as [AbilityKey, number][])
      .map(([ability, min]) => `${ABILITY_LABELS[ability]} ${min}`)
      .join(" or ");
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Ability score generation                                                   */
/* -------------------------------------------------------------------------- */

/** The standard array, highest first. */
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

/** Point-buy cost of each score, 27 points to spend across six abilities. */
export const POINT_BUY_COST: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

/** Points spent on a set of scores; unbuyable scores cost nothing extra. */
export function pointBuySpent(scores: Record<AbilityKey, number>): number {
  return Object.values(scores).reduce(
    (total, score) => total + (POINT_BUY_COST[score] ?? 0),
    0,
  );
}
