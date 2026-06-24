import { storyEvents } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { storyEventCreateSchema, storyEventUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: storyEvents,
  idColumn: storyEvents.id,
  createSchema: storyEventCreateSchema,
  updateSchema: storyEventUpdateSchema,
  campaignColumn: storyEvents.campaignId,
  filterColumns: { eventType: storyEvents.eventType },
  orderBy: { column: storyEvents.createdAt, dir: "desc" },
});
