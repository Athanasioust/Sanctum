"use client";

import { Music, Pause, Play, Square, Volume2, Wind, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOOP_CHANNELS, useSoundpad } from "@/components/soundpad/soundpad-context";
import { cn } from "@/lib/utils";
import type { SoundAsset, SoundCategory } from "@/db/schema";

export const CHANNEL_META: Record<
  SoundCategory,
  { label: string; icon: typeof Music; hint: string }
> = {
  music: { label: "Music", icon: Music, hint: "A looping score under the scene" },
  ambience: { label: "Ambience", icon: Wind, hint: "Rain, a crowd, a crackling fire" },
  sfx: { label: "SFX", icon: Zap, hint: "One-shot stingers you fire by hand" },
};

/**
 * The channel faders. Rendered both in the floating soundpad panel and on the
 * soundpad page — both read the same engine, so they always agree.
 */
export function ChannelMixer({ assets }: { assets: SoundAsset[] }) {
  const soundpad = useSoundpad();
  if (!soundpad) return null;

  return (
    <div className="space-y-3">
      {LOOP_CHANNELS.map((category) => (
        <LoopChannel
          key={category}
          category={category}
          assets={assets.filter((a) => a.category === category)}
        />
      ))}

      <SfxChannel assets={assets.filter((a) => a.category === "sfx")} />

      {soundpad.anyPlaying && (
        <Button variant="outline" size="sm" className="w-full" onClick={soundpad.stopAll}>
          <Square className="size-3.5" /> Stop everything
        </Button>
      )}
    </div>
  );
}

function LoopChannel({
  category,
  assets,
}: {
  category: SoundCategory;
  assets: SoundAsset[];
}) {
  const soundpad = useSoundpad();
  if (!soundpad) return null;

  const state = soundpad.channels[category];
  const meta = CHANNEL_META[category];

  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        state.playing ? "border-primary/50 bg-primary/5" : "border-border bg-card",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <meta.icon className={cn("size-4", state.playing ? "text-primary" : "text-muted-foreground")} />
        <span className="text-sm font-medium">{meta.label}</span>
        {state.playing && (
          <span className="ml-auto text-xs text-primary">playing</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={state.asset ? String(state.asset.id) : "none"}
          onValueChange={(v) =>
            soundpad.play(category, v === "none" ? null : assets.find((a) => String(a.id) === v) ?? null)
          }
        >
          <SelectTrigger className="h-8 min-w-0 flex-1">
            <SelectValue placeholder={assets.length ? "Choose a track" : "Nothing uploaded"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— none —</SelectItem>
            {assets.map((asset) => (
              <SelectItem key={asset.id} value={String(asset.id)}>
                {asset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="icon-sm"
          variant={state.playing ? "default" : "outline"}
          onClick={() => soundpad.toggle(category)}
          disabled={!state.asset}
          aria-label={state.playing ? `Pause ${meta.label}` : `Play ${meta.label}`}
        >
          {state.playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </Button>
        {state.asset && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => soundpad.play(category, null)}
            aria-label={`Clear ${meta.label}`}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <Volume2 className="size-3.5 shrink-0 text-muted-foreground" />
        <Slider
          value={[Math.round(state.volume * 100)]}
          min={0}
          max={100}
          step={1}
          onValueChange={([v]) => soundpad.setVolume(category, v / 100)}
          aria-label={`${meta.label} volume`}
        />
        <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {Math.round(state.volume * 100)}
        </span>
      </div>
    </div>
  );
}

function SfxChannel({ assets }: { assets: SoundAsset[] }) {
  const soundpad = useSoundpad();
  if (!soundpad) return null;

  const meta = CHANNEL_META.sfx;
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-2">
        <meta.icon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">{meta.label}</span>
      </div>

      {assets.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Upload sounds tagged SFX to fire them here.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {assets.map((asset) => (
            <Button
              key={asset.id}
              size="sm"
              variant="outline"
              onClick={() => soundpad.fire(asset)}
            >
              {asset.name}
            </Button>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        <Volume2 className="size-3.5 shrink-0 text-muted-foreground" />
        <Slider
          value={[Math.round(soundpad.channels.sfx.volume * 100)]}
          min={0}
          max={100}
          step={1}
          onValueChange={([v]) => soundpad.setVolume("sfx", v / 100)}
          aria-label="SFX volume"
        />
        <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {Math.round(soundpad.channels.sfx.volume * 100)}
        </span>
      </div>
    </div>
  );
}
