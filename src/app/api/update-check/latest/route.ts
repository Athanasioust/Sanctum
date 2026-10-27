import { apiRoute, json } from "@/lib/api";
import { checkForUpdate } from "@/lib/update-check";

/**
 * A newer release to mention, or `{ update: null }`. Asks GitHub only when the
 * DM has opted in, at most once per launch, and never fails loudly.
 */
export const GET = apiRoute(async () => json({ update: await checkForUpdate() }));
