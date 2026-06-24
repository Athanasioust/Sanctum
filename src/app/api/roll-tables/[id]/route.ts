import { rollTables } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { rollTableCreateSchema, rollTableUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: rollTables,
  idColumn: rollTables.id,
  createSchema: rollTableCreateSchema,
  updateSchema: rollTableUpdateSchema,
});
