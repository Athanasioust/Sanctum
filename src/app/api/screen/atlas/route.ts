import { ApiError, apiRoute, json } from "@/lib/api";
import { loadPlayerAtlas } from "@/lib/atlas/server";

/**
 * The atlas as the player view may see it. Filtering happens here, on the
 * server: hidden and fogged markers, DM notes and record links are never in
 * the response, and a fogged map's image is the fog-burned render.
 */
export const GET = apiRoute(async (req) => {
  const url = new URL(req.url);
  const campaignId = Number(url.searchParams.get("campaignId"));
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw new ApiError("campaignId is required", 400);
  }
  const mapId = Number(url.searchParams.get("mapId"));
  return json(await loadPlayerAtlas(campaignId, Number.isInteger(mapId) && mapId > 0 ? mapId : null));
});
