"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";
import { APP_VERSION, CHANGELOG, type ChangelogEntry } from "@/lib/changelog";

type WhatsNewState = { show: boolean; entries: ChangelogEntry[] };

/**
 * Shown once after an update: the highlights of every release since the last
 * one the DM dismissed. Never on the player view or a pop-out window — those
 * are other people's screens, or panels that should open straight to work.
 */
export function WhatsNewOnLaunch() {
  const pathname = usePathname();
  const [entries, setEntries] = useState<ChangelogEntry[] | null>(null);
  const skip = pathname.startsWith("/screen") || pathname.startsWith("/popout");

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    api
      .get<WhatsNewState>("/api/whats-new")
      .then((data) => {
        if (!cancelled && data.show) setEntries(data.entries);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [skip]);

  function dismiss() {
    setEntries(null);
    api.post("/api/whats-new").catch(() => {});
  }

  return (
    <WhatsNewDialog
      open={entries !== null}
      entries={entries ?? []}
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    />
  );
}

/** "What's new" on demand, from Settings: the full history. */
export function WhatsNewButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Sparkles className="size-4" /> {t("whatsNew.button")}
      </Button>
      <WhatsNewDialog open={open} entries={CHANGELOG} onOpenChange={setOpen} />
    </>
  );
}

function WhatsNewDialog({
  open,
  entries,
  onOpenChange,
}: {
  open: boolean;
  entries: ChangelogEntry[];
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            {t("whatsNew.title").replace("{version}", APP_VERSION)}
          </DialogTitle>
          <DialogDescription>{t("whatsNew.description")}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <section key={entry.version}>
              <h3 className="mb-2 flex items-baseline gap-2 font-heading font-semibold">
                {entry.version}
                <span className="text-xs font-normal text-muted-foreground">{entry.date}</span>
              </h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground marker:text-primary">
                {entry.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t("whatsNew.dismiss")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
