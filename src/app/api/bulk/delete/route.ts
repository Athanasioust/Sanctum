import { z } from "zod";
import { apiRoute, json, parseBody, readJson } from "@/lib/api";
import { BULK_ENTITIES, bulkDelete } from "@/lib/bulk";

const schema = z.object({
  entity: z.enum(BULK_ENTITIES),
  campaignId: z.number().int().positive(),
  ids: z.array(z.number().int().positive()).min(1).max(1000),
});

/** Delete several rows at once; the response carries an undo token. */
export const POST = apiRoute(async (req) => {
  const { entity, campaignId, ids } = parseBody(schema, await readJson(req));
  return json(bulkDelete(entity, campaignId, ids));
});
