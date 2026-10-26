import { clocks } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { clockCreateSchema, clockUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: clocks,
  idColumn: clocks.id,
  createSchema: clockCreateSchema,
  updateSchema: clockUpdateSchema,
  campaignColumn: clocks.campaignId,
  orderBy: { column: clocks.createdAt, dir: "asc" },
});
