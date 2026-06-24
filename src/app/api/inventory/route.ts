import { inventoryItems } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import {
  inventoryItemCreateSchema,
  inventoryItemUpdateSchema,
} from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: inventoryItems,
  idColumn: inventoryItems.id,
  createSchema: inventoryItemCreateSchema,
  updateSchema: inventoryItemUpdateSchema,
  numericFilterColumns: { ownerId: inventoryItems.ownerId },
  filterColumns: { ownerType: inventoryItems.ownerType },
  orderBy: { column: inventoryItems.createdAt, dir: "asc" },
});
