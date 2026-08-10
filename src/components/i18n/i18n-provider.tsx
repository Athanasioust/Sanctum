"use client";

import { createContext, useContext, useMemo } from "react";
import { createTranslator, getDictionary, type Translate } from "@/lib/i18n";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

/**
 * Hands the server-chosen locale to client components. The dictionaries are
 * bundled, so this only needs to carry the locale code, not the strings.
 */
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** `const t = useT()` then `t("nav.combat")`. */
export function useT(): Translate {
  const locale = useLocale();
  return useMemo(() => createTranslator(getDictionary(locale)), [locale]);
}
