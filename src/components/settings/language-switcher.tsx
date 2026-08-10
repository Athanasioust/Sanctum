"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/components/i18n/i18n-provider";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/lib/i18n/locales";

/**
 * Language picker.
 *
 * Writes the locale straight to a cookie rather than through an API route:
 * server components read it with `cookies()` on the next render, so a
 * `router.refresh()` is all it takes to re-render the whole app translated.
 */
export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const t = useT();
  const [value, setValue] = useState<Locale>(current);
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    const locale = next as Locale;
    setValue(locale);
    // A year, path-wide, lax: this is a display preference, never sent anywhere.
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.refresh();
      toast.success(t("settings.languageSaved"));
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
        <Languages className="size-4 text-primary" /> {t("settings.language")}
      </h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        {t("settings.languageHint")}
      </p>
      <Select value={value} onValueChange={change} disabled={pending}>
        <SelectTrigger className="mt-4 w-full sm:max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map((locale) => (
            <SelectItem key={locale.code} value={locale.code}>
              {locale.label}
              {locale.label !== locale.english && (
                <span className="ml-1.5 text-muted-foreground">({locale.english})</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
