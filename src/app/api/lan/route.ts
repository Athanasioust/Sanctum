import { z } from "zod";
import { apiRoute, json, parseBody, readJson } from "@/lib/api";
import {
  firewallState,
  lanAddresses,
  readLanConfig,
  servingOnNetwork,
  writeLanConfig,
} from "@/lib/lan";

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
    // Whether the running server is actually reachable from the network. In the
    // packaged app that only becomes true after a restart with sharing enabled;
    // a dev server binds every interface from the start.
    active: servingOnNetwork(),
    // Binding to the network is not enough on Windows — see lib/lan.ts.
    firewall: firewallState(),
  });
});

export const PUT = apiRoute(async (req) => {
  const { enabled } = parseBody(lanUpdateSchema, await readJson(req));
  writeLanConfig({ enabled });
  return json({ enabled, restartRequired: true });
});
