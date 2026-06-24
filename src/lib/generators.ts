/**
 * Lightweight random generators for improvising at the table — NPCs and
 * treasure. All content is original/generic (no proprietary tables), so it's
 * safe to bundle and fast to riff on.
 */

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function roll(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* -------------------------------------------------------------------------- */
/*  NPC generator                                                             */
/* -------------------------------------------------------------------------- */

const FIRST_NAMES = [
  "Aldric", "Bryn", "Cael", "Dara", "Edmun", "Fenwick", "Gilda", "Halvard",
  "Isolde", "Joss", "Katriel", "Lonan", "Mirela", "Nessa", "Orin", "Perrin",
  "Quenby", "Rowan", "Sable", "Tamsin", "Ulric", "Veyra", "Wystan", "Yorath",
  "Zara", "Bram", "Cordelia", "Dorian", "Elira", "Faelan", "Greta", "Hadrian",
  "Imara", "Kestrel", "Lucan", "Maeve", "Niall", "Odette", "Phelan", "Reyna",
];

const SURNAMES = [
  "Blackwood", "Stonefield", "Harrow", "Ashdown", "Vance", "Thornbury",
  "Crane", "Holloway", "Marsh", "Quill", "Ravenscroft", "Underhill",
  "Wexley", "Brightwater", "Coldwell", "Dunmore", "Fairwind", "Grimsby",
  "Hartley", "Ironwood", "Larkspur", "Mossgrove", "Nightingale", "Oakhart",
  "Pendry", "Redfern", "Salt", "Tallow", "Wren", "Yarrow",
];

const RACES = [
  "Human", "Half-Elf", "Elf", "Dwarf", "Halfling", "Gnome", "Tiefling",
  "Half-Orc", "Dragonborn", "Human", "Human", "Half-Elf",
];

const OCCUPATIONS = [
  "Blacksmith", "Innkeeper", "Hedge mage", "Caravan guard", "Fence",
  "Fishmonger", "Scribe", "Herbalist", "Tax collector", "Sellsword",
  "Street urchin", "Temple acolyte", "Stablehand", "Merchant", "Locksmith",
  "Tavern bard", "Ratcatcher", "Cartographer", "Apothecary", "Town crier",
  "Gravedigger", "Dockworker", "Falconer", "Wandering peddler", "Cobbler",
];

const TRAITS = [
  "Speaks far too quickly when nervous",
  "Repeats the last word you said back to you",
  "Always trying to sell you something",
  "Suspicious of anyone who smiles too much",
  "Quotes a grandparent's proverbs constantly",
  "Counts coins out loud, twice",
  "Names every object they own",
  "Pretends to know more than they do",
  "Cannot let a silence go unfilled",
  "Treats their pet like a person",
  "Endlessly polite, even when insulting you",
  "Brags about a heroic deed that never happened",
];

const MANNERISMS = [
  "taps a ring against the table when thinking",
  "has a booming, infectious laugh",
  "never quite meets your eyes",
  "chews on a sprig of mint",
  "cracks their knuckles before speaking",
  "hums an old tune under their breath",
  "gestures wildly with both hands",
  "speaks in a near-whisper",
  "constantly adjusts their hat",
  "punctuates sentences with a sharp sniff",
];

const APPEARANCES = [
  "a jagged scar across one brow",
  "mismatched eyes, one green, one grey",
  "ink-stained fingers",
  "a missing front tooth and a wide grin",
  "elaborate, fraying finery a decade out of fashion",
  "a fresh bruise they won't explain",
  "calloused hands and sun-worn skin",
  "a single gold earring shaped like a fish",
  "hair dyed an improbable shade of violet",
  "a limp and a finely carved cane",
];

const IDEALS = [
  "Freedom is worth any price.",
  "Knowledge should be hoarded, not shared.",
  "The strong protect the weak — or should.",
  "Coin is the only honest language.",
  "Tradition keeps the world from falling apart.",
  "Everyone deserves a second chance.",
  "Power is the only thing that lasts.",
  "Beauty is worth suffering for.",
];

const BONDS = [
  "owes a life-debt to a stranger they can't find",
  "is secretly supporting a struggling sibling",
  "would burn the town down to protect one friend",
  "guards a family heirloom they'll never sell",
  "is searching for a mentor who vanished years ago",
  "swore an oath to a temple they no longer believe in",
  "is raising an orphan as their own",
];

const FLAWS = [
  "cannot resist a wager",
  "holds grudges for decades",
  "drinks to forget a face they can't name",
  "trusts the wrong people, every time",
  "will lie reflexively, even when the truth is easier",
  "is terrified of deep water",
  "covets what others have",
];

export type GeneratedNpc = {
  name: string;
  race: string;
  occupation: string;
  appearance: string;
  trait: string;
  mannerism: string;
  ideal: string;
  bond: string;
  flaw: string;
};

export function generateNpc(): GeneratedNpc {
  return {
    name: `${pick(FIRST_NAMES)} ${pick(SURNAMES)}`,
    race: pick(RACES),
    occupation: pick(OCCUPATIONS),
    appearance: pick(APPEARANCES),
    trait: pick(TRAITS),
    mannerism: pick(MANNERISMS),
    ideal: pick(IDEALS),
    bond: pick(BONDS),
    flaw: pick(FLAWS),
  };
}

/** A tidy multi-line summary, handy for an NPC's notes field. */
export function npcToNotes(n: GeneratedNpc): string {
  return [
    `Appearance: ${n.appearance}.`,
    `Trait: ${n.trait}.`,
    `Mannerism: ${n.mannerism}.`,
    `Ideal: ${n.ideal}`,
    `Bond: ${n.bond}.`,
    `Flaw: ${n.flaw}.`,
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/*  Treasure generator                                                        */
/* -------------------------------------------------------------------------- */

export const TREASURE_TIERS = [
  { key: "1-4", label: "Tier 1 (CR 0–4)" },
  { key: "5-10", label: "Tier 2 (CR 5–10)" },
  { key: "11-16", label: "Tier 3 (CR 11–16)" },
  { key: "17-20", label: "Tier 4 (CR 17–20)" },
] as const;

export type TreasureTier = (typeof TREASURE_TIERS)[number]["key"];

type CoinRanges = {
  cp: [number, number];
  sp: [number, number];
  gp: [number, number];
  pp: [number, number];
};

const COINS: Record<TreasureTier, CoinRanges> = {
  "1-4": { cp: [20, 180], sp: [10, 120], gp: [5, 60], pp: [0, 0] },
  "5-10": { cp: [0, 0], sp: [40, 240], gp: [40, 400], pp: [0, 20] },
  "11-16": { cp: [0, 0], sp: [0, 0], gp: [200, 2000], pp: [10, 120] },
  "17-20": { cp: [0, 0], sp: [0, 0], gp: [1000, 8000], pp: [50, 500] },
};

const VALUABLES: Record<TreasureTier, string[]> = {
  "1-4": [
    "a polished agate (10 gp)", "a carved bone trinket (15 gp)",
    "a small silver locket (25 gp)", "a length of fine lace (10 gp)",
    "an engraved copper bracelet (20 gp)",
  ],
  "5-10": [
    "a smooth jade figurine (50 gp)", "a string of river pearls (75 gp)",
    "a gold-trimmed goblet (60 gp)", "a small ruby (100 gp)",
    "an ivory comb inlaid with silver (80 gp)",
  ],
  "11-16": [
    "a flawless sapphire (500 gp)", "a jewelled ceremonial dagger (750 gp)",
    "a painting by a renowned master (250 gp)", "a platinum signet ring (300 gp)",
    "a crown of beaten gold (1,000 gp)",
  ],
  "17-20": [
    "a fist-sized diamond (5,000 gp)", "an emerald the colour of deep forest (2,500 gp)",
    "an ancient golden idol (3,000 gp)", "a circlet set with seven black opals (4,000 gp)",
  ],
};

const ITEMS: Record<TreasureTier, string[]> = {
  "1-4": [
    "Potion of Healing", "a +1 dagger", "Scroll of a 1st-level spell",
    "Oil of Slipperiness", "Bag of 10 caltrops (silvered)",
  ],
  "5-10": [
    "Potion of Greater Healing", "a +1 weapon of the wielder's choice",
    "Cloak of Protection", "Bag of Holding", "Boots of Elvenkind",
    "Wand of Magic Missiles",
  ],
  "11-16": [
    "Potion of Superior Healing", "a +2 weapon", "Ring of Protection",
    "Cloak of Displacement", "Flame Tongue", "Amulet of Health",
  ],
  "17-20": [
    "Potion of Supreme Healing", "a +3 weapon", "Staff of Power (depleted)",
    "Cloak of Invisibility", "Belt of Giant Strength", "Ring of Spell Storing",
  ],
};

export type GeneratedTreasure = {
  coins: { cp: number; sp: number; gp: number; pp: number };
  valuables: string[];
  items: string[];
};

export function generateTreasure(tier: TreasureTier): GeneratedTreasure {
  const c = COINS[tier];
  const coins = {
    cp: c.cp[1] ? roll(...c.cp) : 0,
    sp: c.sp[1] ? roll(...c.sp) : 0,
    gp: c.gp[1] ? roll(...c.gp) : 0,
    pp: c.pp[1] ? roll(...c.pp) : 0,
  };

  const valuables: string[] = [];
  if (Math.random() < 0.6) {
    const n = roll(1, tier === "17-20" ? 3 : 2);
    for (let i = 0; i < n; i++) valuables.push(pick(VALUABLES[tier]));
  }

  const items: string[] = [];
  const itemChance = tier === "1-4" ? 0.3 : tier === "5-10" ? 0.5 : 0.75;
  if (Math.random() < itemChance) {
    items.push(pick(ITEMS[tier]));
    if (Math.random() < 0.3) items.push(pick(ITEMS[tier]));
  }

  return { coins, valuables, items };
}
