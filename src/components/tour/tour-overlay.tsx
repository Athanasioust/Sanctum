"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";
import type { TourStep } from "@/lib/tour";
import { cn } from "@/lib/utils";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 6;
const GAP = 12;
const MARGIN = 16;

/**
 * The spotlight: everything is dimmed except the target, and one small card
 * explains it. The overlay sits on top of the whole app and swallows every
 * pointer and key event, so nothing behind it can be clicked or triggered
 * while the tour runs — the tour only ever points at things.
 */
export function TourOverlay({
  step,
  index,
  total,
  target,
  onNext,
  onBack,
  onClose,
}: {
  step: TourStep;
  index: number;
  total: number;
  /** Null while the stop's page or anchor is still loading. */
  target: HTMLElement | null;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const titleId = useId();
  const bodyId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const last = index === total - 1;
  const ready = target !== null;

  // Follow the target as the page scrolls, resizes or re-lays out.
  useEffect(() => {
    if (!target) return;
    let frame = 0;
    let prev = "";
    const tick = () => {
      if (target.isConnected) {
        const r = target.getBoundingClientRect();
        // Clip to the viewport so a tall target never pushes the card off-screen.
        const top = Math.max(r.top, 0);
        const bottom = Math.min(r.bottom, window.innerHeight);
        const next: Rect = { top, left: r.left, width: r.width, height: Math.max(bottom - top, 0) };
        const key = `${next.top}|${next.left}|${next.width}|${next.height}`;
        if (key !== prev) {
          prev = key;
          setRect(next);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const shownRect = ready ? rect : null;

  // Place the card below the target, else above, else pinned to the bottom.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top: number;
    let left: number;
    if (!shownRect) {
      top = (vh - h) / 2;
      left = (vw - w) / 2;
    } else {
      const below = shownRect.top + shownRect.height + PAD + GAP;
      const above = shownRect.top - PAD - GAP - h;
      if (below + h <= vh - MARGIN) top = below;
      else if (above >= MARGIN) top = above;
      else top = vh - h - MARGIN;
      left = shownRect.left;
    }
    left = Math.min(Math.max(left, MARGIN), Math.max(vw - w - MARGIN, MARGIN));
    top = Math.min(Math.max(top, MARGIN), Math.max(vh - h - MARGIN, MARGIN));
    setCardPos((p) => (p && p.top === top && p.left === left ? p : { top, left }));
  }, [shownRect, index, ready]);

  // Focus the primary action whenever a stop is shown.
  useEffect(() => {
    if (ready) nextRef.current?.focus({ preventScroll: true });
    else cardRef.current?.focus({ preventScroll: true });
  }, [ready, index]);

  // Own the keyboard: Esc closes, arrows/Enter move, Tab stays in the card.
  // Capturing and stopping every key also keeps app shortcuts (combat keys,
  // ⌘K) from firing underneath the tour.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const card = cardRef.current;
      e.stopPropagation();
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowRight" && ready) {
        e.preventDefault();
        onNext();
        return;
      }
      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        onBack();
        return;
      }
      if (e.key === "Enter") {
        // Enter on a focused card button presses that button; elsewhere it advances.
        const onButton = card?.contains(document.activeElement) && document.activeElement instanceof HTMLButtonElement;
        if (!onButton) {
          e.preventDefault();
          if (ready) onNext();
        }
        return;
      }
      if (e.key === "Tab" && card) {
        const items = [...card.querySelectorAll<HTMLElement>("button:not([disabled])")];
        if (items.length === 0) return;
        const pos = items.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        const nextPos = pos === -1 ? 0 : (pos + (e.shiftKey ? -1 : 1) + items.length) % items.length;
        items[nextPos].focus();
        return;
      }
      if (!card?.contains(document.activeElement) || e.key !== " ") e.preventDefault();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [ready, index, onNext, onBack, onClose]);

  if (typeof document === "undefined") return null;

  const progress = t("tour.progress").replace("{n}", String(index + 1)).replace("{total}", String(total));

  return createPortal(
    // Above Leaflet, whose panes and controls stack at z-index 400–1000.
    <div data-tour-overlay="" className="fixed inset-0 z-[5000]" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      {/* Click shield + dimmer. With a target the dim comes from the spotlight's shadow. */}
      <div className={cn("absolute inset-0", shownRect ? "bg-transparent" : "bg-black/60")} aria-hidden="true" />
      {shownRect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-lg ring-2 ring-primary transition-all duration-200 ease-out motion-reduce:transition-none"
          style={{
            top: shownRect.top - PAD,
            left: shownRect.left - PAD,
            width: shownRect.width + PAD * 2,
            height: shownRect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.6)",
          }}
        />
      ) : null}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        className="absolute w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl outline-none"
        style={cardPos ? { top: cardPos.top, left: cardPos.left } : { visibility: "hidden" }}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
            {progress}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("tour.close")}
            title={t("tour.close")}
            className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-4" />
          </button>
        </div>
        <h2 id={titleId} className="font-heading text-lg font-semibold">
          {ready ? t(step.titleKey) : t("common.loading")}
        </h2>
        <p id={bodyId} className="mt-1 text-sm text-muted-foreground">
          {ready ? t(step.bodyKey) : t("tour.loadingBody")}
        </p>
        <div className="mt-4 flex items-center gap-2">
          {last ? null : (
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t("tour.skip")}
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBack} disabled={index === 0}>
              {t("tour.back")}
            </Button>
            <Button ref={nextRef} size="sm" onClick={onNext} disabled={!ready}>
              {last ? t("tour.finish") : t("tour.next")}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
