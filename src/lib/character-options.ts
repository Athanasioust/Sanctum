/**
 * Catalog of pickable 5e character options (classes, subclasses, races and
 * backgrounds) tagged with the rulebooks they come from.
 *
 * Only *names* are stored here — no rules text — so this is a lookup index for
 * the character/NPC forms rather than a reproduction of any book. A campaign
 * ticks the books it plays with (`campaigns.rulebooks`) and the pickers narrow
 * to what those books allow; a campaign with nothing ticked sees everything.
 * Every picker still accepts a typed-in value, so homebrew never needs an entry.
 */

export type SourceBook = { key: string; label: string; short: string };

/** Books that grant player options, roughly in publication order. */
export const SOURCE_BOOKS: SourceBook[] = [
  { key: "srd", label: "SRD 5.1", short: "SRD" },
  { key: "phb", label: "Player's Handbook (2014)", short: "PHB" },
  { key: "phb24", label: "Player's Handbook (2024)", short: "PHB'24" },
  { key: "dmg", label: "Dungeon Master's Guide", short: "DMG" },
  { key: "ee", label: "Elemental Evil Player's Companion", short: "EE" },
  { key: "scag", label: "Sword Coast Adventurer's Guide", short: "SCAG" },
  { key: "vgm", label: "Volo's Guide to Monsters", short: "VGM" },
  { key: "toa", label: "Tomb of Annihilation", short: "ToA" },
  { key: "cos", label: "Curse of Strahd", short: "CoS" },
  { key: "xge", label: "Xanathar's Guide to Everything", short: "XGE" },
  { key: "mtf", label: "Mordenkainen's Tome of Foes", short: "MTF" },
  { key: "gos", label: "Ghosts of Saltmarsh", short: "GoS" },
  { key: "ggr", label: "Guildmasters' Guide to Ravnica", short: "GGR" },
  { key: "ai", label: "Acquisitions Incorporated", short: "AI" },
  { key: "erlw", label: "Eberron: Rising from the Last War", short: "ERLW" },
  { key: "bgdia", label: "Baldur's Gate: Descent into Avernus", short: "BGDiA" },
  { key: "egw", label: "Explorer's Guide to Wildemount", short: "EGW" },
  { key: "mot", label: "Mythic Odysseys of Theros", short: "MOT" },
  { key: "tce", label: "Tasha's Cauldron of Everything", short: "TCE" },
  { key: "vrgr", label: "Van Richten's Guide to Ravenloft", short: "VRGtR" },
  { key: "ftd", label: "Fizban's Treasury of Dragons", short: "FTD" },
  { key: "scc", label: "Strixhaven: A Curriculum of Chaos", short: "SCC" },
  { key: "mpmm", label: "Monsters of the Multiverse", short: "MPMM" },
  { key: "sais", label: "Spelljammer: Astral Adventurer's Guide", short: "SAiS" },
  { key: "dsotdq", label: "Dragonlance: Shadow of the Dragon Queen", short: "DSotDQ" },
  { key: "bgg", label: "Bigby Presents: Glory of the Giants", short: "BGG" },
];

export type CatalogEntry = { name: string; sources: string[] };
export type SubclassEntry = CatalogEntry & { className: string };

/** The three books that print the full core class list. */
const CORE = ["srd", "phb", "phb24"];

/* -------------------------------------------------------------------------- */
/*  Classes                                                                    */
/* -------------------------------------------------------------------------- */

export const CLASS_CATALOG: CatalogEntry[] = [
  { name: "Barbarian", sources: CORE },
  { name: "Bard", sources: CORE },
  { name: "Cleric", sources: CORE },
  { name: "Druid", sources: CORE },
  { name: "Fighter", sources: CORE },
  { name: "Monk", sources: CORE },
  { name: "Paladin", sources: CORE },
  { name: "Ranger", sources: CORE },
  { name: "Rogue", sources: CORE },
  { name: "Sorcerer", sources: CORE },
  { name: "Warlock", sources: CORE },
  { name: "Wizard", sources: CORE },
  { name: "Artificer", sources: ["erlw", "tce"] },
];

/* -------------------------------------------------------------------------- */
/*  Subclasses                                                                 */
/* -------------------------------------------------------------------------- */

export const SUBCLASS_CATALOG: SubclassEntry[] = [
  // Barbarian
  { className: "Barbarian", name: "Path of the Berserker", sources: CORE },
  { className: "Barbarian", name: "Path of the Totem Warrior", sources: ["phb"] },
  { className: "Barbarian", name: "Path of the Battlerager", sources: ["scag"] },
  { className: "Barbarian", name: "Path of the Ancestral Guardian", sources: ["xge"] },
  { className: "Barbarian", name: "Path of the Storm Herald", sources: ["xge"] },
  { className: "Barbarian", name: "Path of the Zealot", sources: ["xge", "phb24"] },
  { className: "Barbarian", name: "Path of the Juggernaut", sources: ["egw"] },
  { className: "Barbarian", name: "Path of the Beast", sources: ["tce"] },
  { className: "Barbarian", name: "Path of Wild Magic", sources: ["tce"] },
  { className: "Barbarian", name: "Path of the Giant", sources: ["bgg"] },
  { className: "Barbarian", name: "Path of the Wild Heart", sources: ["phb24"] },
  { className: "Barbarian", name: "Path of the World Tree", sources: ["phb24"] },

  // Bard
  { className: "Bard", name: "College of Lore", sources: CORE },
  { className: "Bard", name: "College of Valor", sources: ["phb", "phb24"] },
  { className: "Bard", name: "College of Glamour", sources: ["xge"] },
  { className: "Bard", name: "College of Swords", sources: ["xge"] },
  { className: "Bard", name: "College of Whispers", sources: ["xge"] },
  { className: "Bard", name: "College of Creation", sources: ["tce"] },
  { className: "Bard", name: "College of Eloquence", sources: ["mot", "tce"] },
  { className: "Bard", name: "College of Spirits", sources: ["vrgr"] },
  { className: "Bard", name: "College of Dance", sources: ["phb24"] },

  // Cleric
  { className: "Cleric", name: "Life Domain", sources: CORE },
  { className: "Cleric", name: "Knowledge Domain", sources: ["phb"] },
  { className: "Cleric", name: "Light Domain", sources: ["phb", "phb24"] },
  { className: "Cleric", name: "Nature Domain", sources: ["phb"] },
  { className: "Cleric", name: "Tempest Domain", sources: ["phb"] },
  { className: "Cleric", name: "Trickery Domain", sources: ["phb", "phb24"] },
  { className: "Cleric", name: "War Domain", sources: ["phb", "phb24"] },
  { className: "Cleric", name: "Death Domain", sources: ["dmg"] },
  { className: "Cleric", name: "Arcana Domain", sources: ["scag"] },
  { className: "Cleric", name: "Forge Domain", sources: ["xge"] },
  { className: "Cleric", name: "Grave Domain", sources: ["xge"] },
  { className: "Cleric", name: "Order Domain", sources: ["ggr", "tce"] },
  { className: "Cleric", name: "Peace Domain", sources: ["tce"] },
  { className: "Cleric", name: "Twilight Domain", sources: ["tce"] },

  // Druid
  { className: "Druid", name: "Circle of the Land", sources: CORE },
  { className: "Druid", name: "Circle of the Moon", sources: ["phb", "phb24"] },
  { className: "Druid", name: "Circle of Dreams", sources: ["xge"] },
  { className: "Druid", name: "Circle of the Shepherd", sources: ["xge"] },
  { className: "Druid", name: "Circle of Spores", sources: ["ggr", "tce"] },
  { className: "Druid", name: "Circle of Stars", sources: ["tce"] },
  { className: "Druid", name: "Circle of Wildfire", sources: ["tce"] },
  { className: "Druid", name: "Circle of the Sea", sources: ["phb24"] },

  // Fighter
  { className: "Fighter", name: "Champion", sources: CORE },
  { className: "Fighter", name: "Battle Master", sources: ["phb", "phb24"] },
  { className: "Fighter", name: "Eldritch Knight", sources: ["phb", "phb24"] },
  { className: "Fighter", name: "Purple Dragon Knight (Banneret)", sources: ["scag"] },
  { className: "Fighter", name: "Arcane Archer", sources: ["xge"] },
  { className: "Fighter", name: "Cavalier", sources: ["xge"] },
  { className: "Fighter", name: "Samurai", sources: ["xge"] },
  { className: "Fighter", name: "Echo Knight", sources: ["egw"] },
  { className: "Fighter", name: "Psi Warrior", sources: ["tce", "phb24"] },
  { className: "Fighter", name: "Rune Knight", sources: ["tce"] },

  // Monk
  { className: "Monk", name: "Way of the Open Hand", sources: CORE },
  { className: "Monk", name: "Way of Shadow", sources: ["phb", "phb24"] },
  { className: "Monk", name: "Way of the Four Elements", sources: ["phb", "phb24"] },
  { className: "Monk", name: "Way of the Long Death", sources: ["scag"] },
  { className: "Monk", name: "Way of the Sun Soul", sources: ["scag", "xge"] },
  { className: "Monk", name: "Way of the Drunken Master", sources: ["xge"] },
  { className: "Monk", name: "Way of the Kensei", sources: ["xge"] },
  { className: "Monk", name: "Way of the Astral Self", sources: ["tce"] },
  { className: "Monk", name: "Way of Mercy", sources: ["tce", "phb24"] },
  { className: "Monk", name: "Way of the Ascendant Dragon", sources: ["ftd"] },

  // Paladin
  { className: "Paladin", name: "Oath of Devotion", sources: CORE },
  { className: "Paladin", name: "Oath of the Ancients", sources: ["phb", "phb24"] },
  { className: "Paladin", name: "Oath of Vengeance", sources: ["phb", "phb24"] },
  { className: "Paladin", name: "Oathbreaker", sources: ["dmg"] },
  { className: "Paladin", name: "Oath of the Crown", sources: ["scag"] },
  { className: "Paladin", name: "Oath of Conquest", sources: ["xge"] },
  { className: "Paladin", name: "Oath of Redemption", sources: ["xge"] },
  { className: "Paladin", name: "Oath of Glory", sources: ["mot", "tce", "phb24"] },
  { className: "Paladin", name: "Oath of the Watchers", sources: ["tce"] },

  // Ranger
  { className: "Ranger", name: "Hunter", sources: CORE },
  { className: "Ranger", name: "Beast Master", sources: ["phb", "phb24"] },
  { className: "Ranger", name: "Gloom Stalker", sources: ["xge", "phb24"] },
  { className: "Ranger", name: "Horizon Walker", sources: ["xge"] },
  { className: "Ranger", name: "Monster Slayer", sources: ["xge"] },
  { className: "Ranger", name: "Fey Wanderer", sources: ["tce", "phb24"] },
  { className: "Ranger", name: "Swarmkeeper", sources: ["tce"] },
  { className: "Ranger", name: "Drakewarden", sources: ["ftd"] },

  // Rogue
  { className: "Rogue", name: "Thief", sources: CORE },
  { className: "Rogue", name: "Arcane Trickster", sources: ["phb", "phb24"] },
  { className: "Rogue", name: "Assassin", sources: ["phb", "phb24"] },
  { className: "Rogue", name: "Mastermind", sources: ["scag", "xge"] },
  { className: "Rogue", name: "Swashbuckler", sources: ["scag", "xge"] },
  { className: "Rogue", name: "Inquisitive", sources: ["xge"] },
  { className: "Rogue", name: "Scout", sources: ["xge"] },
  { className: "Rogue", name: "Phantom", sources: ["tce"] },
  { className: "Rogue", name: "Soulknife", sources: ["tce", "phb24"] },

  // Sorcerer
  { className: "Sorcerer", name: "Draconic Bloodline", sources: CORE },
  { className: "Sorcerer", name: "Wild Magic", sources: ["phb", "phb24"] },
  { className: "Sorcerer", name: "Storm Sorcery", sources: ["scag", "xge"] },
  { className: "Sorcerer", name: "Divine Soul", sources: ["xge"] },
  { className: "Sorcerer", name: "Shadow Magic", sources: ["xge"] },
  { className: "Sorcerer", name: "Aberrant Mind", sources: ["tce", "phb24"] },
  { className: "Sorcerer", name: "Clockwork Soul", sources: ["tce"] },
  { className: "Sorcerer", name: "Lunar Sorcery", sources: ["dsotdq"] },

  // Warlock
  { className: "Warlock", name: "The Fiend", sources: CORE },
  { className: "Warlock", name: "The Archfey", sources: ["phb", "phb24"] },
  { className: "Warlock", name: "The Great Old One", sources: ["phb", "phb24"] },
  { className: "Warlock", name: "The Undying", sources: ["scag"] },
  { className: "Warlock", name: "The Celestial", sources: ["xge", "phb24"] },
  { className: "Warlock", name: "The Hexblade", sources: ["xge"] },
  { className: "Warlock", name: "The Fathomless", sources: ["tce"] },
  { className: "Warlock", name: "The Genie", sources: ["tce"] },
  { className: "Warlock", name: "The Undead", sources: ["vrgr"] },

  // Wizard
  { className: "Wizard", name: "School of Evocation", sources: CORE },
  { className: "Wizard", name: "School of Abjuration", sources: ["phb", "phb24"] },
  { className: "Wizard", name: "School of Conjuration", sources: ["phb"] },
  { className: "Wizard", name: "School of Divination", sources: ["phb", "phb24"] },
  { className: "Wizard", name: "School of Enchantment", sources: ["phb"] },
  { className: "Wizard", name: "School of Illusion", sources: ["phb", "phb24"] },
  { className: "Wizard", name: "School of Necromancy", sources: ["phb"] },
  { className: "Wizard", name: "School of Transmutation", sources: ["phb"] },
  { className: "Wizard", name: "Bladesinging", sources: ["scag", "tce"] },
  { className: "Wizard", name: "War Magic", sources: ["xge"] },
  { className: "Wizard", name: "Chronurgy Magic", sources: ["egw"] },
  { className: "Wizard", name: "Graviturgy Magic", sources: ["egw"] },
  { className: "Wizard", name: "Order of Scribes", sources: ["tce"] },

  // Artificer
  { className: "Artificer", name: "Alchemist", sources: ["erlw", "tce"] },
  { className: "Artificer", name: "Artillerist", sources: ["erlw", "tce"] },
  { className: "Artificer", name: "Battle Smith", sources: ["erlw", "tce"] },
  { className: "Artificer", name: "Armorer", sources: ["tce"] },
];

/* -------------------------------------------------------------------------- */
/*  Races / species                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Flattened to one entry per pickable lineage — `characters.race` is a single
 * column, so subraces sit alongside their parent rather than nesting.
 */
export const RACE_CATALOG: CatalogEntry[] = [
  { name: "Dragonborn", sources: CORE },
  { name: "Dwarf", sources: CORE },
  { name: "Hill Dwarf", sources: ["srd", "phb"] },
  { name: "Mountain Dwarf", sources: ["phb"] },
  { name: "Elf", sources: CORE },
  { name: "High Elf", sources: ["srd", "phb"] },
  { name: "Wood Elf", sources: ["phb"] },
  { name: "Dark Elf (Drow)", sources: ["phb"] },
  { name: "Gnome", sources: CORE },
  { name: "Rock Gnome", sources: ["srd", "phb"] },
  { name: "Forest Gnome", sources: ["phb"] },
  { name: "Half-Elf", sources: ["srd", "phb"] },
  { name: "Half-Orc", sources: ["srd", "phb"] },
  { name: "Halfling", sources: CORE },
  { name: "Lightfoot Halfling", sources: ["srd", "phb"] },
  { name: "Stout Halfling", sources: ["phb"] },
  { name: "Human", sources: CORE },
  { name: "Variant Human", sources: ["phb"] },
  { name: "Tiefling", sources: CORE },
  { name: "Aasimar", sources: ["vgm", "mpmm", "phb24"] },
  { name: "Goliath", sources: ["ee", "vgm", "mpmm", "phb24"] },
  { name: "Orc", sources: ["vgm", "mpmm", "phb24"] },

  { name: "Aarakocra", sources: ["ee", "mpmm"] },
  { name: "Air Genasi", sources: ["ee", "mpmm"] },
  { name: "Earth Genasi", sources: ["ee", "mpmm"] },
  { name: "Fire Genasi", sources: ["ee", "mpmm"] },
  { name: "Water Genasi", sources: ["ee", "mpmm"] },
  { name: "Deep Gnome (Svirfneblin)", sources: ["ee", "scag", "mtf", "mpmm"] },

  { name: "Firbolg", sources: ["vgm", "mpmm"] },
  { name: "Kenku", sources: ["vgm", "mpmm"] },
  { name: "Lizardfolk", sources: ["vgm", "mpmm"] },
  { name: "Tabaxi", sources: ["vgm", "mpmm"] },
  { name: "Triton", sources: ["vgm", "mpmm"] },
  { name: "Bugbear", sources: ["vgm", "mpmm"] },
  { name: "Goblin", sources: ["vgm", "mpmm"] },
  { name: "Hobgoblin", sources: ["vgm", "mpmm"] },
  { name: "Kobold", sources: ["vgm", "mpmm"] },
  { name: "Yuan-ti Pureblood", sources: ["vgm", "mpmm"] },

  { name: "Duergar (Gray Dwarf)", sources: ["mtf", "mpmm"] },
  { name: "Eladrin", sources: ["mtf", "mpmm"] },
  { name: "Sea Elf", sources: ["mtf", "mpmm"] },
  { name: "Shadar-kai", sources: ["mtf", "mpmm"] },
  { name: "Githyanki", sources: ["mtf", "mpmm"] },
  { name: "Githzerai", sources: ["mtf", "mpmm"] },

  { name: "Centaur", sources: ["ggr", "mpmm"] },
  { name: "Loxodon", sources: ["ggr", "mpmm"] },
  { name: "Minotaur", sources: ["ggr", "mpmm"] },
  { name: "Simic Hybrid", sources: ["ggr"] },
  { name: "Vedalken", sources: ["ggr"] },

  { name: "Changeling", sources: ["erlw", "mpmm"] },
  { name: "Kalashtar", sources: ["erlw", "mpmm"] },
  { name: "Shifter", sources: ["erlw", "mpmm"] },
  { name: "Warforged", sources: ["erlw"] },

  { name: "Leonin", sources: ["mot", "mpmm"] },
  { name: "Satyr", sources: ["mot", "mpmm"] },

  { name: "Custom Lineage", sources: ["tce"] },

  { name: "Dhampir", sources: ["vrgr", "mpmm"] },
  { name: "Hexblood", sources: ["vrgr", "mpmm"] },
  { name: "Reborn", sources: ["vrgr", "mpmm"] },

  { name: "Chromatic Dragonborn", sources: ["ftd"] },
  { name: "Metallic Dragonborn", sources: ["ftd"] },
  { name: "Gem Dragonborn", sources: ["ftd"] },

  { name: "Owlin", sources: ["scc"] },

  { name: "Astral Elf", sources: ["sais"] },
  { name: "Autognome", sources: ["sais"] },
  { name: "Giff", sources: ["sais"] },
  { name: "Hadozee", sources: ["sais"] },
  { name: "Plasmoid", sources: ["sais"] },
  { name: "Thri-kreen", sources: ["sais"] },

  { name: "Kender", sources: ["dsotdq"] },
];

/* -------------------------------------------------------------------------- */
/*  Backgrounds                                                                */
/* -------------------------------------------------------------------------- */

export const BACKGROUND_CATALOG: CatalogEntry[] = [
  { name: "Acolyte", sources: ["srd", "phb", "phb24"] },
  { name: "Charlatan", sources: ["phb", "phb24"] },
  { name: "Criminal", sources: ["phb", "phb24"] },
  { name: "Entertainer", sources: ["phb", "phb24"] },
  { name: "Folk Hero", sources: ["phb"] },
  { name: "Guild Artisan", sources: ["phb"] },
  { name: "Hermit", sources: ["phb", "phb24"] },
  { name: "Noble", sources: ["phb", "phb24"] },
  { name: "Outlander", sources: ["phb"] },
  { name: "Sage", sources: ["phb", "phb24"] },
  { name: "Sailor", sources: ["phb", "phb24"] },
  { name: "Soldier", sources: ["phb", "phb24"] },
  { name: "Urchin", sources: ["phb"] },
  { name: "Gladiator", sources: ["phb"] },
  { name: "Knight", sources: ["phb"] },
  { name: "Pirate", sources: ["phb"] },
  { name: "Spy", sources: ["phb"] },

  { name: "Artisan", sources: ["phb24"] },
  { name: "Farmer", sources: ["phb24"] },
  { name: "Guard", sources: ["phb24"] },
  { name: "Guide", sources: ["phb24"] },
  { name: "Merchant", sources: ["phb24"] },
  { name: "Scribe", sources: ["phb24"] },
  { name: "Wayfarer", sources: ["phb24"] },

  { name: "City Watch", sources: ["scag"] },
  { name: "Clan Crafter", sources: ["scag"] },
  { name: "Cloistered Scholar", sources: ["scag"] },
  { name: "Courtier", sources: ["scag"] },
  { name: "Faction Agent", sources: ["scag"] },
  { name: "Far Traveler", sources: ["scag"] },
  { name: "Inheritor", sources: ["scag"] },
  { name: "Knight of the Order", sources: ["scag"] },
  { name: "Mercenary Veteran", sources: ["scag"] },
  { name: "Urban Bounty Hunter", sources: ["scag"] },
  { name: "Uthgardt Tribe Member", sources: ["scag"] },
  { name: "Waterdhavian Noble", sources: ["scag"] },

  { name: "Anthropologist", sources: ["toa"] },
  { name: "Archaeologist", sources: ["toa"] },
  { name: "Haunted One", sources: ["cos", "vrgr"] },
  { name: "Investigator", sources: ["vrgr"] },
  { name: "Faceless", sources: ["bgdia"] },
  { name: "Fisher", sources: ["gos"] },
  { name: "Marine", sources: ["gos"] },
  { name: "Shipwright", sources: ["gos"] },
  { name: "Smuggler", sources: ["gos"] },

  { name: "Celebrity Adventurer's Scion", sources: ["ai"] },
  { name: "Failed Merchant", sources: ["ai"] },
  { name: "Gambler", sources: ["ai"] },
  { name: "Rival Intern", sources: ["ai"] },

  { name: "House Agent", sources: ["erlw"] },
  { name: "Grinner", sources: ["egw"] },
  { name: "Volstrucker Agent", sources: ["egw"] },
  { name: "Athlete", sources: ["mot"] },

  { name: "Azorius Functionary", sources: ["ggr"] },
  { name: "Boros Legionnaire", sources: ["ggr"] },
  { name: "Dimir Operative", sources: ["ggr"] },
  { name: "Golgari Agent", sources: ["ggr"] },
  { name: "Gruul Anarch", sources: ["ggr"] },
  { name: "Izzet Engineer", sources: ["ggr"] },
  { name: "Orzhov Representative", sources: ["ggr"] },
  { name: "Rakdos Cultist", sources: ["ggr"] },
  { name: "Selesnya Initiate", sources: ["ggr"] },
  { name: "Simic Scientist", sources: ["ggr"] },

  { name: "Student of Lorehold", sources: ["scc"] },
  { name: "Student of Prismari", sources: ["scc"] },
  { name: "Student of Quandrix", sources: ["scc"] },
  { name: "Student of Silverquill", sources: ["scc"] },
  { name: "Student of Witherbloom", sources: ["scc"] },

  { name: "Astral Drifter", sources: ["sais"] },
  { name: "Wildspacer", sources: ["sais"] },
  { name: "Knight of Solamnia", sources: ["dsotdq"] },
  { name: "Mage of High Sorcery", sources: ["dsotdq"] },
];

/* -------------------------------------------------------------------------- */
/*  Lookups                                                                    */
/* -------------------------------------------------------------------------- */

function allowed(entry: CatalogEntry, rulebooks: string[]): boolean {
  return entry.sources.some((s) => rulebooks.includes(s));
}

/**
 * Rulebooks reaching here come from a json database column and from imported
 * bundles, so a row written by an older build can hold something that is not an
 * array. Treat anything unusable as "no books ticked" — the pickers then offer
 * everything, which is the same graceful behaviour as a fresh campaign.
 */
function bookList(rulebooks: string[]): string[] {
  return Array.isArray(rulebooks) ? rulebooks.filter((b) => typeof b === "string") : [];
}

/**
 * Names from `catalog` that the campaign's rulebooks allow, in catalog order.
 * An empty (or all-homebrew) selection filters nothing — a campaign that has
 * never opened settings must still see every option.
 */
export function optionsFor(catalog: CatalogEntry[], rulebooks: string[]): string[] {
  const books = bookList(rulebooks);
  const filtering = books.some((b) => SOURCE_BOOKS.some((s) => s.key === b));
  const entries = filtering ? catalog.filter((e) => allowed(e, books)) : catalog;
  return [...new Set(entries.map((e) => e.name))];
}

/**
 * Append values already in use elsewhere in the campaign that no ticked book
 * offers — homebrew typed on one character then reusable on the next.
 */
export function withCampaignValues(
  options: { value: string; group?: string }[],
  used: string[],
): { value: string; group?: string }[] {
  const known = new Set(options.map((o) => o.value.toLowerCase()));
  const extra = [...new Set(used.map((u) => u.trim()).filter(Boolean))]
    .filter((u) => !known.has(u.toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, group: "Used in this campaign" }));
  return extra.length ? [...options, ...extra] : options;
}

/**
 * Subclasses for `className`, narrowed by rulebook. An unrecognised or empty
 * class (homebrew, or nothing picked yet) yields every allowed subclass so the
 * field is never dead — the caller groups those by class.
 */
export function subclassOptions(
  className: string,
  rulebooks: string[],
): { value: string; group?: string }[] {
  const books = bookList(rulebooks);
  const filtering = books.some((b) => SOURCE_BOOKS.some((s) => s.key === b));
  const pool = filtering
    ? SUBCLASS_CATALOG.filter((e) => allowed(e, books))
    : SUBCLASS_CATALOG;

  const key = className?.trim().toLowerCase() ?? "";
  const matches = key ? pool.filter((e) => e.className.toLowerCase() === key) : [];
  if (matches.length > 0) return matches.map((e) => ({ value: e.name }));
  return pool.map((e) => ({ value: e.name, group: e.className }));
}
