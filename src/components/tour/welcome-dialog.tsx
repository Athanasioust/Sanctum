"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Plus, Swords } from "lucide-react";
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
import { useTour } from "@/components/tour/tour-provider";
import { WhatsNewOnLaunch } from "@/components/shared/whats-new";
import { OPEN_CREATE_CAMPAIGN_EVENT } from "@/components/campaigns/create-campaign-dialog";
import { api } from "@/lib/client";

/**
 * The two launch-time dialogs, coordinated so they never stack: the first-run
 * welcome is asked about first, and "What's new" is only consulted when the
 * welcome isn't being shown. Never on the player view or a pop-out window.
 */
export function LaunchDialogs() {
  const pathname = usePathname();
  const skip = pathname.startsWith("/screen") || pathname.startsWith("/popout");
  const [stage, setStage] = useState<"checking" | "welcome" | "whats-new">("checking");

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    api
      .get<{ show: boolean }>("/api/welcome")
      .then((d) => !cancelled && setStage(d.show ? "welcome" : "whats-new"))
      .catch(() => !cancelled && setStage("whats-new"));
    return () => {
      cancelled = true;
    };
  }, [skip]);

  if (stage === "welcome") return <WelcomeDialog />;
  if (stage === "whats-new") return <WhatsNewOnLaunch />;
  return null;
}

/**
 * Shown once, on a genuine fresh install. The server records it as seen the
 * moment it's offered, so closing it (X, Esc, outside click) is the same as
 * declining: it never comes back on its own. The tour stays in Help.
 */
function WelcomeDialog() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { startTour, starting } = useTour();
  const [open, setOpen] = useState(true);

  function takeTour() {
    setOpen(false);
    startTour();
  }

  function startOwn() {
    setOpen(false);
    if (pathname === "/") {
      // Let the welcome finish closing before the next dialog takes focus.
      setTimeout(() => window.dispatchEvent(new Event(OPEN_CREATE_CAMPAIGN_EVENT)), 150);
    } else {
      router.push("/");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Swords className="size-6" />
          </div>
          <DialogTitle className="font-heading text-2xl">{t("welcome.title")}</DialogTitle>
          <DialogDescription>{t("welcome.body")}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("welcome.tourHint")}</p>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={startOwn}>
            <Plus className="size-4" /> {t("welcome.startOwn")}
          </Button>
          <Button onClick={takeTour} disabled={starting} autoFocus>
            <Compass className="size-4" /> {t("welcome.takeTour")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
