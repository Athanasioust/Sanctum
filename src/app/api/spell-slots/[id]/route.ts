import { spellSlots } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { spellSlotCreateSchema, spellSlotUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: spellSlots,
  idColumn: spellSlots.id,
  createSchema: spellSlotCreateSchema,
  updateSchema: spellSlotUpdateSchema,
});
