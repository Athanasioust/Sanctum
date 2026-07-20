import { quests } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { questCreateSchema, questUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: quests,
  idColumn: quests.id,
  createSchema: questCreateSchema,
  updateSchema: questUpdateSchema,
  campaignColumn: quests.campaignId,
  orderBy: { column: quests.createdAt, dir: "desc" },
});
