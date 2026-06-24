import { factions } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { factionCreateSchema, factionUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: factions,
  idColumn: factions.id,
  createSchema: factionCreateSchema,
  updateSchema: factionUpdateSchema,
  campaignColumn: factions.campaignId,
  orderBy: { column: factions.name, dir: "asc" },
});
