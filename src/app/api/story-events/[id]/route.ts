import { storyEvents } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { storyEventCreateSchema, storyEventUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: storyEvents,
  idColumn: storyEvents.id,
  createSchema: storyEventCreateSchema,
  updateSchema: storyEventUpdateSchema,
});
