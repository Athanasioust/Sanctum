"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";

/**
 * Open a panel in a window of its own — for a second monitor. In the desktop
 * app this becomes a native window on the same local server (see
 * electron/main.js); in a browser it's an ordinary popup.
 */
export function PopOutButton({
  href,
  name,
  width = 960,
  height = 900,
  onPopOut,
}: {
  href: string;
  /** Window name, so popping out twice focuses the same window in a browser. */
  name: string;
  width?: number;
  height?: number;
  /** Runs just before the window opens — e.g. to hand audio over to it. */
  onPopOut?: () => void;
}) {
  const t = useT();
  return (
    <Button
      variant="outline"
      onClick={() => {
        onPopOut?.();
        window.open(href, name, `popup,width=${width},height=${height}`);
      }}
      title={t("popout.hint")}
    >
      <ExternalLink className="size-4" /> {t("popout.button")}
    </Button>
  );
}
