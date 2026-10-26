"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps every open window's view of combat in step — the main window, a
 * popped-out tracker on a second monitor, the battle map.
 *
 * Writes already go to the shared server; this only tells the *other* windows
 * that something changed so they re-read it, instead of each waiting for a
 * reload. BroadcastChannel is same-origin and local to this machine: nothing
 * leaves the computer.
 */
const CHANNEL = "sanctum:combat";

/**
 * Identifies this window. A BroadcastChannel delivers to every *other*
 * channel object — including other listeners in the same window — so each
 * message carries its sender and a window ignores its own.
 */
const WINDOW_ID =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Math.random());

export type CombatChange = { encounterId: number | null };
type Message = CombatChange & { source: string };

/** Tell other windows that combat data changed. */
export function announceCombatChange(encounterId: number | null) {
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage({ encounterId, source: WINDOW_ID } satisfies Message);
    channel.close();
  } catch {
    /* another window will simply catch up on its next load */
  }
}

/**
 * Run `onChange` when another window changes combat, coalescing a burst of
 * messages into one call. A window never hears its own announcements.
 */
export function useCombatChanges(onChange: (change: CombatChange) => void, delayMs = 200) {
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL);
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pending: CombatChange = { encounterId: null };
    channel.onmessage = (event: MessageEvent<Message>) => {
      if (event.data?.source === WINDOW_ID) return;
      pending = { encounterId: event.data?.encounterId ?? null };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => latest.current(pending), delayMs);
    };
    return () => {
      if (timer) clearTimeout(timer);
      channel.close();
    };
  }, [delayMs]);
}
