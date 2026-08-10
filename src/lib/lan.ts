import "server-only";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DATA_ROOT_DIR } from "@/lib/paths";

/**
 * Local-network sharing for the player view.
 *
 * Sanctum normally binds to loopback only, so nothing it serves is reachable
 * from another machine. Turning this on binds the server to every interface so
 * players can open the read-only player view on their phones over the same
 * Wi-Fi — no account, no cloud, nothing leaving the LAN.
 *
 * It is deliberately **opt-in**. Binding to 0.0.0.0 exposes the whole app, not
 * just `/screen`, to every device on the network — fine on a home network,
 * not something to switch on silently in a café. The setting lives in a small
 * file next to the database because the Electron shell has to read it before
 * the server starts, and it only takes effect on restart.
 */

const CONFIG_PATH = path.join(DATA_ROOT_DIR, "lan.json");

export type LanConfig = { enabled: boolean };

const DEFAULT: LanConfig = { enabled: false };

export function readLanConfig(): LanConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<LanConfig>;
    return { enabled: parsed.enabled === true };
  } catch {
    // Missing or unreadable config means the safe default: loopback only.
    return { ...DEFAULT };
  }
}

export function writeLanConfig(config: LanConfig): void {
  fs.mkdirSync(DATA_ROOT_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

/**
 * This machine's LAN addresses, best first.
 *
 * Skips loopback, non-IPv4 and link-local (169.254.x) addresses, and sorts
 * private ranges ahead of anything else so a real router-assigned address wins
 * over a virtual adapter (Docker, WSL, VPN) when several are present.
 */
export function lanAddresses(): string[] {
  const found: string[] = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family !== "IPv4" || entry.internal) continue;
      if (entry.address.startsWith("169.254.")) continue;
      found.push(entry.address);
    }
  }

  const rank = (ip: string) => {
    if (ip.startsWith("192.168.")) return 0;
    if (ip.startsWith("10.")) return 1;
    // 172.16.0.0 – 172.31.255.255
    const m = /^172\.(\d+)\./.exec(ip);
    if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return 2;
    return 3;
  };

  return found.sort((a, b) => rank(a) - rank(b));
}

/** The URL players should open, given the port this server is listening on. */
export function playerViewUrl(address: string, port: number, campaignId: number): string {
  return `http://${address}:${port}/screen/${campaignId}`;
}
