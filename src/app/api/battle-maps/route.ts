import { battleMaps } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { battleMapCreateSchema, battleMapUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: battleMaps,
  idColumn: battleMaps.id,
  createSchema: battleMapCreateSchema,
  updateSchema: battleMapUpdateSchema,
  campaignColumn: battleMaps.campaignId,
  numericFilterColumns: { encounterId: battleMaps.encounterId },
  orderBy: { column: battleMaps.updatedAt, dir: "desc" },
});
