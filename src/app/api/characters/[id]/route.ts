import { characters } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { characterCreateSchema, characterUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: characters,
  idColumn: characters.id,
  createSchema: characterCreateSchema,
  updateSchema: characterUpdateSchema,
});
