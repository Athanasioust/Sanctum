"use client";

import { useState } from "react";
import { CircleHelp, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/components/i18n/i18n-provider";
import { useTour } from "@/components/tour/tour-provider";
import { WhatsNewDialog } from "@/components/shared/whats-new";
import { CHANGELOG } from "@/lib/changelog";

/** The Help button in the campaign toolbar: the way back into the tour. */
export function HelpMenu() {
  const t = useT();
  const { startTour, starting } = useTour();
  const [whatsNew, setWhatsNew] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title={t("help.title")} aria-label={t("help.title")} data-tour="help">
            <CircleHelp className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
          <DropdownMenuLabel>{t("help.title")}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={startTour} disabled={starting}>
            <Compass className="size-4" /> {t("help.takeTour")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setWhatsNew(true)}>
            <Sparkles className="size-4" /> {t("whatsNew.button")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <WhatsNewDialog open={whatsNew} entries={CHANGELOG} onOpenChange={setWhatsNew} />
    </>
  );
}

/** "Take the tour" as a plain button, for Settings and the campaigns list. */
export function TakeTourButton({ variant = "outline" }: { variant?: "outline" | "ghost" }) {
  const t = useT();
  const { startTour, starting } = useTour();
  return (
    <Button variant={variant} onClick={startTour} disabled={starting}>
      <Compass className="size-4" /> {starting ? t("common.loading") : t("help.takeTour")}
    </Button>
  );
}
