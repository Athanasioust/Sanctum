import { inventoryItems } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import {
  inventoryItemCreateSchema,
  inventoryItemUpdateSchema,
} from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: inventoryItems,
  idColumn: inventoryItems.id,
  createSchema: inventoryItemCreateSchema,
  updateSchema: inventoryItemUpdateSchema,
});
