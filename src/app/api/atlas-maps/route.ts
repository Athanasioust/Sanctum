import { atlasMaps } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { atlasMapCreateSchema, atlasMapUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: atlasMaps,
  idColumn: atlasMaps.id,
  createSchema: atlasMapCreateSchema,
  updateSchema: atlasMapUpdateSchema,
  campaignColumn: atlasMaps.campaignId,
  numericFilterColumns: { parentMapId: atlasMaps.parentMapId },
  orderBy: { column: atlasMaps.name, dir: "asc" },
});
