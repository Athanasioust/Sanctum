import { npcs, spells, spellSlots, inventoryItems } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { npcCreateSchema, npcUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: npcs,
  idColumn: npcs.id,
  createSchema: npcCreateSchema,
  updateSchema: npcUpdateSchema,
  // Spells, spell slots and inventory are owner-scoped (polymorphic, no FK), so
  // clean them up on delete to avoid orphaned rows.
  ownerTypeValue: "npc",
  cascadeOwned: [
    { table: spells, ownerIdColumn: spells.ownerId, ownerTypeColumn: spells.ownerType },
    { table: spellSlots, ownerIdColumn: spellSlots.ownerId, ownerTypeColumn: spellSlots.ownerType },
    { table: inventoryItems, ownerIdColumn: inventoryItems.ownerId, ownerTypeColumn: inventoryItems.ownerType },
  ],
});
