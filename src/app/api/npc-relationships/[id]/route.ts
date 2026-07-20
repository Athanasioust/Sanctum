import { npcRelationships } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { npcRelationshipCreateSchema, npcRelationshipUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: npcRelationships,
  idColumn: npcRelationships.id,
  createSchema: npcRelationshipCreateSchema,
  updateSchema: npcRelationshipUpdateSchema,
});
