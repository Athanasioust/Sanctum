/**
 * 5e character sheet (PDF) import.
 *
 * Reads AcroForm field values out of a *fillable* sheet — the official WotC
 * PDF and the exports that copy its field names (D&D Beyond, most VTT
 * exporters). Nothing is shipped with the app: this only ever reads a file the
 * user hands us, and no rules content is bundled beyond the SRD data Sanctum
 * already carries.
 *
 * Flat or scanned sheets have no form fields and cannot be read here; callers
 * surface `NoFormFieldsError` as a clear message instead of failing hard.
 */

import "server-only";
import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
} from "pdf-lib";
import { ABILITIES, LANGUAGES, SKILLS } from "./constants";
import type { AbilityKey } from "./constants";
import { abilityModifier, proficiencyBonusForLevel } from "./dnd";
import { SRD_SPELLS } from "./srd-spells";
import type { FeatureEntry, MulticlassEntry } from "@/db/schema";

export class PdfReadError extends Error {}
export class NoFormFieldsError extends Error {}

/* -------------------------------------------------------------------------- */
/*  Field extraction                                                           */
/* -------------------------------------------------------------------------- */

export type SheetFields = {
  /** Normalised field name -> trimmed text value (empty values dropped). */
  text: Map<string, string>;
  /** Normalised field name -> checked state. */
  checks: Map<string, boolean>;
  /** Every field name as it appears in the PDF, for diagnostics. */
  names: string[];
};

/** Field names vary in spacing/casing between sheet revisions — flatten both. */
function norm(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function readSheetFields(bytes: Uint8Array): Promise<SheetFields> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      updateMetadata: false,
      throwOnInvalidObject: false,
    });
  } catch (err) {
    throw new PdfReadError(err instanceof Error ? err.message : "Unreadable PDF");
  }

  const text = new Map<string, string>();
  const checks = new Map<string, boolean>();
  const names: string[] = [];

  let fields;
  try {
    fields = doc.getForm().getFields();
  } catch {
    throw new NoFormFieldsError("Form data could not be read");
  }

  for (const field of fields) {
    const name = field.getName();
    names.push(name);
    const key = norm(name);
    try {
      if (field instanceof PDFTextField) {
        const value = field.getText()?.trim();
        if (value) text.set(key, value);
      } else if (field instanceof PDFCheckBox) {
        checks.set(key, field.isChecked());
      } else if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
        const value = field.getSelected()[0]?.trim();
        if (value) text.set(key, value);
      } else if (field instanceof PDFRadioGroup) {
        const value = field.getSelected()?.trim();
        if (value) text.set(key, value);
      }
    } catch {
      // A single unreadable widget must not sink the whole import.
    }
  }

  if (names.length === 0) throw new NoFormFieldsError("No form fields");
  return { text, checks, names };
}

/* -------------------------------------------------------------------------- */
/*  Lookup helpers                                                             */
/* -------------------------------------------------------------------------- */

function pick(fields: SheetFields, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const value = fields.text.get(norm(alias));
    if (value) return value;
  }
  return undefined;
}

/** First integer in a field's value, e.g. "30 ft." -> 30, "+7" -> 7. */
function pickInt(fields: SheetFields, aliases: string[]): number | undefined {
  const raw = pick(fields, aliases);
  if (raw === undefined) return undefined;
  const match = /-?\d+/.exec(raw.replace(/,/g, ""));
  return match ? Number(match[0]) : undefined;
}

/** Signed integer, for modifier boxes where the sign matters ("+4", "−1"). */
function parseSigned(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const match = /([+\-−–]?)\s*(\d+)/.exec(raw.replace(/,/g, ""));
  if (!match) return undefined;
  const value = Number(match[2]);
  return /[-−–]/.test(match[1]) ? -value : value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

/* -------------------------------------------------------------------------- */
/*  Spell field -> level map (official sheet layout)                           */
/* -------------------------------------------------------------------------- */

/**
 * The official spell sheet numbers its spell-name fields (`Spells 1014` …)
 * rather than labelling them by level, so this reproduces the printed layout.
 * It is only a fallback: a spell whose name matches the SRD takes its level
 * from that data instead, which is right regardless of sheet revision.
 */
const SPELL_FIELD_RANGES: { level: number; ids: number[] }[] = [
  { level: 0, ids: [1014, ...range(1016, 1022)] },
  { level: 1, ids: [1015, ...range(1023, 1033)] },
  { level: 2, ids: range(1034, 1046) },
  { level: 3, ids: range(1047, 1059) },
  { level: 4, ids: range(1060, 1072) },
  { level: 5, ids: range(1073, 1081) },
  { level: 6, ids: range(1082, 1090) },
  { level: 7, ids: range(1091, 1099) },
  { level: 8, ids: range(10100, 10106) },
  { level: 9, ids: range(10107, 10113) },
];

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

const SPELL_FIELD_LEVELS = new Map<number, number>();
for (const { level, ids } of SPELL_FIELD_RANGES) {
  for (const id of ids) SPELL_FIELD_LEVELS.set(id, level);
}

/**
 * The spell-name field ids printed at a given level, in sheet order. The export
 * side names its fields from this so a sheet Sanctum writes reads back at the
 * right level here — the two must stay in lockstep.
 */
export function spellFieldIds(level: number): number[] {
  return SPELL_FIELD_RANGES.find((r) => r.level === level)?.ids ?? [];
}

const SRD_BY_NAME = new Map(SRD_SPELLS.map((s) => [s.name.toLowerCase(), s]));

/* -------------------------------------------------------------------------- */
/*  Sheet -> Sanctum character                                                 */
/* -------------------------------------------------------------------------- */

export type ParsedSpell = {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  isConcentration: boolean;
};

export type ParsedInventoryItem = {
  name: string;
  quantity: number;
  description: string;
  isEquipped: boolean;
};

export type ParsedCharacterSheet = {
  character: {
    name: string;
    race: string;
    class: string;
    subclass: string;
    level: number;
    background: string;
    alignment: string;
    experiencePoints: number;
    proficiencyBonus: number;
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    hpMax: number;
    hpCurrent: number;
    hpTemp: number;
    armorClass: number;
    speed: number;
    initiativeBonus: number;
    passivePerception: number;
    savingThrowProficiencies: string[];
    skillProficiencies: string[];
    languages: string[];
    featuresAndTraits: FeatureEntry[];
    multiclassInfo: MulticlassEntry[];
    ideals: string;
    bonds: string;
    flaws: string;
    personalityTraits: string;
    currency: { pp: number; gp: number; ep: number; sp: number; cp: number };
    hitDiceTotal: number;
    hitDiceUsed: number;
    notes: string;
  };
  spells: ParsedSpell[];
  spellSlots: { slotLevel: number; total: number; used: number }[];
  inventory: ParsedInventoryItem[];
  warnings: string[];
  fieldCount: number;
};

/** "Wizard 5", "Fighter 3 / Rogue 2", "Level 4 Bard (Lore)". */
function parseClassLevel(raw: string | undefined): {
  className: string;
  subclass: string;
  level: number;
  multiclass: MulticlassEntry[];
} {
  const fallback = { className: "", subclass: "", level: 1, multiclass: [] as MulticlassEntry[] };
  if (!raw) return fallback;

  const parts = raw.split(/[/,;]|\s+and\s+/i).map((p) => p.trim()).filter(Boolean);
  const entries: MulticlassEntry[] = [];

  for (const part of parts) {
    const subclassMatch = /\(([^)]+)\)/.exec(part);
    const withoutSubclass = part.replace(/\([^)]*\)/g, " ");
    const levelMatch = /(\d{1,2})/.exec(withoutSubclass);
    const name = withoutSubclass
      .replace(/\blevel\b/gi, " ")
      .replace(/\d+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!name && !levelMatch) continue;
    entries.push({
      className: name.slice(0, 60),
      subclass: subclassMatch ? subclassMatch[1].trim().slice(0, 60) : undefined,
      level: levelMatch ? clamp(Number(levelMatch[1]), 1, 20) : 1,
    });
  }

  if (entries.length === 0) return fallback;
  const total = clamp(
    entries.reduce((sum, e) => sum + e.level, 0),
    1,
    20,
  );
  return {
    className: entries[0].className,
    subclass: entries[0].subclass ?? "",
    level: total,
    // A single class is already captured by class/subclass/level.
    multiclass: entries.length > 1 ? entries : [],
  };
}

/** Split a blob of sheet text into feature entries ("Name. Description"). */
function toFeatures(blob: string, source: string): FeatureEntry[] {
  return blob
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .slice(0, 60)
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        return {
          name: lines[0].replace(/[.:]\s*$/, "").slice(0, 120),
          description: lines.slice(1).join("\n").slice(0, 4000),
          source,
        };
      }
      const inline = /^(.{2,60}?)[.:]\s+([\s\S]+)$/.exec(lines[0]);
      if (inline) {
        return {
          name: inline[1].trim().slice(0, 120),
          description: inline[2].trim().slice(0, 4000),
          source,
        };
      }
      return { name: lines[0].slice(0, 120), description: "", source };
    });
}

/** "2x Torch", "Torch (10)", "Rope, hempen (50 feet)" -> name + quantity. */
function toInventoryItem(line: string, isEquipped: boolean): ParsedInventoryItem | null {
  const text = line.replace(/^[-*•]\s*/, "").trim();
  if (!text) return null;

  let quantity = 1;
  let name = text;

  const leading = /^(\d{1,3})\s*[x×]?\s+(.*)$/i.exec(text);
  const trailing = /^(.*?)\s*[x×(]\s*(\d{1,3})\s*\)?$/i.exec(text);
  if (leading) {
    quantity = Number(leading[1]);
    name = leading[2];
  } else if (trailing && Number(trailing[2]) > 1) {
    quantity = Number(trailing[2]);
    name = trailing[1];
  }

  name = name.trim();
  if (!name) return null;
  return {
    name: name.slice(0, 120),
    quantity: clamp(quantity, 0, 999),
    description: "",
    isEquipped,
  };
}

function appendSection(parts: string[], heading: string, body: string | undefined) {
  if (body && body.trim()) parts.push(`## ${heading}\n\n${body.trim()}`);
}

/**
 * Map extracted form fields onto Sanctum's character model. Anything we cannot
 * confidently place still reaches the character — free-text sheet boxes are
 * appended to the character's notes so the import is lossless.
 */
export function mapSheetToCharacter(fields: SheetFields): ParsedCharacterSheet {
  const warnings: string[] = [];

  const name =
    pick(fields, ["CharacterName", "CharacterName 2", "Character Name", "charname", "PC Name", "name"]) ??
    "Imported character";

  const classLevelRaw = pick(fields, ["ClassLevel", "Class Level", "Class and Level", "class", "classes"]);
  const { className, subclass, level: parsedLevel, multiclass } = parseClassLevel(classLevelRaw);
  const level = clamp(pickInt(fields, ["level", "totallevel", "CharacterLevel"]) ?? parsedLevel, 1, 20);

  // Ability scores: some sheets swap the score and modifier boxes, so prefer
  // whichever of the pair reads like a score (1-30, unsigned).
  const abilities = {} as Record<AbilityKey, number>;
  for (const ability of ABILITIES) {
    const scoreRaw = pick(fields, [ability.short, ability.label, `${ability.label} Score`]);
    const modRaw = pick(fields, [`${ability.short}mod`, `${ability.label}mod`, `${ability.short} mod`]);
    const score = parseSigned(scoreRaw);
    const mod = parseSigned(modRaw);
    const isScore = (v: number | undefined, raw: string | undefined): v is number =>
      v !== undefined && v >= 1 && v <= 30 && !/^[+\-−–]/.test((raw ?? "").trim());

    if (isScore(score, scoreRaw)) abilities[ability.key] = score;
    else if (isScore(mod, modRaw)) abilities[ability.key] = mod;
    else if (mod !== undefined) abilities[ability.key] = clamp(10 + mod * 2, 1, 30);
    else abilities[ability.key] = 10;
  }

  const proficiencyBonus = clamp(
    pickInt(fields, ["ProfBonus", "Proficiency Bonus", "proficiencybonus"]) ??
      proficiencyBonusForLevel(level),
    2,
    9,
  );

  // The sheet prints total bonuses, not proficiency flags, so infer proficiency
  // by comparing the printed value against the bare ability modifier.
  const savingThrowProficiencies: string[] = [];
  for (const ability of ABILITIES) {
    const printed = parseSigned(
      pick(fields, [`ST ${ability.label}`, `${ability.label} Save`, `save${ability.short}`]),
    );
    if (printed === undefined) continue;
    if (printed - abilityModifier(abilities[ability.key]) >= proficiencyBonus) {
      savingThrowProficiencies.push(ability.key);
    }
  }

  const SKILL_FIELD_ALIASES: Record<string, string[]> = {
    animal_handling: ["Animal", "Animal Handling", "AnimalHandling"],
    sleight_of_hand: ["SleightofHand", "Sleight of Hand"],
  };
  const skillProficiencies: string[] = [];
  for (const skill of SKILLS) {
    const aliases = SKILL_FIELD_ALIASES[skill.key] ?? [skill.label, skill.key];
    const printed = parseSigned(pick(fields, aliases));
    if (printed === undefined) continue;
    if (printed - abilityModifier(abilities[skill.ability]) >= proficiencyBonus) {
      skillProficiencies.push(skill.key);
    }
  }

  const hpMax = clamp(pickInt(fields, ["HPMax", "HP Max", "Hit Point Maximum", "maxhp"]) ?? 0, 0, 999);
  const hpCurrent = clamp(
    pickInt(fields, ["HPCurrent", "HP Current", "Current Hit Points", "currenthp"]) ?? hpMax,
    0,
    999,
  );

  // "5d8" -> 5 dice; a bare number is already the count.
  const hitDiceTotalRaw = pick(fields, ["HDTotal", "Hit Dice Total", "HitDiceTotal"]) ?? "";
  const diceCount = /(\d+)\s*d/i.exec(hitDiceTotalRaw)?.[1];
  const hitDiceTotal = clamp(
    diceCount !== undefined ? Number(diceCount) : (parseSigned(hitDiceTotalRaw) ?? level),
    0,
    20,
  );
  const hitDiceRemaining = parseSigned(pick(fields, ["HD", "Hit Dice", "HitDice"]));
  const hitDiceUsed =
    hitDiceRemaining !== undefined && hitDiceRemaining <= hitDiceTotal
      ? clamp(hitDiceTotal - hitDiceRemaining, 0, hitDiceTotal)
      : 0;

  const proficienciesLang = pick(fields, ["ProficienciesLang", "Other Proficiencies and Languages", "proficiencies"]);
  const languages: string[] = LANGUAGES.filter((lang) =>
    new RegExp(`\\b${lang.replace(/\s+/g, "\\s+")}\\b`, "i").test(proficienciesLang ?? ""),
  );

  const featuresBlob = [
    pick(fields, ["Features and Traits", "FeaturesTraits", "Features & Traits"]),
    pick(fields, ["Feat+Traits", "FeatTraits", "Features and Traits 2"]),
  ]
    .filter(Boolean)
    .join("\n\n");
  const featuresAndTraits = featuresBlob ? toFeatures(featuresBlob, "Character sheet") : [];

  /* --- equipment ----------------------------------------------------------- */
  const inventory: ParsedInventoryItem[] = [];
  for (let i = 1; i <= 3; i++) {
    const suffix = i === 1 ? "" : ` ${i}`;
    const weapon = pick(fields, [`Wpn Name${suffix}`, `Weapon Name${suffix}`, `Wpn${i} Name`]);
    if (!weapon) continue;
    const atk = pick(fields, [`Wpn${i} AtkBonus`, `Wpn${i} Atk Bonus`, `Wpn AtkBonus${suffix}`]);
    const dmg = pick(fields, [`Wpn${i} Damage`, `Wpn Damage${suffix}`]);
    inventory.push({
      name: weapon.slice(0, 120),
      quantity: 1,
      description: [atk ? `Attack ${atk}` : null, dmg ? `Damage ${dmg}` : null]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 5000),
      isEquipped: true,
    });
  }
  const equipmentBlob = pick(fields, ["Equipment", "equipmentlist"]);
  if (equipmentBlob) {
    for (const line of equipmentBlob.split(/[\n;]/).slice(0, 100)) {
      const item = toInventoryItem(line, false);
      if (item) inventory.push(item);
    }
  }

  /* --- spells -------------------------------------------------------------- */
  const spells: ParsedSpell[] = [];
  const seenSpells = new Set<string>();
  /** Non-SRD spells whose level came from the printed layout rather than data. */
  let guessedLevels = 0;
  /** Non-SRD spells in a field we don't recognise at all — level defaults to 0. */
  let unknownLevels = 0;

  for (const [key, value] of fields.text) {
    const match = /^spells(\d+)$/.exec(key);
    if (!match) continue;
    const spellName = value.trim();
    if (!spellName || spellName.length > 80) continue;
    const dedupeKey = spellName.toLowerCase();
    if (seenSpells.has(dedupeKey)) continue;
    seenSpells.add(dedupeKey);

    const srd = SRD_BY_NAME.get(dedupeKey);
    const mapped = SPELL_FIELD_LEVELS.get(Number(match[1]));
    if (!srd) {
      if (mapped === undefined) unknownLevels++;
      else guessedLevels++;
    }

    spells.push({
      name: spellName.slice(0, 120),
      level: srd?.level ?? mapped ?? 0,
      school: srd?.school ?? "",
      castingTime: srd?.castingTime ?? "",
      range: srd?.range ?? "",
      components: srd?.components ?? "",
      duration: srd?.duration ?? "",
      description: srd?.description?.slice(0, 10000) ?? "",
      isConcentration: srd?.isConcentration ?? false,
    });
  }
  spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  // Slot boxes are read in field order and mapped to levels 1-9, which survives
  // sheet revisions better than hard-coding their names.
  const slotNumbers = (prefix: string) =>
    [...fields.text.entries()]
      .map(([key, value]) => {
        const m = new RegExp(`^${prefix}(\\d+)$`).exec(key);
        return m ? { order: Number(m[1]), value: parseSigned(value) ?? 0 } : null;
      })
      .filter((v): v is { order: number; value: number } => v !== null)
      .sort((a, b) => a.order - b.order);

  const totals = slotNumbers("slotstotal");
  const remaining = slotNumbers("slotsremaining");
  const spellSlots = totals
    .slice(0, 9)
    .map((slot, i) => {
      const total = clamp(slot.value, 0, 20);
      const left = clamp(remaining[i]?.value ?? total, 0, total);
      return { slotLevel: i + 1, total, used: total - left };
    })
    .filter((slot) => slot.total > 0);

  /* --- notes --------------------------------------------------------------- */
  const noteParts: string[] = [];
  appendSection(noteParts, "Attacks & Spellcasting", pick(fields, ["AttacksSpellcasting", "Attacks and Spellcasting"]));
  appendSection(noteParts, "Other Proficiencies & Languages", proficienciesLang);
  appendSection(noteParts, "Backstory", pick(fields, ["Backstory", "Character Backstory"]));
  appendSection(noteParts, "Allies & Organizations", pick(fields, ["Allies", "AlliesOrganizations", "FactionName"]));
  appendSection(noteParts, "Treasure", pick(fields, ["Treasure"]));

  const appearance = ["Age", "Height", "Weight", "Eyes", "Skin", "Hair"]
    .map((label) => {
      const value = pick(fields, [label]);
      return value ? `- **${label}:** ${value}` : null;
    })
    .filter(Boolean)
    .join("\n");
  appendSection(noteParts, "Appearance", appearance);

  const spellcastingClass = pick(fields, ["Spellcasting Class 2", "SpellcastingClass"]);
  const spellSaveDc = pick(fields, ["SpellSaveDC  2", "SpellSaveDC", "Spell Save DC"]);
  const spellAtk = pick(fields, ["SpellAtkBonus 2", "SpellAtkBonus", "Spell Attack Bonus"]);
  appendSection(
    noteParts,
    "Spellcasting",
    [
      spellcastingClass ? `- **Class:** ${spellcastingClass}` : null,
      spellSaveDc ? `- **Spell save DC:** ${spellSaveDc}` : null,
      spellAtk ? `- **Spell attack bonus:** ${spellAtk}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  /* --- warnings ------------------------------------------------------------ */
  if (!classLevelRaw) warnings.push("No class/level field found — set the class manually after import.");
  if (hpMax === 0) warnings.push("No hit points found on the sheet.");
  if (guessedLevels > 0) {
    warnings.push(
      `${guessedLevels} spell${guessedLevels === 1 ? " isn't" : "s aren't"} in the SRD list, so ${guessedLevels === 1 ? "its" : "their"} level is a best guess from where ${guessedLevels === 1 ? "it sits" : "they sit"} on the sheet — check before playing.`,
    );
  }
  if (unknownLevels > 0) {
    warnings.push(
      `${unknownLevels} spell${unknownLevels === 1 ? "" : "s"} came from a field Sanctum doesn't recognise and ${unknownLevels === 1 ? "was" : "were"} imported as level 0 — set the level manually.`,
    );
  }
  if (spells.length > 0) {
    warnings.push("Prepared/known checkmarks aren't read from the PDF — mark prepared spells after import.");
  }

  return {
    character: {
      name: name.slice(0, 120),
      race: (pick(fields, ["Race ", "Race", "Species"]) ?? "").slice(0, 80),
      class: className.slice(0, 80),
      subclass: subclass.slice(0, 80),
      level,
      background: (pick(fields, ["Background"]) ?? "").slice(0, 120),
      alignment: (pick(fields, ["Alignment"]) ?? "").slice(0, 60),
      experiencePoints: clamp(pickInt(fields, ["XP", "Experience Points", "EXP"]) ?? 0, 0, 400000),
      proficiencyBonus,
      str: abilities.str,
      dex: abilities.dex,
      con: abilities.con,
      int: abilities.int,
      wis: abilities.wis,
      cha: abilities.cha,
      hpMax,
      hpCurrent,
      hpTemp: clamp(pickInt(fields, ["HPTemp", "Temporary Hit Points"]) ?? 0, 0, 999),
      armorClass: clamp(pickInt(fields, ["AC", "Armor Class", "ArmorClass"]) ?? 10, 0, 40),
      speed: clamp(pickInt(fields, ["Speed"]) ?? 30, 0, 500),
      initiativeBonus: parseSigned(pick(fields, ["Initiative", "InitiativeBonus"])) ?? abilityModifier(abilities.dex),
      passivePerception: clamp(pickInt(fields, ["Passive", "Passive Perception"]) ?? 10, 0, 40),
      savingThrowProficiencies,
      skillProficiencies,
      languages,
      featuresAndTraits,
      multiclassInfo: multiclass,
      ideals: (pick(fields, ["Ideals"]) ?? "").slice(0, 2000),
      bonds: (pick(fields, ["Bonds"]) ?? "").slice(0, 2000),
      flaws: (pick(fields, ["Flaws"]) ?? "").slice(0, 2000),
      personalityTraits: (pick(fields, ["PersonalityTraits ", "PersonalityTraits", "Personality Traits"]) ?? "").slice(0, 2000),
      currency: {
        pp: clamp(pickInt(fields, ["PP"]) ?? 0, 0, 999999),
        gp: clamp(pickInt(fields, ["GP"]) ?? 0, 0, 999999),
        ep: clamp(pickInt(fields, ["EP"]) ?? 0, 0, 999999),
        sp: clamp(pickInt(fields, ["SP"]) ?? 0, 0, 999999),
        cp: clamp(pickInt(fields, ["CP"]) ?? 0, 0, 999999),
      },
      hitDiceTotal,
      hitDiceUsed,
      notes: noteParts.join("\n\n").slice(0, 20000),
    },
    spells,
    spellSlots,
    inventory: inventory.slice(0, 120),
    warnings,
    fieldCount: fields.names.length,
  };
}
