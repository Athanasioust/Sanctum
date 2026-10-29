import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { atlasMaps } from "@/db/schema";
import { ApiError, apiRoute, json, requireId } from "@/lib/api";
import { PLAYER_IMAGE_PREFIX, removePlayerImage } from "@/lib/atlas/files";
import { atlasFogKey } from "@/lib/atlas/fog";
import { UPLOADS_DIR } from "@/lib/paths";

const MAX_BYTES = 40 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

type Params = { id: string };

/**
 * Store the fogged render of a map that the DM's editor painted: the base image
 * with every undiscovered area burned out. While fog is on this is the only
 * image the player view gets, so hidden terrain never reaches a player device.
 *
 * `fogKey` is the fog the render was painted from. If the fog changed while the
 * render was uploading, the render is stale and is refused.
 */
export const POST = apiRoute<Params>(async (req, { params }) => {
  const id = requireId((await params).id);
  const form = await req.formData();
  const file = form.get("file");
  const fogKey = String(form.get("fogKey") ?? "");
  if (!(file instanceof File)) throw new ApiError("No file provided", 400);
  const ext = TYPES[file.type];
  if (!ext) throw new ApiError("Unsupported image type", 415);
  if (file.size > MAX_BYTES) throw new ApiError("Render is too large", 413);

  const [map] = await db.select().from(atlasMaps).where(eq(atlasMaps.id, id));
  if (!map) throw new ApiError("Not found", 404);
  if (fogKey !== atlasFogKey(map)) throw new ApiError("Fog changed; render again", 409);

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${PLAYER_IMAGE_PREFIX}${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), Buffer.from(await file.arrayBuffer()));
  const url = `/uploads/${filename}`;

  // Re-check and store in one synchronous transaction: the fog may have moved
  // on while the file was being written.
  const result = db.transaction((tx) => {
    const [fresh] = tx.select().from(atlasMaps).where(eq(atlasMaps.id, id)).all();
    if (!fresh || fogKey !== atlasFogKey(fresh)) return null;
    const [row] = tx.update(atlasMaps).set({ playerImageUrl: url }).where(eq(atlasMaps.id, id)).returning().all();
    return { row, previous: fresh.playerImageUrl };
  });
  if (!result) {
    await removePlayerImage(url);
    throw new ApiError("Fog changed; render again", 409);
  }
  await removePlayerImage(result.previous);
  return json(result.row, 201);
});
