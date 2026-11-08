import { ApiError, apiRoute, json } from "@/lib/api";
import { loadPlayerScreenState } from "@/lib/screen/state";

/**
 * Everything the player view shows except the world atlas (which has its own
 * `/api/screen/atlas`), already filtered on the server: only the battle map
 * being shown, with hidden and fogged tokens, fogged annotations and the
 * un-fogged image left out; revealed handouts and clocks only; the live
 * encounter with monsters' health as a band; and the party's HP and AC.
 */
export const GET = apiRoute(async (req) => {
  const campaignId = Number(new URL(req.url).searchParams.get("campaignId"));
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw new ApiError("campaignId is required", 400);
  }
  return json(await loadPlayerScreenState(campaignId));
});
