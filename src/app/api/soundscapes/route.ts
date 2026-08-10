import { soundscapes } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { soundscapeCreateSchema, soundscapeUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: soundscapes,
  idColumn: soundscapes.id,
  createSchema: soundscapeCreateSchema,
  updateSchema: soundscapeUpdateSchema,
  campaignColumn: soundscapes.campaignId,
  orderBy: { column: soundscapes.name, dir: "asc" },
});
