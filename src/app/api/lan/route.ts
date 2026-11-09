import { z } from "zod";
import { apiRoute, json, parseBody, readJson } from "@/lib/api";
import {
  firewallState,
  lanAddresses,
  newShareToken,
  readLanConfigWithToken,
  servingOnNetwork,
  writeLanConfig,
} from "@/lib/lan";

const lanUpdateSchema = z
  .object({
    enabled: z.boolean().optional(),
    allowPlayerTokenMoves: z.boolean().optional(),
    /** Mint a new share token, invalidating every link and cookie out there. */
    regenerateToken: z.literal(true).optional(),
  })
  .refine(
    (v) =>
      v.enabled !== undefined ||
      v.allowPlayerTokenMoves !== undefined ||
      v.regenerateToken !== undefined,
    { message: "Nothing to update" },
  );

/**
 * Current local-network sharing state, plus what the player-view URL would be.
 *
 * `addresses` is reported whether or not sharing is on, so the settings page
 * can show what the URL will be before the DM commits to a restart.
 *
 * This route hands out the share token, which is safe only because the LAN
 * guard (`scripts/lan-guard.cjs`) refuses it to every device but the DM's own.
 */
export const GET = apiRoute(async (req) => {
  const config = readLanConfigWithToken();
  const url = new URL(req.url);
  return json({
    enabled: config.enabled,
    allowPlayerTokenMoves: config.allowPlayerTokenMoves,
    shareToken: config.enabled ? config.shareToken : null,
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
  const current = readLanConfigWithToken();
  const enabled = patch.enabled ?? current.enabled;
  const next = {
    enabled,
    allowPlayerTokenMoves: patch.allowPlayerTokenMoves ?? current.allowPlayerTokenMoves,
    // Turning sharing on gets a token if there isn't one; the guard reads the
    // file on every request, so a regenerated token applies at once.
    shareToken:
      patch.regenerateToken || (enabled && !current.shareToken)
        ? newShareToken()
        : current.shareToken,
  };
  writeLanConfig(next);
  // Only the bind address needs a restart; the token-move switch and the share
  // token are read on every request.
  return json({
    enabled: next.enabled,
    allowPlayerTokenMoves: next.allowPlayerTokenMoves,
    shareToken: next.enabled ? next.shareToken : null,
    restartRequired: next.enabled !== current.enabled,
  });
});
