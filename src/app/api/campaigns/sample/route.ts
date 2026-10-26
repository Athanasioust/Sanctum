import { apiRoute, json } from "@/lib/api";
import { importCampaign } from "@/lib/campaign-data";
import sample from "@/lib/sample-campaign.json";

/**
 * Create "The Lost Souls (Sample)" from the bundle shipped with the app, so a
 * first launch lands in a populated campaign instead of an empty screen. It
 * goes through the ordinary import path, so it is a normal campaign the DM can
 * change or delete like any other.
 */
export const POST = apiRoute(async () => {
  const id = await importCampaign(sample);
  return json({ id }, 201);
});
