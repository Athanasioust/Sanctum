/**
 * Markdown (Obsidian) import — detection and field extraction.
 *
 * Obsidian notes have no fixed schema, so everything here is best-effort and
 * additive: whatever we recognise gets mapped onto Sanctum fields, and the
 * original markdown is always preserved on the created record so an import can
 * never lose text. The module is dependency-free and isomorphic — the import
 * screen runs it to preview a vault, and the API route runs it again as the
 * authority when the import is committed.
 */

import { parseFrontmatter, fmBoolean, fmList, fmNumber, fmString } from "./frontmatter";
import type { Frontmatter } from "./frontmatter";
import { ABILITIES, ITEM_RARITIES, LOCATION_TYPES, SIZES, SKILLS, SPELL_SCHOOLS } from "./constants";
import type { AbilityKey } from "./constants";
import type { StatBlockAction } from "@/db/schema";

/* -------------------------------------------------------------------------- */
/*  Targets                                                                    */
/* -------------------------------------------------------------------------- */

export const IMPORT_TARGET_VALUES = [
  "note",
  "npc",
  "monster",
  "spell",
  "magic-item",
  "location",
  "quest",
  "faction",
  "skip",
] as const;

export type ImportTarget = (typeof IMPORT_TARGET_VALUES)[number];

export const IMPORT_TARGETS: { key: ImportTarget; label: string }[] = [
  { key: "note", label: "Note" },
  { key: "npc", label: "NPC" },
  { key: "monster", label: "Monster" },
  { key: "spell", label: "Spell" },
  { key: "magic-item", label: "Magic Item" },
  { key: "location", label: "Location" },
  { key: "quest", label: "Quest" },
  { key: "faction", label: "Faction" },
  { key: "skip", label: "Skip" },
];

export function importTargetLabel(target: ImportTarget): string {
  return IMPORT_TARGETS.find((t) => t.key === target)?.label ?? target;
}

/**
 * Tokens (frontmatter `type`/`tags`/`category`, or a containing folder name)
 * that identify a note's kind. Checked in the order listed below, so more
 * specific kinds win over the catch-alls.
 */
const TARGET_KEYWORDS: { target: ImportTarget; words: string[] }[] = [
  { target: "monster", words: ["monster", "monsters", "creature", "creatures", "bestiary", "statblock", "stat-block", "statblocks", "enemy", "enemies"] },
  { target: "spell", words: ["spell", "spells", "cantrip", "cantrips", "magic/spells"] },
  { target: "magic-item", words: ["magic-item", "magicitem", "magic-items", "magicitems", "item", "items", "artifact", "artifacts", "wondrous", "loot", "treasure", "equipment"] },
  { target: "faction", words: ["faction", "factions", "organization", "organizations", "organisation", "organisations", "guild", "guilds", "order", "cult", "cults"] },
  { target: "location", words: ["location", "locations", "place", "places", "region", "regions", "city", "cities", "town", "towns", "village", "villages", "dungeon", "dungeons", "settlement", "settlements", "map", "maps", "world"] },
  { target: "quest", words: ["quest", "quests", "adventure", "adventures", "mission", "missions", "hook", "hooks", "plot", "plots"] },
  { target: "npc", words: ["npc", "npcs", "character", "characters", "person", "people", "ally", "allies", "contact", "contacts", "cast"] },
  { target: "note", words: ["note", "notes", "lore", "session", "sessions", "journal", "log", "logs", "misc"] },
];

/* -------------------------------------------------------------------------- */
/*  Parsed document                                                            */
/* -------------------------------------------------------------------------- */

export type ParsedDoc = {
  /** Vault-relative path, used for display and folder-based detection. */
  path: string;
  title: string;
  frontmatter: Frontmatter;
  body: string;
  /** Best guess at what this note should become. */
  detected: ImportTarget;
  /** "high" when frontmatter/folder said so, "low" when we guessed from prose. */
  confidence: "high" | "low";
  /** Why we guessed — shown in the preview so the DM can sanity-check it. */
  reason: string;
};

function baseName(path: string): string {
  const file = path.split(/[/\\]/).pop() ?? path;
  return file.replace(/\.(md|markdown|txt)$/i, "");
}

function folderTokens(path: string): string[] {
  const parts = path.split(/[/\\]/);
  parts.pop();
  return parts.map((p) => p.trim().toLowerCase()).filter(Boolean);
}

/** First `# Heading` in the body, if the note leads with one. */
function firstHeading(body: string): string | undefined {
  const match = /^\s*#{1,2}\s+(.+?)\s*#*\s*$/m.exec(body);
  return match ? stripInline(match[1]) : undefined;
}

/** Strip markdown emphasis/link syntax from a short piece of inline text. */
export function stripInline(text: string): string {
  return text
    .replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_m, target, alias) => alias || target)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detect(
  fm: Frontmatter,
  body: string,
  path: string,
): { detected: ImportTarget; confidence: "high" | "low"; reason: string } {
  const declared = [
    ...(fmList(fm, ["type", "kind", "category", "categories", "class"]) ?? []),
    ...(fmList(fm, ["tags", "tag"]) ?? []),
  ].map((t) => t.trim().toLowerCase().replace(/^#/, ""));

  for (const { target, words } of TARGET_KEYWORDS) {
    const hit = declared.find((token) =>
      words.some((w) => token === w || token.endsWith(`/${w}`)),
    );
    if (hit) {
      return { detected: target, confidence: "high", reason: `frontmatter "${hit}"` };
    }
  }

  const folders = folderTokens(path);
  for (const { target, words } of TARGET_KEYWORDS) {
    const hit = folders.find((folder) => words.includes(folder));
    if (hit) {
      return { detected: target, confidence: "high", reason: `folder "${hit}"` };
    }
  }

  // Nothing declared — fall back to the shape of the prose itself.
  if (/^\s*(?:[*_>|\s-]*)armor class\b/im.test(body) && /hit points\b/i.test(body)) {
    return { detected: "monster", confidence: "low", reason: "stat block layout" };
  }
  if (/casting time\s*:/i.test(body) && /components\s*:/i.test(body)) {
    return { detected: "spell", confidence: "low", reason: "spell layout" };
  }
  if (/\brarity\b/i.test(body) && /attunement/i.test(body)) {
    return { detected: "magic-item", confidence: "low", reason: "item layout" };
  }
  if (/requires attunement/i.test(body)) {
    return { detected: "magic-item", confidence: "low", reason: "attunement line" };
  }
  return { detected: "note", confidence: "low", reason: "no type markers" };
}

export function parseMarkdownDoc(path: string, content: string): ParsedDoc {
  const { data, body } = parseFrontmatter(content);
  const title =
    fmString(data, ["title", "name"]) ?? firstHeading(body) ?? baseName(path) ?? "Untitled";
  const { detected, confidence, reason } = detect(data, body, path);
  return { path, title, frontmatter: data, body, detected, confidence, reason };
}

/* -------------------------------------------------------------------------- */
/*  Stat block extraction                                                      */
/* -------------------------------------------------------------------------- */

const ABILITY_KEYS = ABILITIES.map((a) => a.key) as AbilityKey[];
const ABILITY_LABELS: Record<string, AbilityKey> = {};
for (const a of ABILITIES) {
  ABILITY_LABELS[a.key] = a.key;
  ABILITY_LABELS[a.short.toLowerCase()] = a.key;
  ABILITY_LABELS[a.label.toLowerCase()] = a.key;
}

const SKILL_BY_LABEL: Record<string, string> = {};
for (const s of SKILLS) {
  SKILL_BY_LABEL[s.label.toLowerCase()] = s.key;
  SKILL_BY_LABEL[s.key] = s.key;
  SKILL_BY_LABEL[s.label.toLowerCase().replace(/\s+/g, "")] = s.key;
}

/** Remove leading list markers, blockquote arrows and emphasis from a line. */
function cleanLine(line: string): string {
  return line
    .replace(/^\s*>+\s?/, "")
    .replace(/^\s*[-*+]\s+/, "")
    .replace(/^\s*\|\s*/, "")
    .replace(/\s*\|\s*$/, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/__/g, "")
    .trim();
}

/** Match `Label value` / `Label: value` / `**Label** value` at line start. */
function labelled(line: string, label: string): string | undefined {
  const re = new RegExp(`^${label}\\s*[:.]?\\s*(.+)$`, "i");
  const match = re.exec(cleanLine(line));
  return match ? match[1].trim() : undefined;
}

function splitList(value: string): string[] {
  if (/^[-–—]$/.test(value.trim())) return [];
  return value
    .split(/,(?![^()]*\))/)
    .map((part) => stripInline(part))
    .filter(Boolean);
}

const SECTION_ALIASES: { key: keyof StatBlockSections; words: string[] }[] = [
  { key: "traits", words: ["traits", "special abilities", "abilities", "features"] },
  { key: "actions", words: ["actions"] },
  { key: "reactions", words: ["reactions"] },
  { key: "legendaryActions", words: ["legendary actions", "legendary"] },
  { key: "lairActions", words: ["lair actions", "lair"] },
];

type StatBlockSections = {
  traits: StatBlockAction[];
  actions: StatBlockAction[];
  reactions: StatBlockAction[];
  legendaryActions: StatBlockAction[];
  lairActions: StatBlockAction[];
};

export type ParsedStatBlock = StatBlockSections & {
  size?: string;
  race?: string;
  alignment?: string;
  armorClass?: number;
  hpMax?: number;
  speed?: string;
  abilities: Partial<Record<AbilityKey, number>>;
  savingThrowProficiencies: string[];
  skillProficiencies: string[];
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  senses: string[];
  languages: string[];
  challengeRating?: string;
  experiencePoints?: number;
};

function sectionFor(heading: string): keyof StatBlockSections | null {
  const text = heading.toLowerCase().replace(/[^a-z ]/g, "").trim();
  for (const { key, words } of SECTION_ALIASES) {
    if (words.some((w) => text === w || text.startsWith(`${w} `))) return key;
  }
  return null;
}

/** `***Name.*** text`, `**Name.** text`, `#### Name` — the usual entry shapes. */
function entryStart(line: string): { name: string; rest: string } | null {
  const heading = /^\s*#{3,6}\s+(.+?)\s*#*\s*$/.exec(line);
  if (heading) return { name: stripInline(heading[1]).replace(/[.:]$/, ""), rest: "" };

  const bold =
    /^\s*(?:[-*+]\s+)?(?:>\s*)?(\*{2,3}|_{2})\s*([^*_\n]{1,80}?)\s*\1\s*[.:]?\s*(.*)$/.exec(line);
  if (bold) {
    const name = stripInline(bold[2]).replace(/[.:]$/, "");
    if (name) return { name, rest: bold[3].trim() };
  }
  return null;
}

function pushEntry(list: StatBlockAction[], name: string, description: string) {
  const trimmed = description.trim();
  if (!name) return;
  list.push({ name, description: trimmed });
}

/**
 * Pull a 5e stat block out of freeform markdown. Every field is optional —
 * callers merge whatever came back over their defaults.
 */
export function parseStatBlock(body: string): ParsedStatBlock {
  const result: ParsedStatBlock = {
    abilities: {},
    savingThrowProficiencies: [],
    skillProficiencies: [],
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    senses: [],
    languages: [],
    traits: [],
    actions: [],
    reactions: [],
    legendaryActions: [],
    lairActions: [],
  };

  const lines = body.split("\n");
  let section: keyof StatBlockSections | null = null;
  let current: { name: string; description: string } | null = null;
  let sawHeaderField = false;

  const flush = () => {
    if (current && section) pushEntry(result[section], current.name, current.description);
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const clean = cleanLine(raw);

    // Section headings switch which list subsequent entries land in.
    const headingMatch = /^\s*#{1,6}\s+(.+?)\s*#*\s*$/.exec(raw);
    if (headingMatch) {
      const next = sectionFor(headingMatch[1]);
      if (next) {
        flush();
        section = next;
        continue;
      }
    }
    // Some blocks use a bare capitalised line ("Actions") instead of a heading.
    if (!headingMatch && clean && sawHeaderField) {
      const bare = sectionFor(clean);
      if (bare && clean.length <= 20) {
        flush();
        section = bare;
        continue;
      }
    }

    if (section === null) {
      // --- header block -------------------------------------------------
      if (!result.size) {
        const meta =
          /^(tiny|small|medium|large|huge|gargantuan)\s+([^,(]+?)(?:\s*\(([^)]*)\))?\s*,\s*(.+)$/i.exec(
            clean,
          );
        if (meta) {
          result.size = SIZES.find((s) => s.toLowerCase() === meta[1].toLowerCase()) ?? meta[1];
          result.race = stripInline(meta[3] || meta[2]);
          result.alignment = stripInline(meta[4]);
          sawHeaderField = true;
          continue;
        }
      }

      const ac = labelled(raw, "armou?r class");
      if (ac !== undefined && result.armorClass === undefined) {
        const n = /\d+/.exec(ac);
        if (n) result.armorClass = Number(n[0]);
        sawHeaderField = true;
        continue;
      }

      const hp = labelled(raw, "hit points");
      if (hp !== undefined && result.hpMax === undefined) {
        const n = /\d+/.exec(hp);
        if (n) result.hpMax = Number(n[0]);
        sawHeaderField = true;
        continue;
      }

      const speed = labelled(raw, "speed");
      if (speed !== undefined && !result.speed) {
        result.speed = stripInline(speed);
        sawHeaderField = true;
        continue;
      }

      const saves = labelled(raw, "saving throws");
      if (saves !== undefined) {
        for (const part of splitList(saves)) {
          const key = ABILITY_LABELS[part.replace(/[+\-−]?\d+/g, "").trim().toLowerCase()];
          if (key && !result.savingThrowProficiencies.includes(key)) {
            result.savingThrowProficiencies.push(key);
          }
        }
        sawHeaderField = true;
        continue;
      }

      const skills = labelled(raw, "skills");
      if (skills !== undefined) {
        for (const part of splitList(skills)) {
          const label = part.replace(/[+\-−]?\d+/g, "").trim().toLowerCase();
          const key = SKILL_BY_LABEL[label];
          if (key && !result.skillProficiencies.includes(key)) {
            result.skillProficiencies.push(key);
          }
        }
        sawHeaderField = true;
        continue;
      }

      const resist = labelled(raw, "damage resistances?");
      if (resist !== undefined) {
        result.resistances = splitList(resist);
        sawHeaderField = true;
        continue;
      }
      const immune = labelled(raw, "(?:damage|condition) immunities");
      if (immune !== undefined) {
        result.immunities = [...result.immunities, ...splitList(immune)];
        sawHeaderField = true;
        continue;
      }
      const vulnerable = labelled(raw, "damage vulnerabilit(?:ies|y)");
      if (vulnerable !== undefined) {
        result.vulnerabilities = splitList(vulnerable);
        sawHeaderField = true;
        continue;
      }
      const senses = labelled(raw, "senses");
      if (senses !== undefined) {
        result.senses = splitList(senses);
        sawHeaderField = true;
        continue;
      }
      const languages = labelled(raw, "languages");
      if (languages !== undefined) {
        result.languages = splitList(languages);
        sawHeaderField = true;
        continue;
      }
      const challenge = labelled(raw, "challenge(?: rating)?");
      if (challenge !== undefined) {
        const cr = /^\s*([\d/]+)/.exec(stripInline(challenge));
        if (cr) result.challengeRating = cr[1];
        const xp = /\(([\d,]+)\s*xp\)/i.exec(challenge);
        if (xp) result.experiencePoints = Number(xp[1].replace(/,/g, ""));
        sawHeaderField = true;
        continue;
      }

      if (readAbilityScores(lines, i, result)) {
        sawHeaderField = true;
        continue;
      }

      // Traits usually follow the header block with no heading of their own, so
      // the first `**Name.**` entry after it opens an implicit Traits section.
      const implicit = sawHeaderField ? entryStart(raw) : null;
      if (implicit) {
        section = "traits";
        current = { name: implicit.name, description: implicit.rest };
      }
      continue;
    }

    // --- inside a named section -----------------------------------------
    const start = entryStart(raw);
    if (start) {
      flush();
      current = { name: start.name, description: start.rest };
      continue;
    }
    if (current) {
      current.description += (current.description ? "\n" : "") + raw.trim();
    }
  }
  flush();

  if (Object.keys(result.abilities).length === 0) {
    // Last resort: scattered "STR 18 (+4)" style mentions anywhere in the note.
    for (const key of ABILITY_KEYS) {
      const short = ABILITIES.find((a) => a.key === key)!.short;
      const match = new RegExp(`\\b${short}\\b[^0-9\\n]{0,15}(\\d{1,2})`, "i").exec(body);
      if (match) result.abilities[key] = Number(match[1]);
    }
  }

  return result;
}

/**
 * Read the six ability scores laid out as a markdown table or as an
 * `STR DEX CON INT WIS CHA` header row followed by values. Returns true when
 * scores were found (so the caller can consume the line).
 */
function readAbilityScores(
  lines: string[],
  index: number,
  result: ParsedStatBlock,
): boolean {
  if (Object.keys(result.abilities).length > 0) return false;

  const cells = (line: string) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");

  const headerCells = lines[index].includes("|")
    ? cells(lines[index])
    : lines[index].trim().split(/\s{2,}|\t/);

  const normalised = headerCells.map((c) => cleanLine(c).toLowerCase());
  const isHeader =
    normalised.length >= 6 &&
    ABILITIES.every((a, i) => normalised[i] === a.short.toLowerCase());
  if (!isHeader) return false;

  for (let j = index + 1; j < Math.min(index + 4, lines.length); j++) {
    const line = lines[j];
    if (/^\s*\|?\s*:?-{2,}/.test(line)) continue; // table separator row
    const values = (line.includes("|") ? cells(line) : line.trim().split(/\s{2,}|\t/))
      .map((c) => /(\d{1,2})/.exec(cleanLine(c))?.[1])
      .filter((v): v is string => Boolean(v));
    if (values.length >= 6) {
      ABILITY_KEYS.forEach((key, i) => {
        result.abilities[key] = Number(values[i]);
      });
      return true;
    }
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/*  Builders — ParsedDoc -> entity create payloads                             */
/* -------------------------------------------------------------------------- */

/** Everything the builders produce, minus the campaign/owner scoping the route adds. */
export type BuiltNote = { title: string; content: string };

export function buildNote(doc: ParsedDoc): BuiltNote {
  const frontmatterLines = Object.entries(doc.frontmatter)
    .map(([key, value]) => `- **${key}:** ${Array.isArray(value) ? value.join(", ") : value}`)
    .join("\n");
  // Frontmatter is folded into the note body so nothing from the vault is lost.
  const content = frontmatterLines
    ? `${doc.body.trim()}\n\n---\n${frontmatterLines}`.trim()
    : doc.body.trim();
  return { title: doc.title.slice(0, 160), content: content.slice(0, 50000) };
}

function sourceFooter(doc: ParsedDoc): string {
  return `\n\n_Imported from \`${doc.path}\`._`;
}

export function buildNpc(doc: ParsedDoc, type: "npc" | "monster") {
  const fm = doc.frontmatter;
  const stats = parseStatBlock(doc.body);
  const abilities: Record<string, number> = {};
  for (const key of ABILITY_KEYS) {
    const value = fmNumber(fm, [key, key.toUpperCase(), ABILITIES.find((a) => a.key === key)!.label.toLowerCase()]) ?? stats.abilities[key];
    if (value !== undefined) abilities[key] = Math.min(30, Math.max(1, Math.trunc(value)));
  }

  const hpMax = fmNumber(fm, ["hp", "hit_points", "hitPoints", "hp_max"]) ?? stats.hpMax ?? 0;
  const size = fmString(fm, ["size"]) ?? stats.size ?? "Medium";

  return {
    name: doc.title.slice(0, 120),
    type,
    race: (fmString(fm, ["race", "species", "creature_type", "type_of_creature"]) ?? stats.race ?? "").slice(0, 80),
    class: (fmString(fm, ["class", "role", "occupation"]) ?? "").slice(0, 80),
    size: (SIZES.find((s) => s.toLowerCase() === size.toLowerCase()) ?? "Medium") as string,
    alignment: (fmString(fm, ["alignment"]) ?? stats.alignment ?? "").slice(0, 60),
    challengeRating: (fmString(fm, ["cr", "challenge", "challenge_rating"]) ?? stats.challengeRating ?? "").slice(0, 10),
    experiencePoints: fmNumber(fm, ["xp", "experience"]) ?? stats.experiencePoints ?? 0,
    ...abilities,
    hpMax,
    hpCurrent: hpMax,
    armorClass: fmNumber(fm, ["ac", "armor_class", "armour_class"]) ?? stats.armorClass ?? 10,
    speed: (fmString(fm, ["speed"]) ?? stats.speed ?? "30 ft.").slice(0, 120),
    savingThrowProficiencies: stats.savingThrowProficiencies,
    skillProficiencies: stats.skillProficiencies,
    resistances: fmList(fm, ["resistances", "damage_resistances"]) ?? stats.resistances,
    immunities: fmList(fm, ["immunities", "damage_immunities"]) ?? stats.immunities,
    vulnerabilities: fmList(fm, ["vulnerabilities", "damage_vulnerabilities"]) ?? stats.vulnerabilities,
    senses: fmList(fm, ["senses"]) ?? stats.senses,
    languages: fmList(fm, ["languages"]) ?? stats.languages,
    traits: stats.traits,
    actions: stats.actions,
    reactions: stats.reactions,
    legendaryActions: stats.legendaryActions,
    lairActions: stats.lairActions,
    isTemplate: type === "monster",
    notes: (doc.body.trim() + sourceFooter(doc)).slice(0, 20000),
  };
}

const ORDINAL_LEVELS: Record<string, number> = {
  cantrip: 0,
  "1st": 1,
  "2nd": 2,
  "3rd": 3,
  "4th": 4,
  "5th": 5,
  "6th": 6,
  "7th": 7,
  "8th": 8,
  "9th": 9,
};

export function buildSpell(doc: ParsedDoc) {
  const fm = doc.frontmatter;
  const body = doc.body;

  let level = fmNumber(fm, ["level", "spell_level"]);
  let school = fmString(fm, ["school"]);

  if (level === undefined || !school) {
    // "3rd-level evocation" / "Evocation cantrip"
    const levelled = /(\d(?:st|nd|rd|th))[-\s]level\s+(\w+)/i.exec(body);
    const cantrip = /(\w+)\s+cantrip/i.exec(body);
    if (levelled) {
      level ??= ORDINAL_LEVELS[levelled[1].toLowerCase()];
      school ||= levelled[2];
    } else if (cantrip) {
      level ??= 0;
      school ||= cantrip[1];
    }
  }
  const matchedSchool = SPELL_SCHOOLS.find(
    (s) => s.toLowerCase() === (school ?? "").trim().toLowerCase(),
  );

  const line = (label: string) => {
    const match = new RegExp(`^\\s*(?:[-*+>]\\s*)?\\**${label}\\**\\s*:\\s*(.+)$`, "im").exec(body);
    return match ? stripInline(match[1]) : undefined;
  };
  const duration = fmString(fm, ["duration"]) ?? line("duration") ?? "";

  return {
    name: doc.title.slice(0, 120),
    level: Math.min(9, Math.max(0, level ?? 0)),
    school: (matchedSchool ?? school ?? "").slice(0, 40),
    castingTime: (fmString(fm, ["casting_time", "castingTime", "time"]) ?? line("casting time") ?? "").slice(0, 60),
    range: (fmString(fm, ["range"]) ?? line("range") ?? "").slice(0, 60),
    components: (fmString(fm, ["components"]) ?? line("components") ?? "").slice(0, 60),
    duration: duration.slice(0, 60),
    description: (body.trim() + sourceFooter(doc)).slice(0, 10000),
    isPrepared: fmBoolean(fm, ["prepared", "is_prepared"]) ?? false,
    isConcentration:
      fmBoolean(fm, ["concentration"]) ?? /concentration/i.test(duration),
  };
}

export function buildMagicItem(doc: ParsedDoc) {
  const fm = doc.frontmatter;
  const body = doc.body;

  // "Wondrous item, rare (requires attunement by a wizard)"
  const typeLine = /^\s*[*_>]*\s*((?:weapon|armou?r|wondrous item|ring|rod|staff|wand|potion|scroll)[^,\n]*),\s*([^(\n]+)(\(([^)]*)\))?/im.exec(body);

  const rarityText = (fmString(fm, ["rarity"]) ?? typeLine?.[2] ?? "").toLowerCase();
  // Longest first, and on word boundaries, so "very rare" beats "rare" and
  // "uncommon" is never read as "common".
  const rarity =
    [...ITEM_RARITIES]
      .sort((a, b) => b.length - a.length)
      .find((r) => new RegExp(`\\b${r}\\b`).test(rarityText)) ?? "common";

  return {
    name: doc.title.slice(0, 120),
    itemType: (fmString(fm, ["item_type", "itemType", "category"]) ?? stripInline(typeLine?.[1] ?? "")).slice(0, 60) || "wondrous",
    rarity,
    description: (body.trim() + sourceFooter(doc)).slice(0, 10000),
    requiresAttunement:
      fmBoolean(fm, ["attunement", "requires_attunement"]) ?? /requires attunement/i.test(body),
    isCursed: fmBoolean(fm, ["cursed", "is_cursed"]) ?? /\bcursed\b/i.test(body),
    notes: "",
  };
}

export function buildLocation(doc: ParsedDoc) {
  const fm = doc.frontmatter;
  const declared = (fmString(fm, ["location_type", "type", "category"]) ?? "").toLowerCase();
  const fromPath = folderTokens(doc.path).join(" ");
  const type =
    LOCATION_TYPES.find((t) => declared === t) ??
    LOCATION_TYPES.find((t) => declared.includes(t)) ??
    LOCATION_TYPES.find((t) => fromPath.includes(t)) ??
    "other";

  return {
    name: doc.title.slice(0, 120),
    description: (doc.body.trim() + sourceFooter(doc)).slice(0, 20000),
    type,
    notes: "",
  };
}

const QUEST_STATUSES = ["active", "on-hold", "completed", "failed"] as const;

export function buildQuest(doc: ParsedDoc) {
  const fm = doc.frontmatter;
  const declared = (fmString(fm, ["status", "state"]) ?? "").toLowerCase().replace(/\s+/g, "-");
  const status = QUEST_STATUSES.find((s) => s === declared) ?? "active";

  // `- [ ] objective` / `- [x] objective` checklists become sub-objectives.
  const subObjectives = [...doc.body.matchAll(/^\s*[-*+]\s+\[([ xX])\]\s+(.+)$/gm)]
    .slice(0, 50)
    .map((m) => ({ text: stripInline(m[2]).slice(0, 500), checked: m[1].toLowerCase() === "x" }));

  return {
    title: doc.title.slice(0, 200),
    description: (doc.body.trim() + sourceFooter(doc)).slice(0, 20000),
    status,
    subObjectives,
    reward: (fmString(fm, ["reward", "rewards"]) ?? "").slice(0, 2000),
    notes: "",
  };
}

const FACTION_RELATIONS = ["allied", "neutral", "hostile", "unknown"] as const;

/**
 * Pull the body of a `## Heading` section, when the note has one. Capturing
 * stops at the next heading of any level.
 */
function section(body: string, names: string[]): string {
  const lines = body.split("\n");
  const out: string[] = [];
  let capturing = false;

  for (const line of lines) {
    const heading = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      if (capturing) break;
      const text = stripInline(heading[1]).toLowerCase().replace(/[^a-z\s]/g, "").trim();
      capturing = names.includes(text);
      continue;
    }
    if (capturing) out.push(line);
  }
  return out.join("\n").trim();
}

export function buildFaction(doc: ParsedDoc) {
  const fm = doc.frontmatter;
  const declared = (fmString(fm, ["relationship", "attitude", "standing"]) ?? "").toLowerCase();
  const relationshipWithPlayers =
    FACTION_RELATIONS.find((r) => declared.includes(r)) ?? "unknown";

  return {
    name: doc.title.slice(0, 120),
    description: (doc.body.trim() + sourceFooter(doc)).slice(0, 20000),
    goals: section(doc.body, ["goal", "goals", "aim", "aims", "objective", "objectives"]).slice(0, 10000),
    resources: section(doc.body, ["resource", "resources", "asset", "assets"]).slice(0, 10000),
    secrets: section(doc.body, ["secret", "secrets"]).slice(0, 10000),
    relationshipWithPlayers,
    notes: "",
  };
}

/** One-line preview of what a document will turn into. */
export function describeDoc(doc: ParsedDoc, target: ImportTarget): string {
  if (target === "skip") return "Not imported";
  if (target === "note") return `Note · ${doc.body.trim().length} chars`;
  if (target === "monster" || target === "npc") {
    const stats = parseStatBlock(doc.body);
    const bits = [
      stats.armorClass !== undefined ? `AC ${stats.armorClass}` : null,
      stats.hpMax !== undefined ? `${stats.hpMax} HP` : null,
      stats.challengeRating ? `CR ${stats.challengeRating}` : null,
      stats.actions.length ? `${stats.actions.length} actions` : null,
    ].filter(Boolean);
    return bits.length ? bits.join(" · ") : "No stat block found — text kept in notes";
  }
  if (target === "spell") {
    const spell = buildSpell(doc);
    return spell.level === 0
      ? `${spell.school || "Spell"} cantrip`
      : `Level ${spell.level} ${spell.school || "spell"}`;
  }
  if (target === "magic-item") {
    const item = buildMagicItem(doc);
    return `${item.itemType}, ${item.rarity}${item.requiresAttunement ? " (attunement)" : ""}`;
  }
  return importTargetLabel(target);
}
