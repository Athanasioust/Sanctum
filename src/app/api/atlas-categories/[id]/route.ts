import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { atlasCategories } from "@/db/schema";
import { ApiError, apiRoute, json, requireId } from "@/lib/api";
import { itemHandlers } from "@/lib/crud";
import { atlasCategoryCreateSchema, atlasCategoryUpdateSchema } from "@/lib/validators";

export const { GET, PATCH } = itemHandlers({
  table: atlasCategories,
  idColumn: atlasCategories.id,
  createSchema: atlasCategoryCreateSchema,
  updateSchema: atlasCategoryUpdateSchema,
});

/**
 * Markers in a deleted category become uncategorised (FK set null). The last
 * category stays, so an empty list always means "not seeded yet".
 */
export const DELETE = apiRoute<{ id: string }>(async (_req, { params }) => {
  const id = requireId((await params).id);
  const [row] = await db.select().from(atlasCategories).where(eq(atlasCategories.id, id));
  if (!row) throw new ApiError("Not found", 404);
  const [{ n }] = await db
    .select({ n: count() })
    .from(atlasCategories)
    .where(eq(atlasCategories.campaignId, row.campaignId));
  if (n <= 1) throw new ApiError("Keep at least one category", 409);
  await db.delete(atlasCategories).where(eq(atlasCategories.id, id));
  return json({ success: true });
});
