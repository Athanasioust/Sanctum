"use client";

import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";
import { useTour } from "@/components/tour/tour-provider";

/** Loads the bundled sample campaign (or reopens the one already loaded). */
export function SampleCampaignButton({
  variant = "outline",
}: {
  variant?: "default" | "outline" | "ghost";
}) {
  const t = useT();
  const { openSample, starting } = useTour();
  return (
    <Button variant={variant} onClick={() => void openSample()} disabled={starting}>
      <BookOpen className="size-4" />
      {starting ? t("common.loading") : t("sample.load")}
    </Button>
  );
}
