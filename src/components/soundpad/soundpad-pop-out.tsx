"use client";

import { toast } from "sonner";
import { PopOutButton } from "@/components/shared/pop-out-button";
import { useSoundpad } from "@/components/soundpad/soundpad-context";
import { useT } from "@/components/i18n/i18n-provider";

/**
 * Pop the soundpad out. Playback moves with it: this window's engine stops so
 * the two windows never play over each other.
 */
export function SoundpadPopOut({ campaignId }: { campaignId: number }) {
  const t = useT();
  const soundpad = useSoundpad();
  return (
    <PopOutButton
      href={`/popout/soundpad/${campaignId}`}
      name={`sanctum-soundpad-${campaignId}`}
      width={900}
      height={820}
      onPopOut={() => {
        if (soundpad?.anyPlaying) {
          soundpad.stopAll();
          toast.info(t("popout.soundHandoff"));
        }
      }}
    />
  );
}
