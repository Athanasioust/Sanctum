import { ApiError, apiRoute, json } from "@/lib/api";
import { FirewallError, allowThroughFirewall, firewallState } from "@/lib/lan";

/**
 * Allow Sanctum through the Windows Firewall so players can actually reach it.
 *
 * Only ever called from the sharing card in Settings, because it raises a UAC
 * prompt: the DM asks for it, the DM sees the prompt. The reported state comes
 * from re-reading the rules afterwards rather than from assuming success.
 */
export const POST = apiRoute(async () => {
  try {
    allowThroughFirewall();
  } catch (err) {
    if (err instanceof FirewallError) throw new ApiError(err.message, 409);
    throw err;
  }
  return json({ firewall: firewallState() });
});
