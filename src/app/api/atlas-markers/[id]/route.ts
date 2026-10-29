import { atlasMarkers } from "@/db/schema";
import { itemHandlers } from "@/lib/crud";
import { atlasMarkerCreateSchema, atlasMarkerUpdateSchema } from "@/lib/validators";

export const { GET, PATCH, DELETE } = itemHandlers({
  table: atlasMarkers,
  idColumn: atlasMarkers.id,
  createSchema: atlasMarkerCreateSchema,
  updateSchema: atlasMarkerUpdateSchema,
});
