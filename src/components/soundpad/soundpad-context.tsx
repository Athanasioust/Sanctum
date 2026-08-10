"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SoundAsset, SoundCategory } from "@/db/schema";

/**
 * The soundpad's audio engine.
 *
 * It lives in the campaign layout rather than on the soundpad page, because a
 * layout survives navigation between campaign routes — mounting it on a page
 * would cut the music off the moment the DM opened the combat tracker.
 *
 * Playback uses plain HTMLAudioElements: one long-lived element per looping
 * channel, and a throwaway element per SFX press so one-shots can overlap.
 */

/** The looping channels. SFX are fired, not held, so they have no channel. */
export const LOOP_CHANNELS: SoundCategory[] = ["music", "ambience"];

export type ChannelState = {
  asset: SoundAsset | null;
  volume: number;
  playing: boolean;
};

type SoundpadValue = {
  channels: Record<SoundCategory, ChannelState>;
  /** Load a track into its channel and start it. Passing null stops the channel. */
  play: (category: SoundCategory, asset: SoundAsset | null) => void;
  toggle: (category: SoundCategory) => void;
  setVolume: (category: SoundCategory, volume: number) => void;
  /** Fire a one-shot sound effect. */
  fire: (asset: SoundAsset) => void;
  stopAll: () => void;
  /** True while any looping channel is playing — drives the nav indicator. */
  anyPlaying: boolean;
};

const EMPTY_CHANNEL: ChannelState = { asset: null, volume: 0.6, playing: false };

const SoundpadContext = createContext<SoundpadValue | null>(null);

/** Read the soundpad. Returns null outside a campaign layout. */
export function useSoundpad(): SoundpadValue | null {
  return useContext(SoundpadContext);
}

function storageKey(campaignId: number) {
  return `sanctum:soundpad:${campaignId}`;
}

type PersistedState = Partial<
  Record<SoundCategory, { assetId: number | null; volume: number }>
>;

export function SoundpadProvider({
  campaignId,
  children,
}: {
  campaignId: number;
  children: React.ReactNode;
}) {
  const [channels, setChannels] = useState<Record<SoundCategory, ChannelState>>({
    music: { ...EMPTY_CHANNEL },
    ambience: { ...EMPTY_CHANNEL, volume: 0.4 },
    sfx: { ...EMPTY_CHANNEL, volume: 0.8 },
  });

  const players = useRef<Partial<Record<SoundCategory, HTMLAudioElement>>>({});
  const oneShots = useRef<HTMLAudioElement[]>([]);

  /** The element for a looping channel, created on first use. */
  const player = useCallback((category: SoundCategory) => {
    let element = players.current[category];
    if (!element) {
      element = new Audio();
      element.loop = true;
      element.preload = "auto";
      players.current[category] = element;
    }
    return element;
  }, []);

  // Restore the mixer for this campaign: volumes always, and the chosen tracks
  // if they still exist. Nothing auto-plays — the DM presses play.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      let saved: PersistedState = {};
      try {
        const raw = window.localStorage.getItem(storageKey(campaignId));
        if (raw) saved = JSON.parse(raw) as PersistedState;
      } catch {
        // A corrupt entry just means starting from defaults.
      }

      const wantedIds = Object.values(saved)
        .map((entry) => entry?.assetId)
        .filter((id): id is number => typeof id === "number");

      let assets: SoundAsset[] = [];
      if (wantedIds.length > 0) {
        try {
          const res = await fetch(`/api/sound-assets?campaignId=${campaignId}`);
          if (res.ok) assets = (await res.json()) as SoundAsset[];
        } catch {
          // Offline-safe: without the list, channels simply start empty.
        }
      }
      if (cancelled) return;

      setChannels((current) => {
        const next = { ...current };
        for (const category of ["music", "ambience", "sfx"] as SoundCategory[]) {
          const entry = saved[category];
          if (!entry) continue;
          next[category] = {
            asset: assets.find((a) => a.id === entry.assetId) ?? null,
            volume: clampVolume(entry.volume),
            playing: false,
          };
        }
        return next;
      });
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  // Persist the mixer whenever it changes.
  useEffect(() => {
    const payload: PersistedState = {
      music: { assetId: channels.music.asset?.id ?? null, volume: channels.music.volume },
      ambience: {
        assetId: channels.ambience.asset?.id ?? null,
        volume: channels.ambience.volume,
      },
      sfx: { assetId: null, volume: channels.sfx.volume },
    };
    try {
      window.localStorage.setItem(storageKey(campaignId), JSON.stringify(payload));
    } catch {
      // Storage being unavailable is not worth interrupting the session for.
    }
  }, [campaignId, channels]);

  // Tear every element down when leaving the campaign, so audio never leaks
  // into another campaign's session.
  useEffect(() => {
    const elements = players.current;
    const shots = oneShots.current;
    return () => {
      for (const element of Object.values(elements)) {
        element?.pause();
        element?.removeAttribute("src");
      }
      for (const shot of shots) shot.pause();
      shots.length = 0;
    };
  }, [campaignId]);

  const play = useCallback(
    (category: SoundCategory, asset: SoundAsset | null) => {
      const element = player(category);
      if (!asset) {
        element.pause();
        setChannels((c) => ({ ...c, [category]: { ...c[category], asset: null, playing: false } }));
        return;
      }

      // Only reload the source when the track actually changes, so nudging the
      // volume doesn't restart the bed.
      if (!element.src.endsWith(asset.url)) {
        element.src = asset.url;
      }
      element.volume = channels[category].volume;
      void element.play().catch(() => {
        // Browsers block audio until the page has been interacted with; the
        // press that got here counts, so a failure here is a missing file.
        setChannels((c) => ({ ...c, [category]: { ...c[category], playing: false } }));
      });
      setChannels((c) => ({ ...c, [category]: { ...c[category], asset, playing: true } }));
    },
    [player, channels],
  );

  const toggle = useCallback(
    (category: SoundCategory) => {
      const state = channels[category];
      if (!state.asset) return;
      const element = player(category);
      if (state.playing) {
        element.pause();
        setChannels((c) => ({ ...c, [category]: { ...c[category], playing: false } }));
      } else {
        play(category, state.asset);
      }
    },
    [channels, player, play],
  );

  const setVolume = useCallback(
    (category: SoundCategory, volume: number) => {
      const next = clampVolume(volume);
      const element = players.current[category];
      if (element) element.volume = next;
      setChannels((c) => ({ ...c, [category]: { ...c[category], volume: next } }));
    },
    [],
  );

  const fire = useCallback(
    (asset: SoundAsset) => {
      const shot = new Audio(asset.url);
      shot.volume = channels.sfx.volume;
      // Keep a reference until it finishes so it isn't collected mid-playback.
      oneShots.current.push(shot);
      shot.addEventListener("ended", () => {
        oneShots.current = oneShots.current.filter((s) => s !== shot);
      });
      void shot.play().catch(() => {
        oneShots.current = oneShots.current.filter((s) => s !== shot);
      });
    },
    [channels.sfx.volume],
  );

  const stopAll = useCallback(() => {
    for (const element of Object.values(players.current)) element?.pause();
    for (const shot of oneShots.current) shot.pause();
    oneShots.current = [];
    setChannels((c) => ({
      music: { ...c.music, playing: false },
      ambience: { ...c.ambience, playing: false },
      sfx: { ...c.sfx, playing: false },
    }));
  }, []);

  const value = useMemo<SoundpadValue>(
    () => ({
      channels,
      play,
      toggle,
      setVolume,
      fire,
      stopAll,
      anyPlaying: LOOP_CHANNELS.some((c) => channels[c].playing),
    }),
    [channels, play, toggle, setVolume, fire, stopAll],
  );

  return <SoundpadContext.Provider value={value}>{children}</SoundpadContext.Provider>;
}

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 0.6;
  return Math.max(0, Math.min(1, value));
}
