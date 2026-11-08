import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { battleMaps } from "@/db/schema";
import { ApiError, apiRoute, json, requireId } from "@/lib/api";
import {
  BATTLE_PLAYER_IMAGE_PREFIX,
  battleFogKey,
  battlePlayerImageName,
} from "@/lib/battle-map-player";
import { UPLOADS_DIR } from "@/lib/paths";

const MAX_BYTES = 40 * 1024 * 1024;

type Params = { id: string };

/** Whether the player render for the map's current fog already exists. */
export const GET = apiRoute<Params>(async (_req, { params }) => {
  const id = requireId((await params).id);
  const [map] = await db.select().from(battleMaps).where(eq(battleMaps.id, id));
  if (!map) throw new ApiError("Not found", 404);
  const key = battleFogKey(map);
  return json({ key, ready: existsSync(path.join(UPLOADS_DIR, battlePlayerImageName(id, key))) });
});

/**
 * Store the fog-burned render of a battle map that the DM's editor painted:
 * the map image with every unrevealed cell blacked out. While fog is on this
 * is the only image the player view gets (see `src/lib/screen/state.ts`).
 *
 * The file is named after the fog fingerprint it was painted from, and the
 * player payload only serves the file matching the map's current fingerprint —
 * so a render that's gone stale is never shown, without any column to keep in
 * step. A render whose fog has already moved on is refused.
 */
export const POST = apiRoute<Params>(async (req, { params }) => {
  const id = requireId((await params).id);
  const form = await req.formData();
  const file = form.get("file");
  const fogKey = String(form.get("fogKey") ?? "");
  if (!(file instanceof File)) throw new ApiError("No file provided", 400);
  if (file.type !== "image/jpeg") throw new ApiError("Unsupported image type", 415);
  if (file.size > MAX_BYTES) throw new ApiError("Render is too large", 413);
  if (!/^[0-9a-f]{16}$/.test(fogKey)) throw new ApiError("Bad fog key", 400);

  const [map] = await db.select().from(battleMaps).where(eq(battleMaps.id, id));
  if (!map) throw new ApiError("Not found", 404);
  if (fogKey !== battleFogKey(map)) throw new ApiError("Fog changed; render again", 409);

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const name = battlePlayerImageName(id, fogKey);
  await fs.writeFile(path.join(UPLOADS_DIR, name), Buffer.from(await file.arrayBuffer()));

  // Drop this map's older renders; only the current one can ever be served.
  const mine = `${BATTLE_PLAYER_IMAGE_PREFIX}${id}-`;
  const entries = await fs.readdir(UPLOADS_DIR).catch(() => [] as string[]);
  await Promise.all(
    entries
      .filter((f) => f.startsWith(mine) && f !== name)
      .map((f) => fs.rm(path.join(UPLOADS_DIR, f), { force: true }).catch(() => {})),
  );
  return json({ key: fogKey, url: `/uploads/${name}` }, 201);
});
