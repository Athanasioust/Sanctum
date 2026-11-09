import { apiRoute, json } from "@/lib/api";
import { ensureSampleCampaign } from "@/lib/sample-campaign";

/**
 * Create the sample campaign from the bundle shipped with the app, or return
 * the one this install already created. It goes through the ordinary import
 * path, so it is a normal campaign the DM can change or delete like any other
 * (deleting it means the next request seeds a fresh copy).
 */
export const POST = apiRoute(async () => {
  const sample = await ensureSampleCampaign();
  return json(sample, sample.created ? 201 : 200);
});
