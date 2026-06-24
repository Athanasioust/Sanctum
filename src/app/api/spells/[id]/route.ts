import { spells } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { spellCreateSchema, spellUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: spells,
  idColumn: spells.id,
  createSchema: spellCreateSchema,
  updateSchema: spellUpdateSchema,
});
