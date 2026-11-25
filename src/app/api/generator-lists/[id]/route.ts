import { generatorLists } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { generatorListCreateSchema, generatorListUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: generatorLists,
  idColumn: generatorLists.id,
  createSchema: generatorListCreateSchema,
  updateSchema: generatorListUpdateSchema,
});
