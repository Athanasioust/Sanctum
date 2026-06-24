import { shops } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { shopCreateSchema, shopUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: shops,
  idColumn: shops.id,
  createSchema: shopCreateSchema,
  updateSchema: shopUpdateSchema,
});
