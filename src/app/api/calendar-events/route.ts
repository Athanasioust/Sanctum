import { calendarEvents } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import {
  calendarEventCreateSchema,
  calendarEventUpdateSchema,
} from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: calendarEvents,
  idColumn: calendarEvents.id,
  createSchema: calendarEventCreateSchema,
  updateSchema: calendarEventUpdateSchema,
  campaignColumn: calendarEvents.campaignId,
  orderBy: { column: calendarEvents.createdAt, dir: "desc" },
});
