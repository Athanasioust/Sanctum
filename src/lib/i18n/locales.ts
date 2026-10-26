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
  // Spanish, Italian and Portuguese started as machine-translated baselines
  // in 0.6 and are open to refinement by native speakers — fix a string in
  // src/lib/i18n/dictionaries/<code>.json. Missing keys fall back to English.
  { code: "es", label: "Español", english: "Spanish" },
  { code: "it", label: "Italiano", english: "Italian" },
  { code: "pt", label: "Português", english: "Portuguese" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie the chosen language is stored in, readable by both server and client. */
export const LOCALE_COOKIE = "sanctum_locale";

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((l) => l.code === value);
}
