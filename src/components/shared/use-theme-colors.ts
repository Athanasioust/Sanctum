"use client";

import { useSyncExternalStore } from "react";

/**
 * The current theme's colours, for canvases (Konva, React Flow) that need
 * literal colour strings rather than CSS variables. Re-reads when the theme
 * or the system light/dark setting changes.
 */
export type ThemeColors = {
  /** Backdrop behind battle maps and atlas maps. */
  mapSurface: string;
  /** Battle-map grid lines. */
  mapGrid: string;
  mode: "dark" | "light";
};

const FALLBACK = "#0b0b0c|rgba(255, 255, 255, 0.12)|dark";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-mode"],
  });
  const media = window.matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

// A string snapshot, so React sees "unchanged" when nothing changed.
function snapshot(): string {
  const style = getComputedStyle(document.documentElement);
  const surface = style.getPropertyValue("--map-surface").trim();
  const grid = style.getPropertyValue("--map-grid").trim();
  const mode = style.colorScheme.includes("light") ? "light" : "dark";
  return surface && grid ? `${surface}|${grid}|${mode}` : FALLBACK;
}

export function useThemeColors(): ThemeColors {
  const value = useSyncExternalStore(subscribe, snapshot, () => FALLBACK);
  const [mapSurface, mapGrid, mode] = value.split("|");
  return { mapSurface, mapGrid, mode: mode === "light" ? "light" : "dark" };
}
