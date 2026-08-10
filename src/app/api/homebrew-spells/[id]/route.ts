import { homebrewSpells } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { homebrewSpellCreateSchema, homebrewSpellUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: homebrewSpells,
  idColumn: homebrewSpells.id,
  createSchema: homebrewSpellCreateSchema,
  updateSchema: homebrewSpellUpdateSchema,
});
