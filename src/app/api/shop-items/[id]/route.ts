import { shopItems } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { shopItemCreateSchema, shopItemUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: shopItems,
  idColumn: shopItems.id,
  createSchema: shopItemCreateSchema,
  updateSchema: shopItemUpdateSchema,
});
