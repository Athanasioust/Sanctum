/**
 * Mechanical traits for species (races) and backgrounds, used by the character
 * wizard to pre-fill ability bonuses, speed, darkvision, languages and skill
 * proficiencies.
 *
 * Like `class-rules.ts`, this holds numbers and lists rather than rules text.
 * Anything missing degrades to the defaults below, so homebrew and unlisted
 * lineages still work — the wizard just doesn't pre-fill for them.
 */

import type { AbilityKey } from "./constants";

export type SpeciesTraits = {
  /** Fixed ability score increases. Flexible ones are described instead. */
  abilityBonuses: Partial<Record<AbilityKey, number>>;
  speed: number;
  /** Darkvision range in feet; 0 = none. */
  darkvision: number;
  languages: string[];
  /**
   * Bonuses the player must choose (Half-Elf's +1/+1, the 2024/MPMM floating
   * +2/+1). Shown as a hint; the wizard never applies these automatically.
   */
  flexible?: string;
};

const DEFAULT_TRAITS: SpeciesTraits = {
  abilityBonuses: {},
  speed: 30,
  darkvision: 0,
  languages: ["Common"],
};

/** Traits keyed by the names in `RACE_CATALOG`. */
export const SPECIES_TRAITS: Record<string, SpeciesTraits> = {
  Dragonborn: { abilityBonuses: { str: 2, cha: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Draconic"] },
  "Chromatic Dragonborn": { abilityBonuses: { str: 2, cha: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Draconic"] },
  "Metallic Dragonborn": { abilityBonuses: { str: 2, cha: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Draconic"] },
  "Gem Dragonborn": { abilityBonuses: { str: 2, cha: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Draconic"] },

  Dwarf: { abilityBonuses: { con: 2 }, speed: 25, darkvision: 60, languages: ["Common", "Dwarvish"] },
  "Hill Dwarf": { abilityBonuses: { con: 2, wis: 1 }, speed: 25, darkvision: 60, languages: ["Common", "Dwarvish"] },
  "Mountain Dwarf": { abilityBonuses: { con: 2, str: 2 }, speed: 25, darkvision: 60, languages: ["Common", "Dwarvish"] },
  "Duergar (Gray Dwarf)": { abilityBonuses: { con: 2, str: 1 }, speed: 25, darkvision: 120, languages: ["Common", "Dwarvish", "Undercommon"] },

  Elf: { abilityBonuses: { dex: 2 }, speed: 30, darkvision: 60, languages: ["Common", "Elvish"] },
  "High Elf": { abilityBonuses: { dex: 2, int: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Elvish"] },
  "Wood Elf": { abilityBonuses: { dex: 2, wis: 1 }, speed: 35, darkvision: 60, languages: ["Common", "Elvish"] },
  "Dark Elf (Drow)": { abilityBonuses: { dex: 2, cha: 1 }, speed: 30, darkvision: 120, languages: ["Common", "Elvish"] },
  "Sea Elf": { abilityBonuses: { dex: 2, con: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Elvish", "Primordial"] },
  "Shadar-kai": { abilityBonuses: { dex: 2, con: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Elvish"] },
  Eladrin: { abilityBonuses: { dex: 2, cha: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Elvish"] },
  "Astral Elf": { abilityBonuses: {}, speed: 30, darkvision: 60, languages: ["Common", "Elvish"], flexible: "+2/+1 or +1/+1/+1 of your choice" },

  Gnome: { abilityBonuses: { int: 2 }, speed: 25, darkvision: 60, languages: ["Common", "Gnomish"] },
  "Rock Gnome": { abilityBonuses: { int: 2, con: 1 }, speed: 25, darkvision: 60, languages: ["Common", "Gnomish"] },
  "Forest Gnome": { abilityBonuses: { int: 2, dex: 1 }, speed: 25, darkvision: 60, languages: ["Common", "Gnomish"] },
  "Deep Gnome (Svirfneblin)": { abilityBonuses: { int: 2, dex: 1 }, speed: 25, darkvision: 120, languages: ["Common", "Gnomish", "Undercommon"] },

  "Half-Elf": { abilityBonuses: { cha: 2 }, speed: 30, darkvision: 60, languages: ["Common", "Elvish"], flexible: "+1 to two other abilities of your choice" },
  "Half-Orc": { abilityBonuses: { str: 2, con: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Orc"] },

  Halfling: { abilityBonuses: { dex: 2 }, speed: 25, darkvision: 0, languages: ["Common", "Halfling"] },
  "Lightfoot Halfling": { abilityBonuses: { dex: 2, cha: 1 }, speed: 25, darkvision: 0, languages: ["Common", "Halfling"] },
  "Stout Halfling": { abilityBonuses: { dex: 2, con: 1 }, speed: 25, darkvision: 0, languages: ["Common", "Halfling"] },

  Human: { abilityBonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, speed: 30, darkvision: 0, languages: ["Common"] },
  "Variant Human": { abilityBonuses: {}, speed: 30, darkvision: 0, languages: ["Common"], flexible: "+1 to two abilities of your choice, plus a skill and a feat" },

  Tiefling: { abilityBonuses: { cha: 2, int: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Infernal"] },
  Aasimar: { abilityBonuses: { cha: 2 }, speed: 30, darkvision: 60, languages: ["Common", "Celestial"], flexible: "+1 to one other ability (2014 subrace)" },
  Goliath: { abilityBonuses: { str: 2, con: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Giant"] },
  Orc: { abilityBonuses: { str: 2, con: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Orc"] },

  Aarakocra: { abilityBonuses: { dex: 2, wis: 1 }, speed: 25, darkvision: 0, languages: ["Common", "Primordial"] },
  "Air Genasi": { abilityBonuses: { con: 2, dex: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Primordial"] },
  "Earth Genasi": { abilityBonuses: { con: 2, str: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Primordial"] },
  "Fire Genasi": { abilityBonuses: { con: 2, int: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Primordial"] },
  "Water Genasi": { abilityBonuses: { con: 2, wis: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Primordial"] },

  Firbolg: { abilityBonuses: { wis: 2, str: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Elvish", "Giant"] },
  Kenku: { abilityBonuses: { dex: 2, wis: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Primordial"] },
  Lizardfolk: { abilityBonuses: { con: 2, wis: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Draconic"] },
  Tabaxi: { abilityBonuses: { dex: 2, cha: 1 }, speed: 30, darkvision: 60, languages: ["Common"] },
  Triton: { abilityBonuses: { str: 1, con: 1, cha: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Primordial"] },
  Bugbear: { abilityBonuses: { str: 2, dex: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Goblin"] },
  Goblin: { abilityBonuses: { dex: 2, con: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Goblin"] },
  Hobgoblin: { abilityBonuses: { con: 2, int: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Goblin"] },
  Kobold: { abilityBonuses: { dex: 2 }, speed: 30, darkvision: 60, languages: ["Common", "Draconic"] },
  "Yuan-ti Pureblood": { abilityBonuses: { cha: 2, int: 1 }, speed: 30, darkvision: 60, languages: ["Common", "Abyssal", "Draconic"] },

  Githyanki: { abilityBonuses: { str: 2, int: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Deep Speech"] },
  Githzerai: { abilityBonuses: { wis: 2, int: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Deep Speech"] },

  Centaur: { abilityBonuses: { str: 2, wis: 1 }, speed: 40, darkvision: 0, languages: ["Common", "Sylvan"] },
  Loxodon: { abilityBonuses: { con: 2, wis: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Loxodon"] },
  Minotaur: { abilityBonuses: { str: 2, con: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Minotaur"] },
  "Simic Hybrid": { abilityBonuses: { con: 2 }, speed: 30, darkvision: 60, languages: ["Common"], flexible: "+1 to one other ability of your choice" },
  Vedalken: { abilityBonuses: { int: 2, wis: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Vedalken"] },

  Changeling: { abilityBonuses: { cha: 2 }, speed: 30, darkvision: 60, languages: ["Common"], flexible: "+1 to one other ability of your choice" },
  Kalashtar: { abilityBonuses: { wis: 2, cha: 1 }, speed: 30, darkvision: 0, languages: ["Common", "Quori"] },
  Shifter: { abilityBonuses: { dex: 1 }, speed: 30, darkvision: 60, languages: ["Common"], flexible: "+2 to one ability by shifter subrace" },
  Warforged: { abilityBonuses: { con: 2 }, speed: 30, darkvision: 0, languages: ["Common"], flexible: "+1 to one other ability of your choice" },

  Leonin: { abilityBonuses: { con: 2, str: 1 }, speed: 35, darkvision: 60, languages: ["Common", "Leonin"] },
  Satyr: { abilityBonuses: { cha: 2, dex: 1 }, speed: 35, darkvision: 0, languages: ["Common", "Sylvan"] },

  "Custom Lineage": { abilityBonuses: {}, speed: 30, darkvision: 0, languages: ["Common"], flexible: "+2 to one ability, plus a feat and a skill" },

  Dhampir: { abilityBonuses: {}, speed: 35, darkvision: 60, languages: ["Common"], flexible: "+2/+1 or +1/+1/+1 of your choice" },
  Hexblood: { abilityBonuses: {}, speed: 30, darkvision: 60, languages: ["Common"], flexible: "+2/+1 or +1/+1/+1 of your choice" },
  Reborn: { abilityBonuses: {}, speed: 30, darkvision: 60, languages: ["Common"], flexible: "+2/+1 or +1/+1/+1 of your choice" },

  Owlin: { abilityBonuses: {}, speed: 30, darkvision: 120, languages: ["Common"], flexible: "+2/+1 or +1/+1/+1 of your choice" },
  Autognome: { abilityBonuses: {}, speed: 30, darkvision: 60, languages: ["Common"], flexible: "+2/+1 or +1/+1/+1 of your choice" },
  Giff: { abilityBonuses: {}, speed: 30, darkvision: 0, languages: ["Common"], flexible: "+2/+1 or +1/+1/+1 of your choice" },
  Hadozee: { abilityBonuses: {}, speed: 30, darkvision: 0, languages: ["Common"], flexible: "+2/+1 or +1/+1/+1 of your choice" },
  Plasmoid: { abilityBonuses: {}, speed: 30, darkvision: 60, languages: ["Common"], flexible: "+2/+1 or +1/+1/+1 of your choice" },
  "Thri-kreen": { abilityBonuses: {}, speed: 30, darkvision: 60, languages: ["Common"], flexible: "+2/+1 or +1/+1/+1 of your choice" },
  Kender: { abilityBonuses: {}, speed: 30, darkvision: 0, languages: ["Common"], flexible: "+2/+1 or +1/+1/+1 of your choice" },
};

/** Traits for a species name, falling back to sane defaults for homebrew. */
export function speciesTraits(name: string): SpeciesTraits {
  return SPECIES_TRAITS[name?.trim() ?? ""] ?? DEFAULT_TRAITS;
}

/* -------------------------------------------------------------------------- */
/*  Backgrounds                                                                */
/* -------------------------------------------------------------------------- */

export type BackgroundTraits = {
  /** Skill keys (see `SKILLS`) this background grants. */
  skills: string[];
  /**
   * Backgrounds that let you choose some of their skills say so here; the
   * wizard grants the fixed ones and leaves the rest to the player.
   */
  note?: string;
};

/** Skill grants keyed by the names in `BACKGROUND_CATALOG`. */
export const BACKGROUND_TRAITS: Record<string, BackgroundTraits> = {
  Acolyte: { skills: ["insight", "religion"] },
  Charlatan: { skills: ["deception", "sleight_of_hand"] },
  Criminal: { skills: ["deception", "stealth"] },
  Entertainer: { skills: ["acrobatics", "performance"] },
  "Folk Hero": { skills: ["animal_handling", "survival"] },
  "Guild Artisan": { skills: ["insight", "persuasion"] },
  Hermit: { skills: ["medicine", "religion"] },
  Noble: { skills: ["history", "persuasion"] },
  Outlander: { skills: ["athletics", "survival"] },
  Sage: { skills: ["arcana", "history"] },
  Sailor: { skills: ["athletics", "perception"] },
  Soldier: { skills: ["athletics", "intimidation"] },
  Urchin: { skills: ["sleight_of_hand", "stealth"] },
  Gladiator: { skills: ["acrobatics", "performance"] },
  Knight: { skills: ["history", "persuasion"] },
  Pirate: { skills: ["athletics", "perception"] },
  Spy: { skills: ["deception", "stealth"] },

  // 2024 Player's Handbook
  Artisan: { skills: ["investigation", "persuasion"] },
  Farmer: { skills: ["animal_handling", "nature"] },
  Guard: { skills: ["athletics", "perception"] },
  Guide: { skills: ["stealth", "survival"] },
  Merchant: { skills: ["animal_handling", "persuasion"] },
  Scribe: { skills: ["investigation", "perception"] },
  Wayfarer: { skills: ["insight", "stealth"] },

  "City Watch": { skills: ["athletics", "insight"] },
  "Clan Crafter": { skills: ["history", "insight"] },
  "Cloistered Scholar": { skills: ["history", "religion"] },
  Courtier: { skills: ["insight", "persuasion"] },
  "Faction Agent": { skills: ["insight"], note: "Plus one Intelligence, Wisdom or Charisma skill of your choice." },
  "Far Traveler": { skills: ["insight", "perception"] },
  Inheritor: { skills: ["survival"], note: "Plus Arcana, History or Religion." },
  "Knight of the Order": { skills: ["persuasion"], note: "Plus Arcana, History, Nature or Religion." },
  "Mercenary Veteran": { skills: ["athletics", "persuasion"] },
  "Urban Bounty Hunter": { skills: [], note: "Choose two from Deception, Insight, Persuasion and Stealth." },
  "Uthgardt Tribe Member": { skills: ["athletics", "survival"] },
  "Waterdhavian Noble": { skills: ["history", "persuasion"] },

  Anthropologist: { skills: ["insight", "religion"] },
  Archaeologist: { skills: ["history", "survival"] },
  "Haunted One": { skills: [], note: "Choose two from Arcana, Investigation, Religion and Survival." },
  Investigator: { skills: ["investigation", "perception"] },
  Athlete: { skills: ["acrobatics", "athletics"] },
  Fisher: { skills: ["history", "survival"] },
  Marine: { skills: ["athletics", "survival"] },
  Shipwright: { skills: ["history", "perception"] },
  Smuggler: { skills: ["athletics", "deception"] },
};

/** Skill grants for a background name; unknown backgrounds grant nothing. */
export function backgroundTraits(name: string): BackgroundTraits {
  return BACKGROUND_TRAITS[name?.trim() ?? ""] ?? { skills: [] };
}
