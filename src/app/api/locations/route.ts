import { locations } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { locationCreateSchema, locationUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: locations,
  idColumn: locations.id,
  createSchema: locationCreateSchema,
  updateSchema: locationUpdateSchema,
  campaignColumn: locations.campaignId,
  orderBy: { column: locations.name, dir: "asc" },
});
