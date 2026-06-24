import { sessionPreps } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import {
  sessionPrepCreateSchema,
  sessionPrepUpdateSchema,
} from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: sessionPreps,
  idColumn: sessionPreps.id,
  createSchema: sessionPrepCreateSchema,
  updateSchema: sessionPrepUpdateSchema,
});
