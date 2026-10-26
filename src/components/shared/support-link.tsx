"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";
import { KOFI_URL } from "@/lib/support";
import { cn } from "@/lib/utils";

/**
 * A quiet "Support on Ko-fi" link under the attribution badge. It glows softly
 * for the first few launches so it gets noticed once, then sits still. Opens in
 * the default browser (the desktop app sends outside links there).
 */
export function SupportLink({ className }: { className?: string }) {
  const t = useT();
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ glow: boolean }>("/api/support-nudge")
      .then((data) => {
        if (!cancelled) setGlow(data.glow);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        setGlow(false);
        api.post("/api/support-nudge").catch(() => {});
      }}
      title={t("support.hint")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-amber-300",
        glow && "support-glow text-amber-300",
        className,
      )}
    >
      <Heart className={cn("size-3.5", glow ? "fill-amber-400/40 text-amber-400" : "text-amber-400/70")} />
      {t("support.kofi")}
    </a>
  );
}
