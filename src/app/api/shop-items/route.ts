import { shopItems } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { shopItemCreateSchema, shopItemUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: shopItems,
  idColumn: shopItems.id,
  createSchema: shopItemCreateSchema,
  updateSchema: shopItemUpdateSchema,
  numericFilterColumns: { shopId: shopItems.shopId },
  orderBy: { column: shopItems.name, dir: "asc" },
});
