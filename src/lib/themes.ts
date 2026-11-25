/**
 * Colour themes. Each one is a block of CSS variables in `globals.css`,
 * selected by `data-theme` on <html>; `data-mode` says whether it is dark,
 * light, or follows the system setting (which drives Tailwind's `dark:`).
 *
 * The choice lives in a cookie, like the language: the server reads it while
 * rendering <html>, so the right colours arrive with the first paint, and it
 * survives desktop launches (localStorage wouldn't: the desktop app's server
 * gets a new port, and so a new origin, every launch).
 */
import type { TranslationKey } from "@/lib/i18n";

export const THEME_COOKIE = "sanctum_theme";

export type ThemeMode = "dark" | "light" | "system";

export type ThemeDef = {
  id: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  mode: ThemeMode;
  /** Background, card and primary, for the picker's preview. */
  swatch: [string, string, string];
};

export const THEMES = [
  {
    id: "candlelight",
    nameKey: "theme.candlelight",
    descKey: "theme.candlelight.desc",
    mode: "dark",
    swatch: ["#0f0d0a", "#17140f", "#e6a83e"],
  },
  {
    id: "parchment",
    nameKey: "theme.parchment",
    descKey: "theme.parchment.desc",
    mode: "light",
    swatch: ["#f4ecd8", "#fbf6ea", "#8a3b12"],
  },
  {
    id: "arcane",
    nameKey: "theme.arcane",
    descKey: "theme.arcane.desc",
    mode: "dark",
    swatch: ["#0d0f1e", "#141731", "#8b7cf6"],
  },
  {
    id: "forest",
    nameKey: "theme.forest",
    descKey: "theme.forest.desc",
    mode: "dark",
    swatch: ["#0c120e", "#131c16", "#4fae6a"],
  },
  {
    id: "crimson",
    nameKey: "theme.crimson",
    descKey: "theme.crimson.desc",
    mode: "dark",
    swatch: ["#120c0d", "#1b1213", "#e05561"],
  },
  {
    id: "high-contrast",
    nameKey: "theme.highContrast",
    descKey: "theme.highContrast.desc",
    mode: "system",
    swatch: ["#000000", "#ffffff", "#ffd60a"],
  },
] as const satisfies readonly ThemeDef[];

export type ThemeId = (typeof THEMES)[number]["id"];

/** Candle gold, and what a fresh install gets. */
export const DEFAULT_THEME: ThemeId = "candlelight";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEMES.some((t) => t.id === value);
}

export function themeById(id: ThemeId): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
