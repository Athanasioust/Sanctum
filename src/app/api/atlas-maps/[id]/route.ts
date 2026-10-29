import { eq } from "drizzle-orm";
import { db } from "@/db";
import { atlasMaps } from "@/db/schema";
import { ApiError, apiRoute, json, parseBody, readJson, requireId } from "@/lib/api";
import { itemHandlers } from "@/lib/crud";
import { atlasDescendantIds } from "@/lib/atlas/links";
import { removePlayerImage } from "@/lib/atlas/files";
import { atlasMapCreateSchema, atlasMapUpdateSchema } from "@/lib/validators";

const base = itemHandlers({
  table: atlasMaps,
  idColumn: atlasMaps.id,
  createSchema: atlasMapCreateSchema,
  updateSchema: atlasMapUpdateSchema,
});

export const GET = base.GET;

type Params = { id: string };

/**
 * A partial update with three rules the generic handler can't express:
 * a map can't be filed under itself or its own descendants; revealing stamps
 * `revealedAt` so the player view follows the newest reveal; and any change to
 * the fog or the base image throws away the fogged player render, so the
 * players see nothing rather than a stale image until the editor re-renders.
 */
export const PATCH = apiRoute<Params>(async (req, { params }) => {
  const id = requireId((await params).id);
  const raw = await readJson(req);
  const data = parseBody(atlasMapUpdateSchema, raw) as Record<string, unknown>;
  const present = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const patch: Record<string, unknown> = Object.fromEntries(
    Object.entries(data).filter(([key]) => key in present),
  );

  const [current] = await db.select().from(atlasMaps).where(eq(atlasMaps.id, id));
  if (!current) throw new ApiError("Not found", 404);

  if (typeof patch.parentMapId === "number") {
    const siblings = await db
      .select({ id: atlasMaps.id, parentMapId: atlasMaps.parentMapId })
      .from(atlasMaps)
      .where(eq(atlasMaps.campaignId, current.campaignId));
    if (!siblings.some((m) => m.id === patch.parentMapId)) {
      throw new ApiError("Parent map not found", 422);
    }
    if (atlasDescendantIds(siblings, id).has(patch.parentMapId)) {
      throw new ApiError("A map can't sit inside itself", 422);
    }
  }

  if (patch.revealToPlayers === true && !current.revealToPlayers) {
    patch.revealedAt = new Date();
  }

  const fogChanged = "fog" in patch || "fogEnabled" in patch;
  const imageChanged = "imageUrl" in patch && patch.imageUrl !== current.imageUrl;
  if ((fogChanged || imageChanged) && current.playerImageUrl) {
    patch.playerImageUrl = null;
  }

  if (Object.keys(patch).length === 0) return json(current);
  const [row] = await db.update(atlasMaps).set(patch).where(eq(atlasMaps.id, id)).returning();
  if (patch.playerImageUrl === null) await removePlayerImage(current.playerImageUrl);
  return json(row);
});

export const DELETE = apiRoute<Params>(async (_req, { params }) => {
  const id = requireId((await params).id);
  // Markers go with the map (FK cascade); child maps and portals pointing here
  // are unlinked, not deleted.
  const [row] = await db.delete(atlasMaps).where(eq(atlasMaps.id, id)).returning();
  if (!row) throw new ApiError("Not found", 404);
  await removePlayerImage(row.playerImageUrl);
  return json({ success: true });
});
