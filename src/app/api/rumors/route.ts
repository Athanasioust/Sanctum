import { rumors } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { rumorCreateSchema, rumorUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: rumors,
  idColumn: rumors.id,
  createSchema: rumorCreateSchema,
  updateSchema: rumorUpdateSchema,
  campaignColumn: rumors.campaignId,
  orderBy: { column: rumors.createdAt, dir: "desc" },
});
