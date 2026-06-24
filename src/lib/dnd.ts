import { SKILLS, type AbilityKey } from "./constants";

/** D&D 5e ability modifier from a raw score. */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Format a modifier with an explicit sign, e.g. 3 -> "+3", -1 -> "-1". */
export function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

/** Proficiency bonus for a given character level (5e progression). */
export function proficiencyBonusForLevel(level: number): number {
  return Math.ceil(Math.max(1, level) / 4) + 1;
}

export type AbilityScores = Record<AbilityKey, number>;

/** Saving throw bonus for an ability, given proficiency. */
export function savingThrowBonus(
  scores: AbilityScores,
  ability: AbilityKey,
  proficient: boolean,
  proficiencyBonus: number,
): number {
  return abilityModifier(scores[ability]) + (proficient ? proficiencyBonus : 0);
}

/** Skill check bonus given proficiency. */
export function skillBonus(
  scores: AbilityScores,
  skillKey: string,
  proficient: boolean,
  proficiencyBonus: number,
): number {
  const skill = SKILLS.find((s) => s.key === skillKey);
  if (!skill) return 0;
  return abilityModifier(scores[skill.ability]) + (proficient ? proficiencyBonus : 0);
}

/** Passive Perception = 10 + Perception bonus. */
export function passivePerception(
  scores: AbilityScores,
  perceptionProficient: boolean,
  proficiencyBonus: number,
): number {
  return 10 + skillBonus(scores, "perception", perceptionProficient, proficiencyBonus);
}

/** Proficiency bonus derived from a monster's challenge rating. */
export function proficiencyBonusForCR(cr: string): number {
  const numeric = cr.includes("/") ? 0 : Number(cr);
  if (Number.isNaN(numeric)) return 2;
  if (numeric <= 4) return 2;
  if (numeric <= 8) return 3;
  if (numeric <= 12) return 4;
  if (numeric <= 16) return 5;
  if (numeric <= 20) return 6;
  if (numeric <= 24) return 7;
  if (numeric <= 28) return 8;
  return 9;
}

/** Roll a single die with the given number of sides. */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/** Roll `count` dice of `sides` and add a flat modifier. */
export function rollDice(count: number, sides: number, modifier = 0): number {
  let total = modifier;
  for (let i = 0; i < count; i++) total += rollDie(sides);
  return total;
}

/** Pick a weighted random entry. Returns the chosen index. */
export function weightedPick(weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (total <= 0) return Math.floor(Math.random() * weights.length);
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= Math.max(0, weights[i]);
    if (roll < 0) return i;
  }
  return weights.length - 1;
}
