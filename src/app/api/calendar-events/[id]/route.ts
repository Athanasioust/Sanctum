import { calendarEvents } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import {
  calendarEventCreateSchema,
  calendarEventUpdateSchema,
} from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: calendarEvents,
  idColumn: calendarEvents.id,
  createSchema: calendarEventCreateSchema,
  updateSchema: calendarEventUpdateSchema,
});
