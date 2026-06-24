import { notes } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { noteCreateSchema, noteUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: notes,
  idColumn: notes.id,
  createSchema: noteCreateSchema,
  updateSchema: noteUpdateSchema,
  campaignColumn: notes.campaignId,
  orderBy: { column: notes.updatedAt, dir: "desc" },
});
