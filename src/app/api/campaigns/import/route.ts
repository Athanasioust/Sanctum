import { apiRoute, json, readJson } from "@/lib/api";
import { importCampaign } from "@/lib/campaign-data";

export const POST = apiRoute(async (req) => {
  const body = await readJson(req);
  const id = await importCampaign(body);
  return json({ id }, 201);
});
