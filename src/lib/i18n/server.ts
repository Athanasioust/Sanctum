import "server-only";
import { cookies } from "next/headers";
import { createTranslator, getDictionary, type Translate } from "./index";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./locales";

/** The language chosen in Settings, from the cookie both sides can read. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Locale plus a translator, for server components rendering UI chrome. */
export async function getTranslation(): Promise<{ locale: Locale; t: Translate }> {
  const locale = await getLocale();
  return { locale, t: createTranslator(getDictionary(locale)) };
}
