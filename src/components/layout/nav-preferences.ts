"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { NavGroupId } from "@/lib/nav";

/**
 * Sidebar preferences — which groups are collapsed, and whether the desktop
 * rail is showing icons only.
 *
 * Kept in localStorage rather than the database: it's a per-machine display
 * preference, not campaign data, and it has to be readable synchronously while
 * the sidebar renders.
 *
 * Read through `useSyncExternalStore` rather than an effect. The server (and
 * the hydration pass) sees the defaults, React re-renders with the stored value
 * straight after, and there is no hydration mismatch and no setState in an
 * effect.
 */

const STORAGE_KEY = "sanctum:nav-preferences";
/** Same-tab notification; the native `storage` event only fires cross-tab. */
const CHANGED_EVENT = "sanctum:nav-preferences-changed";

export type NavPreferences = {
  /** Groups the DM has collapsed. Anything absent is expanded. */
  collapsedGroups: NavGroupId[];
  /** Desktop rail narrowed to icons only. */
  railCollapsed: boolean;
};

const DEFAULTS: NavPreferences = { collapsedGroups: [], railCollapsed: false };

// useSyncExternalStore compares snapshots by reference, so the parsed object is
// cached and only rebuilt when the underlying string actually changes.
// Returning a fresh object every read would loop forever.
let cachedRaw: string | null = null;
let cached: NavPreferences = DEFAULTS;

function parse(raw: string | null): NavPreferences {
  if (!raw) return DEFAULTS;
  try {
    const value = JSON.parse(raw) as Partial<NavPreferences>;
    return {
      collapsedGroups: Array.isArray(value.collapsedGroups)
        ? value.collapsedGroups.filter((id): id is NavGroupId => typeof id === "string")
        : [],
      railCollapsed: value.railCollapsed === true,
    };
  } catch {
    // A corrupt entry just means starting from the defaults.
    return DEFAULTS;
  }
}

function getSnapshot(): NavPreferences {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return DEFAULTS;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
}

function getServerSnapshot(): NavPreferences {
  return DEFAULTS;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function write(next: NavPreferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage being unavailable shouldn't break navigation.
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function useNavPreferences() {
  const preferences = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleGroup = useCallback((id: NavGroupId) => {
    const current = getSnapshot();
    const collapsed = current.collapsedGroups.includes(id)
      ? current.collapsedGroups.filter((g) => g !== id)
      : [...current.collapsedGroups, id];
    write({ ...current, collapsedGroups: collapsed });
  }, []);

  const toggleRail = useCallback(() => {
    const current = getSnapshot();
    write({ ...current, railCollapsed: !current.railCollapsed });
  }, []);

  return { preferences, toggleGroup, toggleRail };
}
