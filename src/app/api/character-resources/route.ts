import { characterResources } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import {
  characterResourceCreateSchema,
  characterResourceUpdateSchema,
} from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: characterResources,
  idColumn: characterResources.id,
  createSchema: characterResourceCreateSchema,
  updateSchema: characterResourceUpdateSchema,
  numericFilterColumns: { characterId: characterResources.characterId },
  orderBy: { column: characterResources.id, dir: "asc" },
});
