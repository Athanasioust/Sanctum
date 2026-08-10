import { homebrewFeats } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { homebrewFeatCreateSchema, homebrewFeatUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: homebrewFeats,
  idColumn: homebrewFeats.id,
  createSchema: homebrewFeatCreateSchema,
  updateSchema: homebrewFeatUpdateSchema,
  campaignColumn: homebrewFeats.campaignId,
  orderBy: { column: homebrewFeats.name, dir: "asc" },
});
