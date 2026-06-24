import { spells } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { spellCreateSchema, spellUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: spells,
  idColumn: spells.id,
  createSchema: spellCreateSchema,
  updateSchema: spellUpdateSchema,
  numericFilterColumns: { ownerId: spells.ownerId },
  filterColumns: { ownerType: spells.ownerType },
  orderBy: { column: spells.level, dir: "asc" },
});
