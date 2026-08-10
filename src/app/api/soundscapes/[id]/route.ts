import { soundscapes } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { soundscapeCreateSchema, soundscapeUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: soundscapes,
  idColumn: soundscapes.id,
  createSchema: soundscapeCreateSchema,
  updateSchema: soundscapeUpdateSchema,
});
