import { atlasMarkers } from "@/db/schema";
import { collectionHandlers } from "@/lib/crud";
import { atlasMarkerCreateSchema, atlasMarkerUpdateSchema } from "@/lib/validators";

export const { GET, POST } = collectionHandlers({
  table: atlasMarkers,
  idColumn: atlasMarkers.id,
  createSchema: atlasMarkerCreateSchema,
  updateSchema: atlasMarkerUpdateSchema,
  numericFilterColumns: { mapId: atlasMarkers.mapId },
  orderBy: { column: atlasMarkers.id, dir: "asc" },
});
