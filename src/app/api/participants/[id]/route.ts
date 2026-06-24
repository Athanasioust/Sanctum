import { combatParticipants } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import {
  participantCreateSchema,
  participantUpdateSchema,
} from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: combatParticipants,
  idColumn: combatParticipants.id,
  createSchema: participantCreateSchema,
  updateSchema: participantUpdateSchema,
});
