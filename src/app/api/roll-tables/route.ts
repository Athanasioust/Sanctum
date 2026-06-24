import { rollTables } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { rollTableCreateSchema, rollTableUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: rollTables,
  idColumn: rollTables.id,
  createSchema: rollTableCreateSchema,
  updateSchema: rollTableUpdateSchema,
  campaignColumn: rollTables.campaignId,
  orderBy: { column: rollTables.name, dir: "asc" },
});
