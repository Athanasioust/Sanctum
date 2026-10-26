import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { battleMaps } from "@/db/schema";
import { ApiError, apiRoute, json, parseBody, readJson } from "@/lib/api";
import { fogForGrid, tokenVisibleToPlayers } from "@/lib/battle-map";
import { readLanConfig } from "@/lib/lan";

/**
 * The player view's one and only write: a player dragging their own token.
 *
 * Everything else the player view shows is read-only, so this route is kept
 * deliberately narrow. It accepts a token position and nothing more, and only
 * when every one of these holds:
 *
 *  - local-network sharing is on, and the DM has switched player moves on;
 *  - the map belongs to the campaign the player view is showing, and the DM is
 *    currently showing that map to players;
 *  - the token exists, is handed to a player, and is visible to players;
 *  - the move names the player the token is handed to;
 *  - the destination is on the map and not under fog.
 *
 * The position is snapped to the grid and clamped to the map, and only that
 * token's x/y are written — no other token, field or table is touched.
 *
 * There are no accounts, so "the player the token is handed to" is the name
 * the player picked on their phone. It keeps players from grabbing each
 * other's tokens by accident; it is not a security boundary, and the DM can
 * always drag a token back.
 */

const moveSchema = z.object({
  campaignId: z.number().int().positive(),
  battleMapId: z.number().int().positive(),
  tokenId: z.string().min(1).max(64),
  controllerName: z.string().trim().min(1).max(60),
  x: z.number().finite(),
  y: z.number().finite(),
});

/** Minimum gap between accepted moves of one token. */
const MIN_INTERVAL_MS = 250;
const lastMove = new Map<string, number>();

/** Whether the player view should offer dragging at all. */
export const GET = apiRoute(async () => {
  const config = readLanConfig();
  return json({ allowed: config.enabled && config.allowPlayerTokenMoves });
});

export const POST = apiRoute(async (req) => {
  const config = readLanConfig();
  if (!config.enabled || !config.allowPlayerTokenMoves) {
    throw new ApiError("The DM hasn't allowed players to move tokens", 403);
  }

  const move = parseBody(moveSchema, await readJson(req));

  const key = `${move.battleMapId}:${move.tokenId}`;
  const now = Date.now();
  if (now - (lastMove.get(key) ?? 0) < MIN_INTERVAL_MS) {
    throw new ApiError("Too many moves — slow down", 429);
  }

  const [map] = await db.select().from(battleMaps).where(eq(battleMaps.id, move.battleMapId));
  if (!map || map.campaignId !== move.campaignId || !map.revealToPlayers) {
    throw new ApiError("Map not found", 404);
  }

  const token = map.tokens.find((t) => t.id === move.tokenId);
  const fog = fogForGrid(map.fog, map.gridCols, map.gridRows);
  if (
    !token ||
    !token.playerControllable ||
    !tokenVisibleToPlayers(token, fog, map.fogEnabled)
  ) {
    throw new ApiError("That token can't be moved from here", 403);
  }
  if ((token.controllerName ?? "").trim().toLowerCase() !== move.controllerName.toLowerCase()) {
    throw new ApiError("That token belongs to another player", 403);
  }

  const size = Math.max(1, token.sizeCells);
  const x = Math.max(0, Math.min(map.gridCols - size, Math.round(move.x)));
  const y = Math.max(0, Math.min(map.gridRows - size, Math.round(move.y)));
  const moved = { ...token, x, y };
  if (!tokenVisibleToPlayers(moved, fog, map.fogEnabled)) {
    throw new ApiError("You can't move into the dark", 409);
  }

  lastMove.set(key, now);
  if (lastMove.size > 2000) lastMove.clear();

  // Write only this token's position into the stored list.
  const tokens = map.tokens.map((t) => (t.id === token.id ? moved : t));
  await db.update(battleMaps).set({ tokens }).where(eq(battleMaps.id, map.id));
  return json({ id: token.id, x, y });
});
