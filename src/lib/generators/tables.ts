/**
 * Content tables for the generators. All text is original to Sanctum; magic
 * item names in the treasure tables are SRD 5.1 items (CC-BY-4.0), which the
 * app already ships with.
 */

/* ---------------------------------- NPCs ---------------------------------- */

export const ANCESTRIES = [
  { name: "Human", style: "common", weight: 6 },
  { name: "Human", style: "northern", weight: 2 },
  { name: "Human", style: "southern", weight: 2 },
  { name: "Elf", style: "elvish", weight: 2 },
  { name: "Half-Elf", style: "elvish", weight: 2 },
  { name: "Dwarf", style: "dwarvish", weight: 2 },
  { name: "Halfling", style: "halfling", weight: 2 },
  { name: "Gnome", style: "halfling", weight: 1 },
  { name: "Half-Orc", style: "orcish", weight: 1 },
  { name: "Orc", style: "orcish", weight: 1 },
  { name: "Tiefling", style: "southern", weight: 1 },
  { name: "Dragonborn", style: "northern", weight: 1 },
] as const;

export const PRONOUNS = ["she/her", "he/him", "they/them"] as const;

export const OCCUPATIONS = [
  "Blacksmith", "Innkeeper", "Hedge mage", "Caravan guard", "Fence", "Fishmonger", "Scribe",
  "Herbalist", "Tax collector", "Sellsword", "Street urchin", "Temple acolyte", "Stablehand",
  "Merchant", "Locksmith", "Tavern bard", "Ratcatcher", "Cartographer", "Apothecary", "Town crier",
  "Gravedigger", "Dockworker", "Falconer", "Wandering peddler", "Cobbler", "Midwife", "Bookbinder",
  "Retired soldier", "Lamplighter", "Smuggler", "Beekeeper", "Ferryman", "Watch sergeant", "Chandler",
];

export const TRAITS = [
  "Speaks far too quickly when nervous", "Repeats the last word you said back to you",
  "Always trying to sell you something", "Suspicious of anyone who smiles too much",
  "Quotes a grandparent's proverbs constantly", "Counts coins out loud, twice",
  "Names every object they own", "Pretends to know more than they do",
  "Cannot let a silence go unfilled", "Treats their pet like a person",
  "Endlessly polite, even when insulting you", "Brags about a heroic deed that never happened",
  "Laughs at their own jokes before the punchline", "Keeps meticulous lists of everything",
  "Hums an old tune under their breath", "Never quite meets your eyes",
  "Gestures wildly with both hands", "Speaks in a near-whisper",
  "Takes every promise absolutely literally", "Asks a question for every answer they give",
];

export const IDEALS = [
  "Freedom is worth any price.", "Knowledge should be hoarded, not shared.",
  "The strong protect the weak — or should.", "Coin is the only honest language.",
  "Tradition keeps the world from falling apart.", "Everyone deserves a second chance.",
  "Power is the only thing that lasts.", "Beauty is worth suffering for.",
  "A debt is sacred, whichever way it runs.", "The town comes before any one person.",
  "Nobody should go hungry while I have bread.", "Rules exist to be read very carefully.",
];

export const BONDS = [
  "Owes a life-debt to a stranger they can't find.", "Is secretly supporting a struggling sibling.",
  "Would burn the town down to protect one friend.", "Guards a family heirloom they'll never sell.",
  "Is searching for a mentor who vanished years ago.", "Swore an oath to a temple they no longer believe in.",
  "Is raising an orphan as their own.", "Still writes letters to a lover lost at sea.",
  "Keeps a promise made to a dying soldier.", "Is loyal to the guild that took them in off the street.",
];

export const FLAWS = [
  "Cannot resist a wager.", "Holds grudges for decades.", "Drinks to forget a face they can't name.",
  "Trusts the wrong people, every time.", "Lies reflexively, even when the truth is easier.",
  "Is terrified of deep water.", "Covets what others have.", "Takes credit for other people's work.",
  "Panics when anyone raises their voice.", "Can be bought, but never stays bought.",
];

export const APPEARANCES = [
  "A jagged scar across one brow", "Mismatched eyes, one green, one grey", "Ink-stained fingers",
  "A missing front tooth and a wide grin", "Elaborate, fraying finery a decade out of fashion",
  "A fresh bruise they won't explain", "Calloused hands and sun-worn skin",
  "A single gold earring shaped like a fish", "Hair dyed an improbable shade of violet",
  "A limp and a finely carved cane", "Spectacles mended with twine", "A tattoo of a compass on one wrist",
  "Freckles everywhere, and flour on everything", "An immaculate coat and muddy boots",
  "A voice much deeper than you'd expect", "Burn scars along both forearms",
];

export const SECRETS = [
  "Is paying off a blackmailer with stolen money.", "Was once a member of the cult now plaguing the region.",
  "Is the illegitimate heir of a minor noble house.", "Poisoned their former business partner.",
  "Has been passing information to a rival town.", "Can't actually read, and hides it well.",
  "Is a deserter from a famous army.", "Keeps a dangerous creature hidden in the cellar.",
  "Knows where a missing child is — and is afraid to say.", "Isn't who they claim; the real one died years ago.",
  "Has a second family in the next town over.", "Hears a voice in dreams that tells true things.",
];

export const NPC_HOOKS = [
  "Needs someone to deliver a sealed letter, no questions asked.",
  "Is being followed and wants to know by whom.",
  "Lost something valuable in the old ruins north of town.",
  "Will pay well for proof that a rival is cheating.",
  "Has a map they can't read and a hunch it matters.",
  "Wants an escort to a funeral nobody else will attend.",
  "Overheard something they wish they hadn't.",
  "Needs a rare ingredient before the next full moon.",
  "Is being squeezed by a local gang and can't go to the watch.",
  "Is looking for a missing relative last seen with adventurers.",
];

/** SRD humanoid stat blocks a generated NPC can borrow, by name (see srd-monsters.ts). */
export const NPC_STAT_BLOCKS = [
  "Commoner", "Guard", "Bandit", "Acolyte", "Scout", "Thug", "Spy", "Cultist",
  "Bandit Captain", "Veteran", "Priest", "Mage", "Knight", "Druid",
] as const;

/* -------------------------------- Taverns -------------------------------- */

export const TAVERN_VIBES = [
  "Smoky and loud, with a dice game in every corner",
  "Cosy and quiet; regulars nod but don't talk",
  "Rowdy dockside dive that smells of tar and fish",
  "Genteel, overpriced, and full of people pretending to be nobles",
  "Half-empty; the owner is clearly in trouble",
  "Busy waystation full of travellers and rumours",
  "A converted chapel, stained glass and all",
  "Built into a hillside; low ceilings, warm hearth",
  "Floating barge-tavern moored on the river",
  "Ex-soldiers' haunt with trophies on every wall",
];

export const TAVERN_DRINKS = [
  "Black-cherry stout served warm", "Pine-needle gin that tastes of winter",
  "Honey mead brewed by the owner's grandmother", "A cider so dry it squeaks",
  "Smoked ale with a pinch of salt", "Spiced wine with a cinnamon stick",
  "Thick barley beer, 'a meal in a mug'", "A violently green liqueur nobody can name",
];

export const TAVERN_DISHES = [
  "Mutton stew with dark bread", "Eel pie, better than it sounds", "Roast fowl with river-cress",
  "Lentil and onion pottage", "Fried river trout with lemon", "Mushroom pasties, still hot",
  "Venison sausages and mustard", "Turnip mash and bacon",
];

export const PATRONS = [
  "A nervous scholar nursing one drink all night",
  "A pair of off-duty guards arguing about a missing shipment",
  "A one-eyed sailor who will tell any story for a drink",
  "A hooded figure who tips in foreign coin",
  "A minstrel with a broken lute string and a grudge",
  "An old adventurer who insists the dungeon nearby isn't empty",
  "A merchant loudly celebrating a deal that went too well",
  "A child selling flowers who hears everything",
];

/* ------------------------------ Settlements ------------------------------ */

export const SETTLEMENT_SIZES = [
  { label: "Thorp", population: "under 20", type: "village", weight: 1 },
  { label: "Hamlet", population: "about 60", type: "village", weight: 2 },
  { label: "Village", population: "about 300", type: "village", weight: 3 },
  { label: "Small town", population: "about 1,200", type: "town", weight: 3 },
  { label: "Large town", population: "about 4,000", type: "town", weight: 2 },
  { label: "City", population: "about 15,000", type: "city", weight: 1 },
] as const;

export const SETTLEMENT_FEATURES = [
  "A huge, ancient tree grows through the town square",
  "Every roof is painted a different colour",
  "Built on stilts over a slow brown river",
  "Ringed by a wall far too big for it, relic of better days",
  "Home to a famous (and noisy) bell tower",
  "A ruined wizard's tower looms on the hill above",
  "Hot springs bubble up in the middle of town",
  "The streets spiral inward to a sealed vault",
  "Every household keeps bees",
  "A colossal statue of a forgotten hero, missing its head",
  "Carved into a cliff face, reached by rope lifts",
  "The market is held at night, by lantern-light",
];

export const SETTLEMENT_PROBLEMS = [
  "Livestock are vanishing, and the tracks lead nowhere",
  "The well water has started to taste of copper",
  "A feud between two founding families is turning violent",
  "Bandits have closed the only trade road",
  "The harvest failed and the granary keeper is hoarding",
  "Children report a friendly voice from the old mine",
  "A plague of sleepwalking has struck the town",
  "The local lord has doubled taxes with no explanation",
  "A sinkhole opened in the square, revealing old stonework",
  "Strangers have bought up half the houses this season",
];

export const SETTLEMENT_POWERS = [
  "A council of elders who agree on nothing",
  "The temple's high priest, quietly running everything",
  "A merchant guild that owns most of the buildings",
  "An absentee lord represented by a cruel steward",
  "A retired adventurer the townsfolk elected as mayor",
  "A thieves' guild everyone pretends doesn't exist",
  "A druid circle the farmers both fear and rely on",
  "The captain of the watch, who answers to nobody",
];

/* -------------------------------- Hooks ---------------------------------- */

export const QUEST_PATRONS = [
  "A desperate farmer", "A widowed noble", "The local temple", "A guild master",
  "A frightened child", "A retired adventurer", "The town council", "A travelling scholar",
  "A mysterious stranger", "A rival adventuring party", "A dying knight", "A dragon's envoy",
];

export const QUEST_TASKS = [
  "recover a stolen relic", "escort a caravan through hostile land", "find a missing person",
  "clear out a nest of monsters", "deliver a message before it's too late", "investigate a string of murders",
  "break a curse on a family", "steal back a deed from a crooked lord", "map an unexplored ruin",
  "negotiate peace between two feuding villages", "hunt a beast that walks like a man",
  "retrieve a rare herb from a haunted marsh",
];

export const QUEST_PLACES = [
  "in a flooded crypt", "beneath the old mill", "across the haunted moor", "in a sunken temple",
  "at the edge of the Wildwood", "inside a collapsed dwarven hall", "on a fog-bound island",
  "in the city's sewers", "at a ruined watchtower", "deep in an abandoned mine",
];

export const QUEST_TWISTS = [
  "the patron is lying about why", "a rival group wants the same thing", "the target doesn't want to be found",
  "the monster is protecting something", "it's a trap set for the patron", "the relic is cursed",
  "the 'villain' is in the right", "there's a deadline nobody mentioned", "the reward doesn't exist",
  "someone in the party is recognised",
];

export const QUEST_REWARDS = [
  "100 gp and a favour owed", "A minor magic item", "Land and a modest title", "A treasure map",
  "Free lodging for life at the local inn", "A guild membership", "Information the party desperately needs",
  "A share of whatever is recovered", "A letter of marque", "An heirloom weapon",
];

/* -------------------------------- Rumors --------------------------------- */

export const RUMOR_SUBJECTS = [
  "the miller", "the new priest", "the baron's daughter", "the old ruins", "the caravan master",
  "the blacksmith's apprentice", "the inn's cellar", "the lighthouse keeper", "the witch in the woods",
  "the watch captain", "the travelling circus", "the abandoned manor",
];

export const RUMOR_CLAIMS = [
  "has been seen talking to wolves at midnight", "is hiding a fortune in old coins",
  "isn't human — not entirely", "owes money to very dangerous people", "is haunted by a weeping ghost",
  "opened a door that should have stayed shut", "is planning to leave town for good",
  "has a secret tunnel to the river", "was replaced by a double last winter", "found something in the hills",
  "is selling forged maps", "is the one behind the recent thefts",
];

export const RUMOR_SOURCES = [
  "Overheard at the tavern", "A drunk sailor", "The town gossip", "A frightened child",
  "A traveling merchant", "A guard on the night watch", "Graffiti on a wall", "A letter found in the street",
];

export const RUMOR_TRUTHS = ["True", "False", "Partly true", "True, but misunderstood"] as const;

/* -------------------------------- Weather -------------------------------- */

export const CLIMATES = ["temperate", "cold", "arid", "tropical"] as const;
export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

export const SKIES: Record<(typeof CLIMATES)[number], string[]> = {
  temperate: ["Clear and bright", "Patchy cloud", "Overcast and grey", "Light drizzle", "Steady rain", "Thunderstorm", "Thick morning fog"],
  cold: ["Crisp and clear", "Low grey cloud", "Light snow", "Heavy snowfall", "Blizzard", "Freezing fog", "Sleet"],
  arid: ["Cloudless, blinding sun", "Hazy heat", "High thin cloud", "Dust storm", "Rare, sudden downpour", "Still and oppressive"],
  tropical: ["Hot and humid", "Afternoon downpour", "Steaming mist", "Towering storm clouds", "Torrential rain", "Brief, bright sun"],
};

export const TEMPS: Record<(typeof SEASONS)[number], string[]> = {
  spring: ["Cool", "Mild", "Pleasantly warm"],
  summer: ["Warm", "Hot", "Sweltering"],
  autumn: ["Mild", "Cool", "Chilly"],
  winter: ["Cold", "Bitter", "Freezing"],
};

export const WINDS = ["Still air", "A light breeze", "Gusty", "Strong, steady wind", "Howling gale"];

export const WEATHER_EFFECTS: Record<string, string> = {
  fog: "Lightly obscured beyond 30 ft.; heavily obscured beyond 60 ft.",
  storm: "Disadvantage on Perception checks relying on hearing; open flames gutter.",
  snow: "Difficult terrain in deep drifts; tracks easy to follow.",
  blizzard: "Heavily obscured; exposure risks exhaustion without shelter.",
  rain: "Lightly obscured; disadvantage on Perception checks relying on sight.",
  dust: "Heavily obscured; creatures without eye protection are blinded in the open.",
  heat: "Travellers without water risk exhaustion (CON save each hour).",
  gale: "Ranged weapon attacks have disadvantage; flying is hard going.",
  none: "No mechanical effect.",
};

/* -------------------------------- Treasure ------------------------------- */

export const TREASURE_TIERS = ["1-4", "5-10", "11-16", "17-20"] as const;
export type TreasureTier = (typeof TREASURE_TIERS)[number];

export const COINS: Record<TreasureTier, Record<"cp" | "sp" | "gp" | "pp", [number, number]>> = {
  "1-4": { cp: [20, 180], sp: [10, 120], gp: [5, 60], pp: [0, 0] },
  "5-10": { cp: [0, 0], sp: [40, 240], gp: [40, 400], pp: [0, 20] },
  "11-16": { cp: [0, 0], sp: [0, 0], gp: [200, 2000], pp: [10, 120] },
  "17-20": { cp: [0, 0], sp: [0, 0], gp: [1000, 8000], pp: [50, 500] },
};

export const VALUABLES: Record<TreasureTier, string[]> = {
  "1-4": ["a polished agate (10 gp)", "a carved bone trinket (15 gp)", "a small silver locket (25 gp)", "a length of fine lace (10 gp)", "an engraved copper bracelet (20 gp)"],
  "5-10": ["a smooth jade figurine (50 gp)", "a string of river pearls (75 gp)", "a gold-trimmed goblet (60 gp)", "a small ruby (100 gp)", "an ivory comb inlaid with silver (80 gp)"],
  "11-16": ["a flawless sapphire (500 gp)", "a jewelled ceremonial dagger (750 gp)", "a painting by a renowned master (250 gp)", "a platinum signet ring (300 gp)", "a crown of beaten gold (1,000 gp)"],
  "17-20": ["a fist-sized diamond (5,000 gp)", "an emerald the colour of deep forest (2,500 gp)", "an ancient golden idol (3,000 gp)", "a circlet set with seven black opals (4,000 gp)"],
};

/** SRD 5.1 magic items by tier, with their rarity for shop stock. */
export const MAGIC_ITEMS: Record<TreasureTier, { name: string; rarity: string; type: string }[]> = {
  "1-4": [
    { name: "Potion of Healing", rarity: "common", type: "potion" },
    { name: "Spell Scroll (1st level)", rarity: "common", type: "scroll" },
    { name: "Potion of Climbing", rarity: "common", type: "potion" },
    { name: "Decanter of Endless Water", rarity: "uncommon", type: "wondrous" },
    { name: "Bag of Holding", rarity: "uncommon", type: "wondrous" },
    { name: "Goggles of Night", rarity: "uncommon", type: "wondrous" },
  ],
  "5-10": [
    { name: "Potion of Greater Healing", rarity: "uncommon", type: "potion" },
    { name: "+1 Weapon", rarity: "uncommon", type: "weapon" },
    { name: "Cloak of Protection", rarity: "uncommon", type: "wondrous" },
    { name: "Boots of Elvenkind", rarity: "uncommon", type: "wondrous" },
    { name: "Wand of Magic Missiles", rarity: "uncommon", type: "wand" },
    { name: "Ring of Jumping", rarity: "uncommon", type: "ring" },
  ],
  "11-16": [
    { name: "Potion of Superior Healing", rarity: "rare", type: "potion" },
    { name: "+2 Weapon", rarity: "rare", type: "weapon" },
    { name: "Ring of Protection", rarity: "rare", type: "ring" },
    { name: "Cloak of Displacement", rarity: "rare", type: "wondrous" },
    { name: "Flame Tongue", rarity: "rare", type: "weapon" },
    { name: "Amulet of Health", rarity: "rare", type: "wondrous" },
  ],
  "17-20": [
    { name: "Potion of Supreme Healing", rarity: "very rare", type: "potion" },
    { name: "+3 Weapon", rarity: "very rare", type: "weapon" },
    { name: "Ring of Invisibility", rarity: "legendary", type: "ring" },
    { name: "Belt of Giant Strength (Frost)", rarity: "very rare", type: "wondrous" },
    { name: "Ring of Spell Storing", rarity: "rare", type: "ring" },
    { name: "Staff of Power", rarity: "very rare", type: "staff" },
  ],
};

/** Which campaign magic-item rarities fit each tier, for mixing in homebrew. */
export const TIER_RARITIES: Record<TreasureTier, string[]> = {
  "1-4": ["common", "uncommon"],
  "5-10": ["uncommon", "rare"],
  "11-16": ["rare", "very rare"],
  "17-20": ["very rare", "legendary", "artifact"],
};
