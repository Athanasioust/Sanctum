import { z } from "zod";
import { apiRoute, json, parseBody, readJson } from "@/lib/api";
import {
  firewallState,
  lanAddresses,
  readLanConfig,
  servingOnNetwork,
  writeLanConfig,
} from "@/lib/lan";

const lanUpdateSchema = z
  .object({
    enabled: z.boolean().optional(),
    allowPlayerTokenMoves: z.boolean().optional(),
  })
  .refine((v) => v.enabled !== undefined || v.allowPlayerTokenMoves !== undefined, {
    message: "Nothing to update",
  });

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
    allowPlayerTokenMoves: config.allowPlayerTokenMoves,
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
  const patch = parseBody(lanUpdateSchema, await readJson(req));
  const current = readLanConfig();
  const next = {
    enabled: patch.enabled ?? current.enabled,
    allowPlayerTokenMoves: patch.allowPlayerTokenMoves ?? current.allowPlayerTokenMoves,
  };
  writeLanConfig(next);
  // Only the bind address needs a restart; the token-move switch is read on
  // every request.
  return json({ ...next, restartRequired: next.enabled !== current.enabled });
});
