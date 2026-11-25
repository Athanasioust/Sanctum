import { generatorLists } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { generatorListCreateSchema, generatorListUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: generatorLists,
  idColumn: generatorLists.id,
  createSchema: generatorListCreateSchema,
  updateSchema: generatorListUpdateSchema,
  campaignColumn: generatorLists.campaignId,
  filterColumns: { generatorId: generatorLists.generatorId },
  orderBy: { column: generatorLists.fieldKey, dir: "asc" },
});
