import { handouts } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { handoutCreateSchema, handoutUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: handouts,
  idColumn: handouts.id,
  createSchema: handoutCreateSchema,
  updateSchema: handoutUpdateSchema,
  campaignColumn: handouts.campaignId,
  orderBy: { column: handouts.sortOrder, dir: "asc" },
});
