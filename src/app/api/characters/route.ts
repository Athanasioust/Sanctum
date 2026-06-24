import { characters } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { characterCreateSchema, characterUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: characters,
  idColumn: characters.id,
  createSchema: characterCreateSchema,
  updateSchema: characterUpdateSchema,
  campaignColumn: characters.campaignId,
  orderBy: { column: characters.name, dir: "asc" },
});
