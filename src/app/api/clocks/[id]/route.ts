import { clocks } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { clockCreateSchema, clockUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: clocks,
  idColumn: clocks.id,
  createSchema: clockCreateSchema,
  updateSchema: clockUpdateSchema,
});
