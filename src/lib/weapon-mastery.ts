/**
 * 2024 Player's Handbook weapon mastery.
 *
 * Each martial class gets a number of weapons it can use the mastery property
 * of, growing at set levels. Sanctum tracks *which mastery properties* a
 * character has taken rather than modelling every weapon, which is what a DM
 * actually needs at the table.
 *
 * This is gated on the campaign having the 2024 Player's Handbook ticked in
 * settings (`rulebooks` containing "phb24"); a 2014 table never sees it.
 */

export type WeaponMastery = {
  name: string;
  effect: string;
  /** Representative weapons with this property, as a hint in the picker. */
  weapons: string[];
};

export const WEAPON_MASTERIES: WeaponMastery[] = [
  {
    name: "Cleave",
    effect:
      "On a melee hit, make one extra attack against a second creature within 5 feet of the first, without the ability modifier to damage. Once per turn.",
    weapons: ["Greataxe", "Greatsword", "Halberd"],
  },
  {
    name: "Graze",
    effect:
      "On a miss, the target still takes damage equal to your ability modifier for the attack.",
    weapons: ["Glaive", "Greatsword"],
  },
  {
    name: "Nick",
    effect:
      "The extra attack from Light can be made as part of the Attack action instead of as a Bonus Action, once per turn.",
    weapons: ["Dagger", "Light Hammer", "Sickle", "Scimitar"],
  },
  {
    name: "Push",
    effect: "On a hit, you can push the target up to 10 feet straight away from you.",
    weapons: ["Greatclub", "Heavy Crossbow", "Pike", "Warhammer"],
  },
  {
    name: "Sap",
    effect:
      "On a hit, the target has Disadvantage on its next attack roll before the start of your next turn.",
    weapons: ["Mace", "Spear", "Flail", "Longsword"],
  },
  {
    name: "Slow",
    effect:
      "On a hit, the target's Speed is reduced by 10 feet until the start of your next turn. Once per turn.",
    weapons: ["Club", "Dart", "Light Crossbow", "Sling", "Longbow", "Musket"],
  },
  {
    name: "Topple",
    effect:
      "On a hit, the target makes a Constitution save against your attack DC or has the Prone condition.",
    weapons: ["Battleaxe", "Lance", "Maul", "Quarterstaff", "Trident"],
  },
  {
    name: "Vex",
    effect:
      "On a hit, you have Advantage on your next attack roll against that target before the end of your next turn.",
    weapons: ["Blowgun", "Hand Crossbow", "Rapier", "Shortsword", "Shortbow", "Pistol"],
  },
];

/**
 * How many mastery properties each class knows, as `[level, count]` steps.
 * Classes not listed here have no Weapon Mastery feature.
 */
const MASTERY_PROGRESSION: Record<string, [number, number][]> = {
  Barbarian: [
    [1, 2],
    [4, 3],
    [10, 4],
  ],
  Fighter: [
    [1, 3],
    [4, 4],
    [10, 5],
    [16, 6],
  ],
  Paladin: [
    [1, 2],
    [11, 3],
  ],
  Ranger: [
    [1, 2],
    [9, 3],
  ],
  Rogue: [
    [1, 2],
    [9, 3],
  ],
};

/** Whether the class has Weapon Mastery at all under the 2024 rules. */
export function hasWeaponMastery(className: string): boolean {
  return Object.keys(MASTERY_PROGRESSION).some(
    (name) => name.toLowerCase() === className?.trim().toLowerCase(),
  );
}

/**
 * Mastery properties known at a given class level. Returns 0 for classes
 * without the feature and for levels before it comes online.
 */
export function masteryCount(className: string, level: number): number {
  const key = Object.keys(MASTERY_PROGRESSION).find(
    (name) => name.toLowerCase() === className?.trim().toLowerCase(),
  );
  if (!key) return 0;

  let count = 0;
  for (const [atLevel, known] of MASTERY_PROGRESSION[key]) {
    if (level >= atLevel) count = known;
  }
  return count;
}

/** Whether this campaign plays with the 2024 Player's Handbook. */
export function uses2024Rules(rulebooks: string[]): boolean {
  return Array.isArray(rulebooks) && rulebooks.includes("phb24");
}

/** Look up one mastery property by name. */
export function weaponMastery(name: string): WeaponMastery | undefined {
  return WEAPON_MASTERIES.find((m) => m.name.toLowerCase() === name.toLowerCase());
}
