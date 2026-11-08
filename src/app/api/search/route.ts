import { apiRoute, json, ApiError } from "@/lib/api";
import { searchCampaign } from "@/lib/search";
import type { SearchResult } from "@/lib/search/types";

export type { SearchResult } from "@/lib/search/types";

/**
 * Global search: every record type in the campaign, matched on its name and
 * its body text. See `src/lib/search` for the index.
 */
export const GET = apiRoute(async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const campaignId = Number(url.searchParams.get("campaignId"));

  if (!q || q.length < 2) return json<SearchResult[]>([]);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw new ApiError("campaignId is required", 400);
  }

  return json(await searchCampaign(campaignId, q.slice(0, 200)));
});
