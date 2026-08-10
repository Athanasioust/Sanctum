import { soundAssets } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { soundAssetCreateSchema, soundAssetUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: soundAssets,
  idColumn: soundAssets.id,
  createSchema: soundAssetCreateSchema,
  updateSchema: soundAssetUpdateSchema,
});
