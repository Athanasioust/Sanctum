import { homebrewSpells } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { homebrewSpellCreateSchema, homebrewSpellUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: homebrewSpells,
  idColumn: homebrewSpells.id,
  createSchema: homebrewSpellCreateSchema,
  updateSchema: homebrewSpellUpdateSchema,
  campaignColumn: homebrewSpells.campaignId,
  orderBy: { column: homebrewSpells.name, dir: "asc" },
});
