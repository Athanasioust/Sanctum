import { npcs } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { npcCreateSchema, npcUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: npcs,
  idColumn: npcs.id,
  createSchema: npcCreateSchema,
  updateSchema: npcUpdateSchema,
});
