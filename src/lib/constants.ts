/**
 * Shared D&D 5e reference data used across forms, stat blocks and combat.
 */

export const ABILITIES = [
  { key: "str", label: "Strength", short: "STR" },
  { key: "dex", label: "Dexterity", short: "DEX" },
  { key: "con", label: "Constitution", short: "CON" },
  { key: "int", label: "Intelligence", short: "INT" },
  { key: "wis", label: "Wisdom", short: "WIS" },
  { key: "cha", label: "Charisma", short: "CHA" },
] as const;

export type AbilityKey = (typeof ABILITIES)[number]["key"];

export const SKILLS: { key: string; label: string; ability: AbilityKey }[] = [
  { key: "acrobatics", label: "Acrobatics", ability: "dex" },
  { key: "animal_handling", label: "Animal Handling", ability: "wis" },
  { key: "arcana", label: "Arcana", ability: "int" },
  { key: "athletics", label: "Athletics", ability: "str" },
  { key: "deception", label: "Deception", ability: "cha" },
  { key: "history", label: "History", ability: "int" },
  { key: "insight", label: "Insight", ability: "wis" },
  { key: "intimidation", label: "Intimidation", ability: "cha" },
  { key: "investigation", label: "Investigation", ability: "int" },
  { key: "medicine", label: "Medicine", ability: "wis" },
  { key: "nature", label: "Nature", ability: "int" },
  { key: "perception", label: "Perception", ability: "wis" },
  { key: "performance", label: "Performance", ability: "cha" },
  { key: "persuasion", label: "Persuasion", ability: "cha" },
  { key: "religion", label: "Religion", ability: "int" },
  { key: "sleight_of_hand", label: "Sleight of Hand", ability: "dex" },
  { key: "stealth", label: "Stealth", ability: "dex" },
  { key: "survival", label: "Survival", ability: "wis" },
];

/** The 14 standard 5e conditions (exhaustion is tracked separately, 0-6). */
export const CONDITIONS = [
  "Blinded",
  "Charmed",
  "Deafened",
  "Frightened",
  "Grappled",
  "Incapacitated",
  "Invisible",
  "Paralyzed",
  "Petrified",
  "Poisoned",
  "Prone",
  "Restrained",
  "Stunned",
  "Unconscious",
] as const;

export const EXHAUSTION_EFFECTS: Record<number, string> = {
  0: "No exhaustion",
  1: "Disadvantage on ability checks",
  2: "Speed halved",
  3: "Disadvantage on attack rolls and saving throws",
  4: "Hit point maximum halved",
  5: "Speed reduced to 0",
  6: "Death",
};

export const DAMAGE_TYPES = [
  "Acid",
  "Bludgeoning",
  "Cold",
  "Fire",
  "Force",
  "Lightning",
  "Necrotic",
  "Piercing",
  "Poison",
  "Psychic",
  "Radiant",
  "Slashing",
  "Thunder",
] as const;

export const SPELL_SCHOOLS = [
  "Abjuration",
  "Conjuration",
  "Divination",
  "Enchantment",
  "Evocation",
  "Illusion",
  "Necromancy",
  "Transmutation",
] as const;

export const SIZES = [
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
] as const;

export const ALIGNMENTS = [
  "Lawful Good",
  "Neutral Good",
  "Chaotic Good",
  "Lawful Neutral",
  "True Neutral",
  "Chaotic Neutral",
  "Lawful Evil",
  "Neutral Evil",
  "Chaotic Evil",
  "Unaligned",
] as const;

export const CLASSES = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
  "Artificer",
] as const;

/** Hit die size (dN) per class, for hit-dice healing on a short rest. */
export const CLASS_HIT_DICE: Record<string, number> = {
  Barbarian: 12,
  Bard: 8,
  Cleric: 8,
  Druid: 8,
  Fighter: 10,
  Monk: 8,
  Paladin: 10,
  Ranger: 10,
  Rogue: 8,
  Sorcerer: 6,
  Warlock: 8,
  Wizard: 6,
  Artificer: 8,
};

/** Best-effort hit die for a (possibly free-text) class name; defaults to d8. */
export function hitDieForClass(cls: string): number {
  return CLASS_HIT_DICE[cls?.trim()] ?? 8;
}

export const RACES = [
  "Human",
  "Elf",
  "Dwarf",
  "Halfling",
  "Gnome",
  "Half-Elf",
  "Half-Orc",
  "Tiefling",
  "Dragonborn",
  "Aasimar",
  "Goliath",
  "Tabaxi",
  "Firbolg",
  "Genasi",
  "Orc",
  "Other",
] as const;

export const LANGUAGES = [
  "Common",
  "Dwarvish",
  "Elvish",
  "Giant",
  "Gnomish",
  "Goblin",
  "Halfling",
  "Orc",
  "Abyssal",
  "Celestial",
  "Draconic",
  "Deep Speech",
  "Infernal",
  "Primordial",
  "Sylvan",
  "Undercommon",
] as const;

export const ITEM_RARITIES = [
  "common",
  "uncommon",
  "rare",
  "very rare",
  "legendary",
  "artifact",
] as const;

export const CHALLENGE_RATINGS = [
  "0",
  "1/8",
  "1/4",
  "1/2",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
] as const;

/** XP awarded per challenge rating (used to auto-fill monster XP). */
export const CR_XP: Record<string, number> = {
  "0": 10,
  "1/8": 25,
  "1/4": 50,
  "1/2": 100,
  "1": 200,
  "2": 450,
  "3": 700,
  "4": 1100,
  "5": 1800,
  "6": 2300,
  "7": 2900,
  "8": 3900,
  "9": 5000,
  "10": 5900,
  "11": 7200,
  "12": 8400,
  "13": 10000,
  "14": 11500,
  "15": 13000,
  "16": 15000,
  "17": 18000,
  "18": 20000,
  "19": 22000,
  "20": 25000,
  "21": 33000,
  "22": 41000,
  "23": 50000,
  "24": 62000,
  "25": 75000,
  "26": 90000,
  "27": 105000,
  "28": 120000,
  "29": 135000,
  "30": 155000,
};

export const LOCATION_TYPES = [
  "city",
  "town",
  "village",
  "dungeon",
  "wilderness",
  "landmark",
  "building",
  "region",
  "plane",
  "other",
] as const;

export const STORY_EVENT_TYPES = [
  { key: "session_log", label: "Session Log" },
  { key: "plot_thread", label: "Plot Thread" },
  { key: "milestone", label: "Milestone" },
  { key: "event", label: "Event" },
] as const;

export const FACTION_RELATIONSHIPS = [
  "allied",
  "neutral",
  "hostile",
  "unknown",
] as const;

export const CALENDAR_EVENT_TYPES = [
  { key: "festival", label: "Festival" },
  { key: "quest_deadline", label: "Quest Deadline" },
  { key: "random_event", label: "Random Event" },
  { key: "other", label: "Other" },
] as const;

export const NOTE_COLORS = [
  { key: "default", label: "Default", swatch: "#161618" },
  { key: "purple", label: "Purple", swatch: "#7c3aed" },
  { key: "red", label: "Red", swatch: "#991b1b" },
  { key: "green", label: "Green", swatch: "#166534" },
  { key: "blue", label: "Blue", swatch: "#1d4ed8" },
  { key: "amber", label: "Amber", swatch: "#a16207" },
] as const;

/** A default 12-month calendar offered when a campaign opts into custom dates. */
export const DEFAULT_CUSTOM_CALENDAR = {
  yearLabel: "AG",
  yearOne: 1,
  weekdays: ["Sul", "Mol", "Zol", "Wir", "Zor", "Far", "Sar"],
  months: [
    { name: "Hammer", days: 30 },
    { name: "Alturiak", days: 30 },
    { name: "Ches", days: 30 },
    { name: "Tarsakh", days: 30 },
    { name: "Mirtul", days: 30 },
    { name: "Kythorn", days: 30 },
    { name: "Flamerule", days: 30 },
    { name: "Eleasis", days: 30 },
    { name: "Eleint", days: 30 },
    { name: "Marpenoth", days: 30 },
    { name: "Uktar", days: 30 },
    { name: "Nightal", days: 30 },
  ],
};
