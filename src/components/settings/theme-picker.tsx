"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Palette } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/components/i18n/i18n-provider";
import { THEMES, THEME_COOKIE, type ThemeDef } from "@/lib/themes";
import { cn } from "@/lib/utils";

/** Remember the theme and show it at once, ahead of the server re-render. */
function applyTheme(theme: ThemeDef) {
  // A year, path-wide, lax: a display preference, never sent anywhere.
  document.cookie = `${THEME_COOKIE}=${theme.id}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.dataset.theme = theme.id;
  document.documentElement.dataset.mode = theme.mode;
}

/**
 * Colour theme picker. Like the language, the choice is a cookie: the next
 * server render puts it on <html>. The attributes are also set right away so
 * the change shows before the refresh lands.
 */
export function ThemePicker({ current }: { current: string }) {
  const router = useRouter();
  const t = useT();
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();

  function choose(theme: ThemeDef) {
    if (theme.id === value) return;
    setValue(theme.id);
    applyTheme(theme);
    startTransition(() => {
      router.refresh();
      toast.success(t("settings.themeSaved"));
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
        <Palette className="size-4 text-primary" /> {t("settings.theme")}
      </h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("settings.themeHint")}</p>
      <div role="radiogroup" aria-label={t("settings.theme")} className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((theme) => {
          const selected = theme.id === value;
          const [bg, card, primary] = theme.swatch;
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={pending}
              onClick={() => choose(theme)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
              )}
            >
              {/* A tiny preview of the theme: page, card and accent. */}
              <span
                aria-hidden="true"
                className="flex h-10 w-14 shrink-0 items-end gap-1 rounded-md border border-border p-1.5"
                style={{ backgroundColor: bg }}
              >
                <span className="h-full flex-1 rounded-sm" style={{ backgroundColor: card }} />
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: primary }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {t(theme.nameKey)}
                  {selected ? <Check className="size-3.5 text-primary" /> : null}
                </span>
                <span className="block text-xs text-muted-foreground">{t(theme.descKey)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
