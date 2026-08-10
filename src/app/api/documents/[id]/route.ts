import { documents } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { documentCreateSchema, documentUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: documents,
  idColumn: documents.id,
  createSchema: documentCreateSchema,
  updateSchema: documentUpdateSchema,
});
