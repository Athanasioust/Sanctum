import { mindMaps } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { mindMapCreateSchema, mindMapUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: mindMaps,
  idColumn: mindMaps.id,
  createSchema: mindMapCreateSchema,
  updateSchema: mindMapUpdateSchema,
});
