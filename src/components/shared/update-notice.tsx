"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";

type UpdateInfo = { version: string; current: string; url: string };

// Let the page settle first: the check must never compete with startup.
const DELAY_MS = 4000;

/**
 * One quiet toast when a newer Sanctum is out — only if the DM opted in under
 * Settings (the server does nothing otherwise). Closing it is "not now";
 * "Skip this version" is for good. Any failure stays invisible.
 */
export function UpdateNoticeOnLaunch() {
  const t = useT();
  const pathname = usePathname();
  const skip = pathname.startsWith("/screen") || pathname.startsWith("/popout");

  useEffect(() => {
    if (skip) return;
    const timer = setTimeout(() => {
      api
        .get<{ update: UpdateInfo | null }>("/api/update-check/latest")
        .then(({ update }) => {
          if (!update) return;
          toast(t("update.available").replace("{version}", update.version), {
            description: t("update.current").replace("{version}", update.current),
            duration: Infinity,
            closeButton: true,
            action: {
              label: t("update.download"),
              // The desktop shell hands any external link to the default browser.
              onClick: () => window.open(update.url, "_blank", "noopener,noreferrer"),
            },
            cancel: {
              label: t("update.skip"),
              onClick: () => {
                api.put("/api/update-check", { skipVersion: update.version }).catch(() => {});
              },
            },
          });
        })
        .catch(() => {});
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [skip, t]);

  return null;
}
