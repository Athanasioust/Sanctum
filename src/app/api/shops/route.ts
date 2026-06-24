import { shops } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { shopCreateSchema, shopUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: shops,
  idColumn: shops.id,
  createSchema: shopCreateSchema,
  updateSchema: shopUpdateSchema,
  campaignColumn: shops.campaignId,
  orderBy: { column: shops.name, dir: "asc" },
});
