import { sessionPreps } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import {
  sessionPrepCreateSchema,
  sessionPrepUpdateSchema,
} from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: sessionPreps,
  idColumn: sessionPreps.id,
  createSchema: sessionPrepCreateSchema,
  updateSchema: sessionPrepUpdateSchema,
  campaignColumn: sessionPreps.campaignId,
  orderBy: { column: sessionPreps.sessionNumber, dir: "desc" },
});
