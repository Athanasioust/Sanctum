import { rumors } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { rumorCreateSchema, rumorUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: rumors,
  idColumn: rumors.id,
  createSchema: rumorCreateSchema,
  updateSchema: rumorUpdateSchema,
});
