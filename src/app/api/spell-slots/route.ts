import { spellSlots } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { spellSlotCreateSchema, spellSlotUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: spellSlots,
  idColumn: spellSlots.id,
  createSchema: spellSlotCreateSchema,
  updateSchema: spellSlotUpdateSchema,
  numericFilterColumns: { ownerId: spellSlots.ownerId },
  filterColumns: { ownerType: spellSlots.ownerType },
  orderBy: { column: spellSlots.slotLevel, dir: "asc" },
});
