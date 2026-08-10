"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Music, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChannelMixer } from "@/components/soundpad/channel-mixer";
import { useSoundpad } from "@/components/soundpad/soundpad-context";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { SoundAsset } from "@/db/schema";

/** Dispatched by the soundpad page when its library changes. */
export const SOUND_LIBRARY_CHANGED_EVENT = "sanctum:sound-library-changed";

/**
 * The floating mixer, sitting beside the dice roller and rules reference.
 * Available on every campaign page so the DM can duck the music mid-scene
 * without leaving the combat tracker.
 */
export function SoundpadButton({ campaignId }: { campaignId: number }) {
  const soundpad = useSoundpad();
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<SoundAsset[]>([]);

  const load = useCallback(async () => {
    try {
      setAssets(await api.get<SoundAsset[]>(`/api/sound-assets?campaignId=${campaignId}`));
    } catch {
      // Leave the last known library in place.
    }
  }, [campaignId]);

  // Refresh when the soundpad page edits the library. The initial load happens
  // when the panel is opened (see onOpenChange) rather than on mount, so the
  // library is only fetched when it's about to be shown.
  useEffect(() => {
    function onChanged() {
      void load();
    }
    window.addEventListener(SOUND_LIBRARY_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(SOUND_LIBRARY_CHANGED_EVENT, onChanged);
  }, [load]);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void load();
      }}
    >
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" title="Soundpad">
          <Music className={cn("size-4", soundpad?.anyPlaying && "text-primary")} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
        <SheetHeader className="mb-2">
          <SheetTitle className="flex items-center gap-2">
            <Music className="size-4 text-primary" /> Soundpad
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-4">
          <ChannelMixer assets={assets} />
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/campaign/${campaignId}/soundpad`} onClick={() => setOpen(false)}>
              <Settings2 className="size-3.5" /> Manage sounds
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
