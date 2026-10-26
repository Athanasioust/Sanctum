/**
 * Sanctum's i18n layer.
 *
 * Deliberately not react-i18next: its hooks only run in client components, and
 * Sanctum renders its page chrome in React Server Components. This is a plain
 * dictionary lookup instead, usable from both — the server reads the locale
 * cookie and translates directly, and a small context hands the same dictionary
 * to client components.
 *
 * Dictionaries are static JSON imported at build time, so nothing is fetched at
 * runtime and the app stays fully offline.
 */

import en from "./dictionaries/en.json";
import de from "./dictionaries/de.json";
import fr from "./dictionaries/fr.json";
import es from "./dictionaries/es.json";
import it from "./dictionaries/it.json";
import pt from "./dictionaries/pt.json";
import { DEFAULT_LOCALE, type Locale } from "./locales";

export type Dictionary = Record<string, string>;

const DICTIONARIES: Record<Locale, Dictionary> = { en, de, fr, es, it, pt };

/** Every key that exists, so a typo in a `t()` call is a type error. */
export type TranslationKey = keyof typeof en;

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

export type Translate = (key: TranslationKey) => string;

/**
 * Build a lookup for a dictionary. A key the chosen language hasn't translated
 * yet falls back to English rather than showing the raw key, so a partial
 * translation degrades to a mixed-language UI instead of a broken one.
 */
export function createTranslator(dictionary: Dictionary): Translate {
  return (key) => dictionary[key] ?? en[key] ?? key;
}
