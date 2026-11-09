"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";
import {
  TOUR_STEPS,
  TOUR_TARGET_TIMEOUT_MS,
  findTourTarget,
  routePath,
  type TourContext,
} from "@/lib/tour";
import { TourOverlay } from "@/components/tour/tour-overlay";

type SampleResponse = TourContext & { id: number; created: boolean };

type TourApi = {
  /** Seed (or reuse) the sample campaign, open it and start the tour. */
  startTour: () => void;
  /** Seed (or reuse) the sample campaign and open it, without the tour. */
  openSample: () => Promise<boolean>;
  starting: boolean;
  active: boolean;
};

const TourCtx = createContext<TourApi | null>(null);

export function useTour(): TourApi {
  const ctx = useContext(TourCtx);
  if (!ctx) throw new Error("useTour must be used inside <TourProvider>");
  return ctx;
}

/**
 * Lives in the root layout so it survives navigation between pages: the tour
 * moves the DM from page to page, waits for each stop's `data-tour` anchor to
 * mount, and skips a stop whose anchor never shows up rather than getting stuck.
 */
export function TourProvider({ children }: { children: React.ReactNode }) {
  const t = useT();
  const router = useRouter();
  const [ctx, setCtx] = useState<TourContext | null>(null);
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [starting, setStarting] = useState(false);
  /** Direction of travel, so a missing stop is skipped the way the DM was going. */
  const dir = useRef<1 | -1>(1);

  const stop = useCallback(() => {
    setCtx(null);
    setTarget(null);
    setIndex(0);
  }, []);

  const go = useCallback(
    (delta: 1 | -1) => {
      dir.current = delta;
      setTarget(null);
      setIndex((i) => {
        const next = i + delta;
        if (next >= TOUR_STEPS.length) {
          // Ran off the end (Finish, or the last stop was skipped).
          queueMicrotask(stop);
          return i;
        }
        if (next < 0) {
          // Nothing earlier to show; head forward from the start again.
          dir.current = 1;
          return 0;
        }
        return next;
      });
    },
    [stop],
  );

  const fetchSample = useCallback(async (): Promise<SampleResponse | null> => {
    try {
      return await api.post<SampleResponse>("/api/campaigns/sample");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("sample.loadFailed"));
      return null;
    }
  }, [t]);

  const openSample = useCallback(async () => {
    setStarting(true);
    const sample = await fetchSample();
    setStarting(false);
    if (!sample) return false;
    if (sample.created) toast.success(t("sample.loaded"));
    router.push(`/campaign/${sample.id}`);
    router.refresh();
    return true;
  }, [fetchSample, router, t]);

  const startTour = useCallback(() => {
    if (starting || ctx) return;
    setStarting(true);
    void fetchSample().then((sample) => {
      setStarting(false);
      if (!sample) return;
      dir.current = 1;
      setTarget(null);
      setIndex(0);
      setCtx({ campaignId: sample.id, characterId: sample.characterId, atlasMapId: sample.atlasMapId });
      router.refresh();
    });
  }, [starting, ctx, fetchSample, router]);

  // Each stop: go to its page, then wait for its anchor (or give up and skip).
  useEffect(() => {
    if (!ctx) return;
    const step = TOUR_STEPS[index];
    const href = step.path(ctx);
    if (!href) {
      const skip = setTimeout(() => go(dir.current), 0);
      return () => clearTimeout(skip);
    }
    const path = routePath(href);
    if (window.location.pathname !== path) router.push(href);

    const startedAt = Date.now();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = () => {
      if (cancelled) return;
      const el = window.location.pathname === path ? findTourTarget(step.anchor) : null;
      if (el) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const tall = el.getBoundingClientRect().height > window.innerHeight * 0.6;
        el.scrollIntoView({ block: tall ? "start" : "center", behavior: reduce ? "auto" : "smooth" });
        setTarget(el);
        return;
      }
      if (Date.now() - startedAt > TOUR_TARGET_TIMEOUT_MS) {
        go(dir.current);
        return;
      }
      timer = setTimeout(poll, 100);
    };
    timer = setTimeout(poll, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ctx, index, go, router]);

  const value = useMemo<TourApi>(
    () => ({ startTour, openSample, starting, active: ctx !== null }),
    [startTour, openSample, starting, ctx],
  );

  return (
    <TourCtx.Provider value={value}>
      {children}
      {ctx ? (
        <TourOverlay
          step={TOUR_STEPS[index]}
          index={index}
          total={TOUR_STEPS.length}
          target={target}
          onNext={() => go(1)}
          onBack={() => go(-1)}
          onClose={stop}
        />
      ) : null}
    </TourCtx.Provider>
  );
}
