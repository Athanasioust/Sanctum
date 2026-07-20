import { npcRelationships } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { npcRelationshipCreateSchema, npcRelationshipUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: npcRelationships,
  idColumn: npcRelationships.id,
  createSchema: npcRelationshipCreateSchema,
  updateSchema: npcRelationshipUpdateSchema,
  campaignColumn: npcRelationships.campaignId,
  orderBy: { column: npcRelationships.createdAt, dir: "desc" },
});
