import { magicItems } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { magicItemCreateSchema, magicItemUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: magicItems,
  idColumn: magicItems.id,
  createSchema: magicItemCreateSchema,
  updateSchema: magicItemUpdateSchema,
  campaignColumn: magicItems.campaignId,
  orderBy: { column: magicItems.name, dir: "asc" },
});
