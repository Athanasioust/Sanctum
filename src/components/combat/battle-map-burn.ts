"use client";

import { useEffect, useRef } from "react";
import type { BattleMap } from "@/db/schema";
import { fogForGrid, fogRects } from "@/lib/battle-map";
import { battleFogKey } from "@/lib/battle-map-player";
import { api, ApiClientError } from "@/lib/client";

/** Wait this long after the last fog change, so a brush drag renders once, not per stroke. */
const BURN_DELAY_MS = 1200;
/** Big enough for a crisp TV, small enough for every browser's canvas limit. */
const MAX_SIDE = 8192;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the map image"));
    img.src = url;
  });
}

/**
 * Paint the battle map image with every unrevealed cell blacked out, at the
 * grid's proportions (the canvas stretches the image over the grid, so this
 * does too).
 */
async function burn(map: BattleMap): Promise<Blob> {
  const img = await loadImage(map.imageUrl!);
  const cols = map.gridCols;
  const rows = map.gridRows;
  const cell = Math.max(
    8,
    Math.min(Math.floor(MAX_SIDE / Math.max(cols, rows)), Math.ceil(img.naturalWidth / cols)),
  );
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  for (const r of fogRects(fogForGrid(map.fog, cols, rows))) {
    ctx.fillRect(r.x * cell, r.y * cell, r.w * cell, r.h * cell);
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  if (!blob) throw new Error("Could not render the player map");
  return blob;
}

/**
 * Keep the player view's copy of a fogged battle map image up to date.
 *
 * While a map is shown to players with fog on, the player view never gets the
 * DM's original image — only a render with the fog burned in (see
 * `src/lib/screen/state.ts`). This renders it in the DM's browser, which has
 * the image already, once the fog has settled: after a brush drag ends, when
 * fog is reset or revealed, or when the map is first shown. Nothing changes
 * on the DM's own screen.
 *
 * `flush` saves any pending map edits first, so the server's fog matches the
 * render being uploaded.
 */
export function usePlayerImageBurn(map: BattleMap | null, flush: (id: number) => Promise<void>) {
  const wanted = !!map && map.revealToPlayers && map.fogEnabled && !!map.imageUrl;
  const key = wanted && map ? battleFogKey(map) : null;
  const latest = useRef({ map, flush });
  useEffect(() => {
    latest.current = { map, flush };
  });

  const mapId = map?.id ?? null;
  useEffect(() => {
    if (!key || mapId === null) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { map: current, flush: save } = latest.current;
      if (!current || current.id !== mapId) return;
      try {
        await save(mapId);
        if (cancelled) return;
        const status = await api.get<{ key: string; ready: boolean }>(`/api/battle-maps/${mapId}/player-image`);
        // Already rendered, or the server's fog isn't this one (a newer change will re-run this).
        if (cancelled || status.ready || status.key !== key) return;
        const blob = await burn(current);
        if (cancelled) return;
        const fd = new FormData();
        fd.append("file", new File([blob], "player.jpg", { type: "image/jpeg" }));
        fd.append("fogKey", key);
        await api.upload(`/api/battle-maps/${mapId}/player-image`, fd);
      } catch (err) {
        // 409: the fog moved on mid-render; the effect for the newer fog renders it.
        if (!(err instanceof ApiClientError && err.status === 409)) {
          console.warn("[battle-map] player image render failed", err);
        }
      }
    }, BURN_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, mapId]);
}
