/**
 * Minimal YAML frontmatter reader for imported markdown.
 *
 * Obsidian vaults are freeform, so this deliberately understands only the
 * shapes people actually put in note frontmatter — scalars, inline lists and
 * block lists — and never evaluates anything. Unparseable lines are skipped
 * rather than throwing, because a bad frontmatter block must not cost the user
 * the note itself.
 */

export type FrontmatterValue = string | number | boolean | string[];
export type Frontmatter = Record<string, FrontmatterValue>;

const MAX_KEYS = 200;
const FENCE = /^---[ \t]*$/;

function unquote(raw: string): string {
  const value = raw.trim();
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

function coerce(raw: string): FrontmatterValue {
  const value = unquote(raw);
  if (value === "") return "";
  if (/^(true|yes)$/i.test(value)) return true;
  if (/^(false|no)$/i.test(value)) return false;
  // Only plain numbers — "5e" or "1d8" must stay strings.
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function parseInlineList(raw: string): string[] {
  return raw
    .slice(1, -1)
    .split(",")
    .map((part) => unquote(part))
    .filter((part) => part !== "");
}

/**
 * Split a document into its frontmatter map and the remaining body. Documents
 * without a frontmatter block come back with an empty map and an unchanged body.
 */
export function parseFrontmatter(source: string): {
  data: Frontmatter;
  body: string;
} {
  const text = source.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  if (!FENCE.test(lines[0] ?? "")) return { data: {}, body: text };

  const closing = lines.findIndex((line, i) => i > 0 && FENCE.test(line));
  if (closing === -1) return { data: {}, body: text };

  const data: Frontmatter = {};
  let listKey: string | null = null;

  for (const line of lines.slice(1, closing)) {
    if (Object.keys(data).length >= MAX_KEYS) break;
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;

    // A block-list item belongs to the key that opened the list above it.
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem && listKey) {
      const existing = data[listKey];
      const value = unquote(listItem[1]);
      if (value !== "") {
        data[listKey] = Array.isArray(existing) ? [...existing, value] : [value];
      }
      continue;
    }

    // Indented `key: value` lines are nested maps, which we don't model — skip
    // them rather than flattening a child key into the top level.
    if (/^\s/.test(line)) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    if (key === "") continue;
    const rest = line.slice(separator + 1).trim();

    if (rest === "") {
      // `key:` on its own opens a block list (or an empty value).
      data[key] = [];
      listKey = key;
      continue;
    }
    listKey = null;
    data[key] = rest.startsWith("[") && rest.endsWith("]")
      ? parseInlineList(rest)
      : coerce(rest);
  }

  return { data, body: lines.slice(closing + 1).join("\n").replace(/^\n+/, "") };
}

/** First non-empty string value among `keys`, from scalars or single-item lists. */
export function fmString(fm: Frontmatter, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = fm[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value) && value.length > 0) return value[0];
  }
  return undefined;
}

export function fmNumber(fm: Frontmatter, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = fm[key];
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const match = /-?\d+/.exec(value);
      if (match) return Number(match[0]);
    }
  }
  return undefined;
}

export function fmBoolean(fm: Frontmatter, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = fm[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (/^(true|yes)$/i.test(value.trim())) return true;
      if (/^(false|no)$/i.test(value.trim())) return false;
    }
  }
  return undefined;
}

/** Values as a list — accepts real lists or comma-separated strings. */
export function fmList(fm: Frontmatter, keys: string[]): string[] | undefined {
  for (const key of keys) {
    const value = fm[key];
    if (Array.isArray(value)) {
      const items = value.map((v) => v.trim()).filter(Boolean);
      if (items.length) return items;
    }
    if (typeof value === "string" && value.trim() !== "") {
      return value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return undefined;
}
