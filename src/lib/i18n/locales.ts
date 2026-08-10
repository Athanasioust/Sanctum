/**
 * Supported UI languages.
 *
 * Only the app's own chrome is translated. Game rules text — SRD spells and
 * monsters, condition descriptions, class and species names — stays English,
 * because that is the language the books and every table's shorthand use.
 */
export const LOCALES = [
  { code: "en", label: "English", english: "English" },
  { code: "de", label: "Deutsch", english: "German" },
  { code: "fr", label: "Français", english: "French" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie the chosen language is stored in, readable by both server and client. */
export const LOCALE_COOKIE = "sanctum_locale";

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((l) => l.code === value);
}
