/**
 * Name building blocks. Everything here is original to Sanctum: person names
 * are assembled from syllable tables per style rather than drawn from any
 * published list, and place/business names from generic English word parts.
 */
import type { Rng } from "@/lib/generators/rng";

export const NAME_STYLES = ["common", "elvish", "dwarvish", "halfling", "orcish", "northern", "southern"] as const;
export type NameStyle = (typeof NAME_STYLES)[number];

export const NAME_KINDS = ["person", "tavern", "settlement", "shop", "deity"] as const;
export type NameKind = (typeof NAME_KINDS)[number];

type Syllables = { start: string[]; mid: string[]; end: string[]; family?: [string[], string[]] };

const STYLES: Record<NameStyle, Syllables> = {
  common: {
    start: ["Al", "Bran", "Cor", "Da", "Ed", "Fen", "Gil", "Hal", "Is", "Jor", "Kat", "Lo", "Mer", "Nes", "Or", "Per", "Ro", "Sa", "Tam", "Wil", "Ber", "Mar", "El", "Ty"],
    mid: ["", "", "", "a", "e", "i", "o", "ri", "le", "wy", "na"],
    end: ["ric", "wen", "a", "an", "en", "da", "ton", "ley", "ra", "win", "mund", "sie", "ett", "el", "ard", "ine", "is", "ock"],
    family: [
      ["Black", "Stone", "Ash", "Thorn", "Hollow", "Marsh", "Quill", "Raven", "Under", "Bright", "Cold", "Fair", "Iron", "Lark", "Moss", "Oak", "Red", "Salt", "Tallow", "Wren", "Copper", "Hearth", "Mill", "Brook"],
      ["wood", "field", "row", "down", "bury", "well", "more", "wind", "ford", "hart", "grove", "gate", "hill", "water", "smith", "cott", "wick", "son", "worth", "lane"],
    ],
  },
  elvish: {
    start: ["Ae", "Ael", "Cael", "Ela", "Fae", "Ith", "Lae", "Mi", "Nae", "Sil", "Tha", "Vae", "Yla", "Ari", "Eri", "Lue", "Syl", "Ora"],
    mid: ["", "la", "ri", "the", "va", "nae", "li", "e", "ia"],
    end: ["drel", "wyn", "thas", "riel", "lith", "ndra", "nor", "sae", "vel", "lia", "andil", "ion", "elle", "orin", "ael", "is"],
    family: [
      ["Moon", "Star", "Silver", "Dawn", "Leaf", "Mist", "Song", "Wind", "Glimmer", "Night", "Bright", "Willow"],
      ["whisper", "bloom", "shade", "brook", "petal", "weaver", "runner", "gleam", "song", "frond", "veil"],
    ],
  },
  dwarvish: {
    start: ["Bal", "Bor", "Dur", "Gor", "Grim", "Har", "Kil", "Mor", "Nor", "Thor", "Ulf", "Bru", "Dag", "Hel", "Kat", "Rur", "Tor", "Vis"],
    mid: ["", "", "a", "i", "u", "ga", "ra"],
    end: ["din", "rin", "gar", "grim", "dek", "mund", "nar", "drun", "rik", "li", "da", "hild", "dis", "ra", "bek"],
    family: [
      ["Iron", "Stone", "Granite", "Deep", "Coal", "Anvil", "Gold", "Copper", "Rock", "Ember", "Flint", "Hammer"],
      ["fist", "beard", "delver", "forge", "helm", "shield", "brow", "hand", "vein", "mantle", "breaker"],
    ],
  },
  halfling: {
    start: ["Ber", "Cal", "Dil", "Fos", "Lil", "Mer", "Pip", "Ros", "Sam", "Tob", "Wil", "Bel", "Cora", "Mil", "Nel", "Pol", "Tan"],
    mid: ["", "", "a", "i", "o", "ly"],
    end: ["ry", "lo", "bo", "lie", "py", "wise", "do", "na", "mie", "kin", "by", "ret"],
    family: [
      ["Apple", "Tea", "Honey", "Bramble", "Good", "Under", "Hill", "Thistle", "Green", "Tumble", "Merry", "Barley"],
      ["foot", "bottle", "barrel", "kettle", "leaf", "bough", "hollow", "burrow", "dew", "seed", "button"],
    ],
  },
  orcish: {
    start: ["Ug", "Gro", "Kra", "Mug", "Ruk", "Sha", "Thok", "Urg", "Vra", "Zug", "Bol", "Dra", "Gash", "Ok", "Yur"],
    mid: ["", "", "a", "u", "o", "ga"],
    end: ["ash", "gor", "nak", "rok", "dush", "ka", "mog", "gul", "rash", "tuk", "zha", "gra"],
    family: [
      ["Skull", "Blood", "Tusk", "Ash", "Bone", "Scar", "Grim", "Black", "Stone", "Red"],
      ["splitter", "cleaver", "hide", "fang", "maw", "eater", "crusher", "howl", "jaw", "brand"],
    ],
  },
  northern: {
    start: ["As", "Bjar", "Ei", "Frey", "Gun", "Hal", "In", "Kjel", "Ra", "Sig", "Tor", "Ul", "Vig", "Yr", "Sol", "Ast"],
    mid: ["", "", "a", "e", "i"],
    end: ["dis", "vald", "rid", "mund", "hild", "ar", "leif", "run", "gerd", "ulf", "ny", "dar", "vor"],
    family: [
      ["Frost", "Storm", "Wolf", "Elk", "Snow", "Fjord", "Rime", "Bear", "Sea", "Ice"],
      ["born", "ward", "hall", "strand", "fell", "heim", "vik", "mark", "crest"],
    ],
  },
  southern: {
    start: ["A", "Ba", "Da", "Fa", "Ha", "Ja", "Ka", "Ma", "Na", "Ra", "Sa", "Ta", "Za", "Ir", "Ou", "Se"],
    mid: ["", "ri", "si", "la", "mi", "zi", "ha", "ne"],
    end: ["mir", "ra", "dan", "lia", "sim", "na", "zir", "ya", "hal", "dra", "kesh", "tan", "ira"],
    family: [
      ["al-", "ibn ", "bint ", "of "],
      ["Sahar", "Qadir", "the Dunes", "Mirab", "Haskun", "the Oasis", "Taleed", "Zarim", "the Red Coast", "Ashkan"],
    ],
  },
};

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function givenName(r: Rng, style: NameStyle): string {
  const s = STYLES[style];
  return capitalise(r.pick(s.start) + r.pick(s.mid) + r.pick(s.end));
}

export function familyName(r: Rng, style: NameStyle): string {
  const fam = STYLES[style].family;
  if (!fam) return "";
  const [a, b] = fam;
  // Compound surnames ("Ironforge") and particles ("al-Sahar", "of the Dunes") both just join.
  return r.pick(a) + r.pick(b);
}

export function personName(r: Rng, style: NameStyle): string {
  const given = givenName(r, style);
  // Most people carry a family name; a few go by one name alone.
  return r.chance(0.85) ? `${given} ${familyName(r, style)}` : given;
}

const TAVERN_ADJ = ["Drowsy", "Gilded", "Crooked", "Rusty", "Laughing", "Wandering", "Sleeping", "Salty", "Broken", "Jolly", "Lonely", "Howling", "Silver", "Tipsy", "Blind", "Merry", "Copper", "Golden", "Wicked"];
const TAVERN_NOUN = ["Pony", "Dragon", "Lantern", "Goose", "Anchor", "Kettle", "Griffon", "Barrel", "Badger", "Stag", "Mermaid", "Wyvern", "Cauldron", "Owl", "Boar", "Crown", "Fiddle", "Hound", "Toad", "Candle"];
const TAVERN_FORMS = ["The {adj} {noun}", "The {noun} & {noun2}", "The {adj} {noun}", "{given}'s Rest", "The {noun}'s Head"];

const SETTLE_A = ["Ash", "Bright", "Cold", "Elder", "Fair", "Green", "High", "Low", "Mill", "Oak", "Raven", "Red", "Salt", "Stone", "Thorn", "White", "Wolf", "Willow", "Iron", "Amber", "Brack", "Dun", "Kings", "Marsh"];
const SETTLE_B = ["bridge", "brook", "bury", "by", "cliff", "dale", "fell", "ford", "gate", "haven", "hold", "hollow", "mere", "moor", "port", "stead", "ton", "vale", "watch", "wick", "well", "reach"];

const SHOP_OWNER_FORMS = ["{given}'s {trade}", "The {adj} {thing}", "{family} & Daughters", "{family} Brothers' {trade}", "The {thing} and {thing2}"];
const SHOP_TRADES = ["Curios", "Provisions", "Smithy", "Apothecary", "Outfitters", "Emporium", "Bindery", "Arms", "Sundries", "Tannery", "Trading Post", "Charms"];
const SHOP_ADJ = ["Honest", "Lucky", "Humble", "Gleaming", "Hidden", "Well-Worn", "Quiet", "Busy", "Odd"];
const SHOP_THINGS = ["Scale", "Needle", "Hammer", "Mortar", "Lantern", "Quill", "Key", "Coin", "Thimble", "Compass", "Spindle", "Bell"];

const DEITY_PRE = ["Aur", "Bel", "Cel", "Dov", "Eth", "Hel", "Ith", "Kor", "Lum", "Mor", "Nyr", "Ol", "Sar", "Tyr", "Vel", "Xal", "Zor", "Am", "Ser", "Vor"];
const DEITY_SUF = ["athis", "ion", "uun", "ara", "ethra", "os", "ys", "ael", "oran", "ith", "amar", "esh", "una", "ix"];
const DEITY_EPITHETS = [
  "the Lantern-Bearer", "Keeper of Thresholds", "the Hungry Tide", "Lady of Harvests", "the Last Word",
  "Warden of the Deep Roads", "the Smiling Thief", "Mother of Storms", "the Patient Flame", "Lord of Ledgers",
  "the Quiet Hound", "Weaver of Oaths", "the Unblinking Eye", "Shepherd of the Drowned", "the First Forge",
];

function fill(template: string, parts: Record<string, () => string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (parts[key] ? parts[key]() : key));
}

export function tavernName(r: Rng): string {
  // Two different creatures/things for "The Owl & Anchor", never "Owl & Owl".
  const [noun, noun2] = r.sample(TAVERN_NOUN, 2);
  return fill(r.pick(TAVERN_FORMS), {
    adj: () => r.pick(TAVERN_ADJ),
    noun: () => noun,
    noun2: () => noun2,
    given: () => givenName(r, "common"),
  });
}

export function settlementName(r: Rng): string {
  const a = r.pick(SETTLE_A);
  const b = r.pick(SETTLE_B);
  return a + b;
}

export function shopName(r: Rng): string {
  return fill(r.pick(SHOP_OWNER_FORMS), {
    given: () => givenName(r, "common"),
    family: () => familyName(r, "common"),
    trade: () => r.pick(SHOP_TRADES),
    adj: () => r.pick(SHOP_ADJ),
    thing: () => r.pick(SHOP_THINGS),
    thing2: () => r.pick(SHOP_THINGS),
  });
}

export function deityName(r: Rng): string {
  return `${r.pick(DEITY_PRE)}${r.pick(DEITY_SUF)}, ${r.pick(DEITY_EPITHETS)}`;
}

export function nameOfKind(r: Rng, kind: NameKind, style: NameStyle): string {
  switch (kind) {
    case "person":
      return personName(r, style);
    case "tavern":
      return tavernName(r);
    case "settlement":
      return settlementName(r);
    case "shop":
      return shopName(r);
    case "deity":
      return deityName(r);
  }
}
