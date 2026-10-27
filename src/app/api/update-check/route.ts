import { z } from "zod";
import { apiRoute, json, parseBody, readJson } from "@/lib/api";
import {
  parseReleaseVersion,
  setUpdateCheckEnabled,
  skipVersion,
  updateCheckEnabled,
} from "@/lib/update-check";

const updateCheckSchema = z
  .object({
    enabled: z.boolean().optional(),
    /** "Skip this version": never mention this release (or older) again. */
    skipVersion: z.string().max(32).optional(),
  })
  .strict();

/** Whether the DM has opted in to the update check. Off until they do. */
export const GET = apiRoute(async () => json({ enabled: updateCheckEnabled() }));

export const PUT = apiRoute(async (req) => {
  const patch = parseBody(updateCheckSchema, await readJson(req));
  if (patch.enabled !== undefined) setUpdateCheckEnabled(patch.enabled);
  const skipped = parseReleaseVersion(patch.skipVersion);
  if (skipped) skipVersion(skipped);
  return json({ enabled: updateCheckEnabled() });
});
