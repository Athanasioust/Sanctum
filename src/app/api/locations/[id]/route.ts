import { locations } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { locationCreateSchema, locationUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: locations,
  idColumn: locations.id,
  createSchema: locationCreateSchema,
  updateSchema: locationUpdateSchema,
});
