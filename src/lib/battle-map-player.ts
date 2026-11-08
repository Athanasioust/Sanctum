/**
 * What of a battle map players may see, shared by the server (which builds the
 * player payload) and the DM's editor (which burns the fog into the player
 * image). No server or browser APIs here.
 */
import type { BattleToken, FogData, MapAnnotation } from "@/db/schema";
import { fogForGrid, isAoeTemplate, isRevealed, tokenVisibleToPlayers } from "@/lib/battle-map";
import type { PlayerToken } from "@/lib/screen/types";

type FogFields = {
  imageUrl: string | null;
  gridCols: number;
  gridRows: number;
  fog: FogData | null;
  fogEnabled: boolean;
};

/** Burned player images are stored as `battle-player-<mapId>-<fogKey>.jpg` in uploads. */
export const BATTLE_PLAYER_IMAGE_PREFIX = "battle-player-";

export function battlePlayerImageName(mapId: number, key: string): string {
  return `${BATTLE_PLAYER_IMAGE_PREFIX}${mapId}-${key}.jpg`;
}

/**
 * A fingerprint of everything that changes the burned player image: the base
 * image, the grid it's stretched over, and the fog. A render is only served
 * while its fingerprint matches the map's, so a stale render — one that would
 * show what's since been re-hidden — is never sent.
 */
export function battleFogKey(map: FogFields): string {
  const fog = fogForGrid(map.fog, map.gridCols, map.gridRows);
  const bits = fog.revealed.map((r) => (r ? "1" : "0")).join("");
  const input = `${map.imageUrl ?? ""}|${map.gridCols}x${map.gridRows}|${map.fogEnabled ? 1 : 0}|${bits}`;
  // FNV-1a, twice with different seeds for a 64-bit-ish key. Not a security
  // measure — just a cheap, identical fingerprint on server and client.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x0100019d) >>> 0;
  }
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
}

/** A token as players may receive it: position and look, nothing the DM keeps to themselves. */
export function toPlayerToken(token: BattleToken): PlayerToken {
  const handed = token.playerControllable && token.controllerName?.trim();
  return {
    id: token.id,
    label: token.label,
    x: token.x,
    y: token.y,
    color: token.color,
    sizeCells: token.sizeCells,
    ...(handed ? { playerControllable: true as const, controllerName: token.controllerName!.trim() } : {}),
  };
}

export function visiblePlayerTokens(tokens: BattleToken[], fog: FogData | null, fogEnabled: boolean): BattleToken[] {
  return tokens.filter((t) => tokenVisibleToPlayers(t, fog, fogEnabled));
}

/**
 * Whether an annotation is outside the fog. Templates and text count by their
 * anchor cell; freehand strokes and arrows only when every point is revealed,
 * so a line drawn into hidden ground doesn't trace it out.
 */
export function annotationVisibleToPlayers(
  a: MapAnnotation,
  fog: FogData | null,
  fogEnabled: boolean,
): boolean {
  if (!fogEnabled || !fog) return true;
  // A point on the far edge of the grid belongs to the last cell, not outside it.
  const cell = (x: number, y: number) =>
    isRevealed(fog, Math.min(fog.cols - 1, Math.floor(x)), Math.min(fog.rows - 1, Math.floor(y)));
  if (isAoeTemplate(a) || a.kind === "text") return cell(a.x, a.y);
  const pts = a.points ?? [];
  if (pts.length < 2) return false;
  for (let i = 0; i + 1 < pts.length; i += 2) {
    if (!cell(pts[i], pts[i + 1])) return false;
  }
  return true;
}
