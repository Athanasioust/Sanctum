import { factions } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { factionCreateSchema, factionUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: factions,
  idColumn: factions.id,
  createSchema: factionCreateSchema,
  updateSchema: factionUpdateSchema,
});
