import { magicItems } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { magicItemCreateSchema, magicItemUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: magicItems,
  idColumn: magicItems.id,
  createSchema: magicItemCreateSchema,
  updateSchema: magicItemUpdateSchema,
});
