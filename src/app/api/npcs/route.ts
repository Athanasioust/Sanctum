import { npcs } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { npcCreateSchema, npcUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: npcs,
  idColumn: npcs.id,
  createSchema: npcCreateSchema,
  updateSchema: npcUpdateSchema,
  campaignColumn: npcs.campaignId,
  filterColumns: { type: npcs.type },
  orderBy: { column: npcs.name, dir: "asc" },
});
