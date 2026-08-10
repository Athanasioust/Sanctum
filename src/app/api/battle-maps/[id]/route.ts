import { battleMaps } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { battleMapCreateSchema, battleMapUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: battleMaps,
  idColumn: battleMaps.id,
  createSchema: battleMapCreateSchema,
  updateSchema: battleMapUpdateSchema,
});
