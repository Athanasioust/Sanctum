import { soundAssets } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { soundAssetCreateSchema, soundAssetUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: soundAssets,
  idColumn: soundAssets.id,
  createSchema: soundAssetCreateSchema,
  updateSchema: soundAssetUpdateSchema,
  campaignColumn: soundAssets.campaignId,
  filterColumns: { category: soundAssets.category },
  orderBy: { column: soundAssets.name, dir: "asc" },
});
