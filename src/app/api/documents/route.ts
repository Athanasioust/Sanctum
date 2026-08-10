import { documents } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { documentCreateSchema, documentUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: documents,
  idColumn: documents.id,
  createSchema: documentCreateSchema,
  updateSchema: documentUpdateSchema,
  campaignColumn: documents.campaignId,
  orderBy: { column: documents.name, dir: "asc" },
});
