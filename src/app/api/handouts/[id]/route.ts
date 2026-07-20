import { handouts } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { handoutCreateSchema, handoutUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: handouts,
  idColumn: handouts.id,
  createSchema: handoutCreateSchema,
  updateSchema: handoutUpdateSchema,
});
