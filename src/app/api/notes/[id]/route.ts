import { notes } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { noteCreateSchema, noteUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: notes,
  idColumn: notes.id,
  createSchema: noteCreateSchema,
  updateSchema: noteUpdateSchema,
});
