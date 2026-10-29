"use client";

import type { AtlasMap } from "@/db/schema";
import { atlasFogKey, paintFog } from "@/lib/atlas/fog";
import { api, ApiClientError } from "@/lib/client";

/** Upload a map image through the app's normal upload route. */
export async function uploadAtlasImage(file: File): Promise<{ url: string; width: number; height: number }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", "image");
  const { url } = await api.upload<{ url: string }>("/api/upload", fd);
  const { width, height } = await measureImage(url);
  return { url, width, height };
}

export function measureImage(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not read the image"));
    img.src = url;
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the map image"));
    img.src = url;
  });
}

/** Big enough for a crisp player view, small enough for every browser's canvas limit. */
const MAX_SIDE = 8192;
const MAX_AREA = 40_000_000;

/**
 * Burn the fog into a copy of the map image and hand it to the server as the
 * player image. Runs in the DM's browser, which already has the full image, so
 * the server never needs an image library and the player view never receives
 * the undiscovered parts — they're simply not in the pixels it gets.
 *
 * Returns the updated map, or null if the fog moved on mid-upload (a newer
 * render will follow).
 */
export async function renderPlayerImage(map: AtlasMap): Promise<AtlasMap | null> {
  if (!map.imageUrl || !map.fogEnabled) return null;
  const img = await loadImage(map.imageUrl);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h), Math.sqrt(MAX_AREA / (w * h)));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));

  const fog = document.createElement("canvas");
  fog.width = cw;
  fog.height = ch;
  paintFog(fog.getContext("2d")!, map.fog, cw, ch, "#0b0b0c");

  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(img, 0, 0, cw, ch);
  ctx.drawImage(fog, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/jpeg", 0.88));
  if (!blob) throw new Error("Could not render the player map");
  const fd = new FormData();
  fd.append("file", new File([blob], "player.jpg", { type: "image/jpeg" }));
  fd.append("fogKey", atlasFogKey(map));
  try {
    return await api.upload<AtlasMap>(`/api/atlas-maps/${map.id}/player-image`, fd);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 409) return null;
    throw err;
  }
}

export const patchMap = (id: number, patch: Record<string, unknown>) =>
  api.patch<AtlasMap>(`/api/atlas-maps/${id}`, patch);
