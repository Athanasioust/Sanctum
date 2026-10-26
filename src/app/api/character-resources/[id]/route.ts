import { characterResources } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import {
  characterResourceCreateSchema,
  characterResourceUpdateSchema,
} from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: characterResources,
  idColumn: characterResources.id,
  createSchema: characterResourceCreateSchema,
  updateSchema: characterResourceUpdateSchema,
});
