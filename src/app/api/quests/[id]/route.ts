import { quests } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { questCreateSchema, questUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: quests,
  idColumn: quests.id,
  createSchema: questCreateSchema,
  updateSchema: questUpdateSchema,
});
