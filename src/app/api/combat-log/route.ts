import { combatLogEntries } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { combatLogEntryCreateSchema, combatLogEntryUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: combatLogEntries,
  idColumn: combatLogEntries.id,
  createSchema: combatLogEntryCreateSchema,
  updateSchema: combatLogEntryUpdateSchema,
  numericFilterColumns: { encounterId: combatLogEntries.encounterId },
  orderBy: { column: combatLogEntries.createdAt, dir: "asc" },
});
