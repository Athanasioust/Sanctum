import { homebrewFeats } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { homebrewFeatCreateSchema, homebrewFeatUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: homebrewFeats,
  idColumn: homebrewFeats.id,
  createSchema: homebrewFeatCreateSchema,
  updateSchema: homebrewFeatUpdateSchema,
});
