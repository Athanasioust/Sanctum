import { cookies, headers } from "next/headers";
import { LockKeyhole } from "lucide-react";
import { createTranslator, getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";

/**
 * Shown to another device whose player-view link has no valid share token —
 * an old QR code after the DM regenerated it, or a bare address typed by hand.
 * The LAN guard (scripts/lan-guard.cjs) serves this page in the request's
 * place. It reads no campaign data at all.
 *
 * A player's phone has never picked a language in Sanctum, so after the
 * language cookie this falls back to the browser's own preference.
 */
async function pickLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

export default async function LinkExpiredPage() {
  const t = createTranslator(getDictionary(await pickLocale()));
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
        <LockKeyhole className="mx-auto size-8 text-primary" />
        <h1 className="mt-3 font-heading text-xl font-semibold" data-testid="link-expired">
          {t("screen.linkExpired.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("screen.linkExpired.body")}</p>
      </div>
    </main>
  );
}
