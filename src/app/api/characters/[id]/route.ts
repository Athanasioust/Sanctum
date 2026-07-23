import { characters, spells, spellSlots, inventoryItems } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { characterCreateSchema, characterUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: characters,
  idColumn: characters.id,
  createSchema: characterCreateSchema,
  updateSchema: characterUpdateSchema,
  // Spells, spell slots and inventory are owner-scoped (polymorphic, no FK), so
  // clean them up on delete to avoid orphaned rows.
  ownerTypeValue: "character",
  cascadeOwned: [
    { table: spells, ownerIdColumn: spells.ownerId, ownerTypeColumn: spells.ownerType },
    { table: spellSlots, ownerIdColumn: spellSlots.ownerId, ownerTypeColumn: spellSlots.ownerType },
    { table: inventoryItems, ownerIdColumn: inventoryItems.ownerId, ownerTypeColumn: inventoryItems.ownerType },
  ],
});
