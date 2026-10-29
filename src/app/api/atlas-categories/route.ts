import { atlasCategories } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { atlasCategoryCreateSchema, atlasCategoryUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: atlasCategories,
  idColumn: atlasCategories.id,
  createSchema: atlasCategoryCreateSchema,
  updateSchema: atlasCategoryUpdateSchema,
  campaignColumn: atlasCategories.campaignId,
  orderBy: { column: atlasCategories.sortOrder, dir: "asc" },
});
