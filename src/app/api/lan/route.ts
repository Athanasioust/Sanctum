import { z } from "zod";
import { apiRoute, json, parseBody, readJson } from "@/lib/api";
import { lanAddresses, readLanConfig, writeLanConfig } from "@/lib/lan";

const lanUpdateSchema = z.object({ enabled: z.boolean() });

/**
 * Current local-network sharing state, plus what the player-view URL would be.
 *
 * `addresses` is reported whether or not sharing is on, so the settings page
 * can show what the URL will be before the DM commits to a restart.
 */
export const GET = apiRoute(async (req) => {
  const config = readLanConfig();
  const url = new URL(req.url);
  return json({
    enabled: config.enabled,
    addresses: lanAddresses(),
    port: Number(url.port) || (url.protocol === "https:" ? 443 : 80),
    // Whether the running server is actually reachable from the network, which
    // only becomes true after a restart with sharing enabled.
    active: process.env.HOSTNAME === "0.0.0.0",
  });
});

export const PUT = apiRoute(async (req) => {
  const { enabled } = parseBody(lanUpdateSchema, await readJson(req));
  writeLanConfig({ enabled });
  return json({ enabled, restartRequired: true });
});
