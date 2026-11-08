/**
 * The generator registry: what each generator rolls, field by field, and what
 * it can be saved as. Pure and client-safe — no network, no database, no AI.
 *
 * A result is rebuilt from per-field seeds (see `rng.ts`): rerolling a field
 * gives it a new seed, locking it keeps its current value, and fields later
 * in the list see the values before them (a name follows the ancestry).
 *
 * Adding a generator is adding an entry here, plus its UI strings in the
 * dictionaries (`gen.<id>.name` / `gen.<id>.desc`, and any new field/option
 * keys).
 */
import {
  Beer,
  CloudSun,
  Coins,
  Home,
  MessageCircleQuestion,
  ScrollText,
  Tag,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { AtlasLinkType } from "@/lib/atlas/link-types";
import type { TranslationKey } from "@/lib/i18n";
import { newSeed, rng, type Rng } from "@/lib/generators/rng";
import {
  NAME_KINDS,
  NAME_STYLES,
  nameOfKind,
  personName,
  settlementName,
  tavernName,
  type NameKind,
  type NameStyle,
} from "@/lib/generators/names";
import * as T from "@/lib/generators/tables";

/** A campaign magic item the treasure generator may mix in. */
export type PoolItem = { name: string; rarity: string; itemType: string };

export type GenContext = {
  values: Record<string, string>;
  options: Record<string, string>;
  /** Unclaimed campaign magic items (homebrew included) for treasure. */
  pool: PoolItem[];
};

export type FieldDef = {
  key: string;
  labelKey: TranslationKey;
  multiline?: boolean;
  roll: (r: Rng, ctx: GenContext) => string;
};

export type OptionDef = {
  key: string;
  labelKey: TranslationKey;
  choices: { value: string; labelKey: TranslationKey }[];
  default: string;
};

/** Records a result can become. */
export type SaveTarget = "npc" | "shop" | "location" | "quest" | "rumor" | "shop_stock";

export type GeneratorDef = {
  id: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  icon: LucideIcon;
  options: OptionDef[];
  fields: FieldDef[];
  saves: SaveTarget[];
  /** If set, a saved record can also be dropped onto an Atlas map as a marker of this link type. */
  mapLink?: AtlasLinkType;
};

export type GeneratedResult = {
  generatorId: string;
  options: Record<string, string>;
  seeds: Record<string, number>;
  values: Record<string, string>;
  locked: string[];
};

/* ------------------------------- helpers -------------------------------- */

function weighted<T extends { weight: number }>(r: Rng, items: readonly T[]): T {
  const total = items.reduce((n, i) => n + i.weight, 0);
  let roll = r.next() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}

function styleForAncestry(ancestry: string): NameStyle {
  const hit = T.ANCESTRIES.find((a) => a.name === ancestry);
  return (hit?.style as NameStyle | undefined) ?? "common";
}

const field = (
  key: string,
  roll: FieldDef["roll"],
  multiline = false,
): FieldDef => ({ key, labelKey: `gen.field.${key}` as TranslationKey, roll, multiline });

const choices = (values: readonly string[]) =>
  values.map((value) => ({ value, labelKey: `gen.choice.${value}` as TranslationKey }));

/* ------------------------------ generators ------------------------------ */

const NAME_COUNT = 6;

export const GENERATORS: GeneratorDef[] = [
  {
    id: "npc",
    nameKey: "gen.npc.name",
    descKey: "gen.npc.desc",
    icon: UserRound,
    options: [
      {
        key: "statBlock",
        labelKey: "gen.option.statBlock",
        choices: [
          { value: "none", labelKey: "gen.choice.none" },
          { value: "auto", labelKey: "gen.choice.auto" },
        ],
        default: "none",
      },
    ],
    fields: [
      field("ancestry", (r) => weighted(r, T.ANCESTRIES).name),
      field("name", (r, c) => personName(r, styleForAncestry(c.values.ancestry))),
      field("pronouns", (r) => r.pick(T.PRONOUNS)),
      field("occupation", (r) => r.pick(T.OCCUPATIONS)),
      field("appearance", (r) => r.pick(T.APPEARANCES)),
      field("trait", (r) => r.pick(T.TRAITS)),
      field("ideal", (r) => r.pick(T.IDEALS)),
      field("bond", (r) => r.pick(T.BONDS)),
      field("flaw", (r) => r.pick(T.FLAWS)),
      field("secret", (r) => r.pick(T.SECRETS)),
      field("hook", (r) => r.pick(T.NPC_HOOKS)),
      field("statBlock", (r, c) => (c.options.statBlock === "auto" ? r.pick(T.NPC_STAT_BLOCKS) : "")),
    ],
    saves: ["npc"],
    mapLink: "npc",
  },
  {
    id: "tavern",
    nameKey: "gen.tavern.name",
    descKey: "gen.tavern.desc",
    icon: Beer,
    options: [],
    fields: [
      field("name", (r) => tavernName(r)),
      field("vibe", (r) => r.pick(T.TAVERN_VIBES)),
      field("specialty", (r) => `${r.pick(T.TAVERN_DRINKS)}; ${r.pick(T.TAVERN_DISHES).toLowerCase()}`),
      field("barkeep", (r) => {
        const ancestry = weighted(r, T.ANCESTRIES).name;
        return `${personName(r, styleForAncestry(ancestry))} (${ancestry.toLowerCase()}, ${r.pick(T.PRONOUNS)}) — ${r.pick(T.TRAITS).toLowerCase()}`;
      }),
      field("patron", (r) => r.pick(T.PATRONS)),
      field("rumor", (r) => `${capitalise(r.pick(T.RUMOR_SUBJECTS))} ${r.pick(T.RUMOR_CLAIMS)}.`),
    ],
    saves: ["shop"],
    mapLink: "shop",
  },
  {
    id: "settlement",
    nameKey: "gen.settlement.name",
    descKey: "gen.settlement.desc",
    icon: Home,
    options: [],
    fields: [
      field("name", (r) => settlementName(r)),
      field("size", (r) => {
        const s = weighted(r, T.SETTLEMENT_SIZES);
        return `${s.label} (pop. ${s.population})`;
      }),
      field("feature", (r) => r.pick(T.SETTLEMENT_FEATURES)),
      field("problem", (r) => r.pick(T.SETTLEMENT_PROBLEMS)),
      field("power", (r) => r.pick(T.SETTLEMENT_POWERS)),
    ],
    saves: ["location"],
    mapLink: "location",
  },
  {
    id: "treasure",
    nameKey: "gen.treasure.name",
    descKey: "gen.treasure.desc",
    icon: Coins,
    options: [
      {
        key: "tier",
        labelKey: "gen.option.tier",
        choices: T.TREASURE_TIERS.map((v) => ({ value: v, labelKey: `gen.choice.tier${v.replace("-", "_")}` as TranslationKey })),
        default: "1-4",
      },
    ],
    fields: [
      field("coins", (r, c) => {
        const ranges = T.COINS[tierOf(c)];
        const parts = (["pp", "gp", "sp", "cp"] as const)
          .map((k) => [k, ranges[k][1] ? r.int(...ranges[k]) : 0] as const)
          .filter(([, n]) => n > 0)
          .map(([k, n]) => `${n.toLocaleString("en")} ${k}`);
        return parts.join(", ") || "—";
      }),
      field("valuables", (r, c) => {
        const tier = tierOf(c);
        if (!r.chance(0.7)) return "—";
        return r.sample(T.VALUABLES[tier], r.int(1, tier === "17-20" ? 3 : 2)).map(capitalise).join("\n");
      }, true),
      field("items", (r, c) => {
        const tier = tierOf(c);
        const chance = tier === "1-4" ? 0.45 : tier === "5-10" ? 0.6 : 0.8;
        if (!r.chance(chance)) return "—";
        // Mix the campaign's own unclaimed items (homebrew included) of a fitting rarity into the SRD list.
        const own = c.pool
          .filter((i) => T.TIER_RARITIES[tier].includes(i.rarity.toLowerCase()))
          .map((i) => i.name);
        const srd = T.MAGIC_ITEMS[tier].map((i) => i.name);
        const all = [...new Set([...srd, ...own])];
        return r.sample(all, r.chance(0.3) ? 2 : 1).join("\n");
      }, true),
    ],
    saves: ["shop_stock"],
  },
  {
    id: "quest",
    nameKey: "gen.quest.name",
    descKey: "gen.quest.desc",
    icon: ScrollText,
    options: [],
    fields: [
      field("patron", (r) => r.pick(T.QUEST_PATRONS)),
      field("task", (r) => r.pick(T.QUEST_TASKS)),
      field("place", (r) => r.pick(T.QUEST_PLACES)),
      field("twist", (r) => capitalise(r.pick(T.QUEST_TWISTS))),
      field("reward", (r) => r.pick(T.QUEST_REWARDS)),
    ],
    saves: ["quest"],
  },
  {
    id: "rumor",
    nameKey: "gen.rumor.name",
    descKey: "gen.rumor.desc",
    icon: MessageCircleQuestion,
    options: [],
    fields: [
      field("rumor", (r) => `${capitalise(r.pick(T.RUMOR_SUBJECTS))} ${r.pick(T.RUMOR_CLAIMS)}.`),
      field("source", (r) => r.pick(T.RUMOR_SOURCES)),
      field("truth", (r) => r.pick(T.RUMOR_TRUTHS)),
    ],
    saves: ["rumor"],
  },
  {
    id: "names",
    nameKey: "gen.names.name",
    descKey: "gen.names.desc",
    icon: Tag,
    options: [
      { key: "kind", labelKey: "gen.option.kind", choices: choices(NAME_KINDS), default: "person" },
      { key: "style", labelKey: "gen.option.style", choices: choices(NAME_STYLES), default: "common" },
    ],
    fields: Array.from({ length: NAME_COUNT }, (_, i) => ({
      key: `name${i + 1}`,
      labelKey: "gen.field.name" as TranslationKey,
      roll: (r: Rng, c: GenContext) =>
        nameOfKind(r, (c.options.kind as NameKind) ?? "person", (c.options.style as NameStyle) ?? "common"),
    })),
    saves: [],
  },
  {
    id: "weather",
    nameKey: "gen.weather.name",
    descKey: "gen.weather.desc",
    icon: CloudSun,
    options: [
      { key: "climate", labelKey: "gen.option.climate", choices: choices(T.CLIMATES), default: "temperate" },
      { key: "season", labelKey: "gen.option.season", choices: choices(T.SEASONS), default: "summer" },
    ],
    fields: [
      field("sky", (r, c) => r.pick(T.SKIES[(c.options.climate as (typeof T.CLIMATES)[number]) ?? "temperate"] ?? T.SKIES.temperate)),
      field("temperature", (r, c) => r.pick(T.TEMPS[(c.options.season as (typeof T.SEASONS)[number]) ?? "summer"] ?? T.TEMPS.summer)),
      field("wind", (r) => r.pick(T.WINDS)),
      field("effect", (_r, c) => T.WEATHER_EFFECTS[weatherEffectKey(c.values.sky, c.values.wind, c.values.temperature)]),
    ],
    saves: [],
  },
];

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function tierOf(c: GenContext): T.TreasureTier {
  const t = c.options.tier as T.TreasureTier;
  return T.TREASURE_TIERS.includes(t) ? t : "1-4";
}

function weatherEffectKey(sky = "", wind = "", temp = ""): string {
  const s = sky.toLowerCase();
  if (s.includes("blizzard")) return "blizzard";
  if (s.includes("dust")) return "dust";
  if (s.includes("fog") || s.includes("mist")) return "fog";
  if (s.includes("storm")) return "storm";
  if (s.includes("snow") || s.includes("sleet")) return "snow";
  if (s.includes("rain") || s.includes("drizzle") || s.includes("downpour")) return "rain";
  if (wind.toLowerCase().includes("gale")) return "gale";
  if (temp === "Sweltering") return "heat";
  return "none";
}

export function generatorById(id: string): GeneratorDef | undefined {
  return GENERATORS.find((g) => g.id === id);
}

export function defaultOptions(def: GeneratorDef): Record<string, string> {
  return Object.fromEntries(def.options.map((o) => [o.key, o.default]));
}

/** Roll every field in order from its seed, keeping locked fields as they were. */
function build(
  def: GeneratorDef,
  options: Record<string, string>,
  seeds: Record<string, number>,
  locked: string[],
  previous: Record<string, string>,
  pool: PoolItem[],
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const f of def.fields) {
    values[f.key] =
      locked.includes(f.key) && previous[f.key] !== undefined
        ? previous[f.key]
        : f.roll(rng(seeds[f.key]), { values, options, pool });
  }
  return values;
}

/** A fresh result. */
export function generate(
  def: GeneratorDef,
  options: Record<string, string> = defaultOptions(def),
  pool: PoolItem[] = [],
): GeneratedResult {
  const seeds = Object.fromEntries(def.fields.map((f) => [f.key, newSeed()]));
  return { generatorId: def.id, options, seeds, values: build(def, options, seeds, [], {}, pool), locked: [] };
}

/**
 * Reroll some fields (or every unlocked one). Rerolled fields get new seeds;
 * everything else keeps its seed, so only what was asked for — and anything
 * that depends on it — changes.
 */
export function reroll(
  def: GeneratorDef,
  result: GeneratedResult,
  keys: string[] | "all",
  pool: PoolItem[] = [],
): GeneratedResult {
  const targets = keys === "all" ? def.fields.map((f) => f.key).filter((k) => !result.locked.includes(k)) : keys;
  const seeds = { ...result.seeds };
  for (const k of targets) seeds[k] = newSeed();
  // A field rerolled on purpose is unlocked for the roll.
  const locked = result.locked.filter((k) => !targets.includes(k));
  return { ...result, seeds, values: build(def, result.options, seeds, locked, result.values, pool) };
}

/** Change an option (tier, style…) and re-roll from the same seeds. */
export function withOptions(
  def: GeneratorDef,
  result: GeneratedResult,
  options: Record<string, string>,
  pool: PoolItem[] = [],
): GeneratedResult {
  return { ...result, options, values: build(def, options, result.seeds, result.locked, result.values, pool) };
}

export function toggleLock(result: GeneratedResult, key: string): GeneratedResult {
  const locked = result.locked.includes(key)
    ? result.locked.filter((k) => k !== key)
    : [...result.locked, key];
  return { ...result, locked };
}

/** Plain text for the clipboard, one "Label: value" line per non-empty field. */
export function resultText(
  def: GeneratorDef,
  result: GeneratedResult,
  label: (key: TranslationKey) => string,
): string {
  return def.fields
    .filter((f) => result.values[f.key] && result.values[f.key] !== "—")
    .map((f) =>
      def.id === "names"
        ? result.values[f.key]
        : `${label(f.labelKey)}: ${result.values[f.key].includes("\n") ? "\n" + result.values[f.key] : result.values[f.key]}`,
    )
    .join("\n");
}

