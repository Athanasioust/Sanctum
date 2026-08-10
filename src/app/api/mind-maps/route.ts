import { mindMaps } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { mindMapCreateSchema, mindMapUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: mindMaps,
  idColumn: mindMaps.id,
  createSchema: mindMapCreateSchema,
  updateSchema: mindMapUpdateSchema,
  campaignColumn: mindMaps.campaignId,
  orderBy: { column: mindMaps.updatedAt, dir: "desc" },
});
