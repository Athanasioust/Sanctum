import { combatLogEntries } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { combatLogEntryCreateSchema, combatLogEntryUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: combatLogEntries,
  idColumn: combatLogEntries.id,
  createSchema: combatLogEntryCreateSchema,
  updateSchema: combatLogEntryUpdateSchema,
});
