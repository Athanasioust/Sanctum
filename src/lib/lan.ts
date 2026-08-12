import "server-only";
import { execFileSync, spawnSync } from "node:child_process";
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

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

/**
 * Whether the running server can actually be reached from another device.
 *
 * The packaged shell pins HOSTNAME to 127.0.0.1 (sharing off) or 0.0.0.0
 * (sharing on). `next dev` and `next start` leave it unset and bind every
 * interface, so an unset value means reachable — testing for a literal
 * "0.0.0.0" reported dev servers as unreachable even though phones could open
 * them, which made the settings page nag for a restart that changes nothing.
 */
export function servingOnNetwork(): boolean {
  const host = process.env.HOSTNAME?.trim().toLowerCase();
  return !host || !LOOPBACK_HOSTS.has(host);
}

/* -------------------------------------------------------------------------- */
/* Windows Firewall                                                           */

/**
 * Binding to every interface is only half the job on Windows: the firewall
 * drops inbound connections to Sanctum until it is allowed through, and a
 * dropped connection is invisible from the other end. The phone spins on a
 * blank page and eventually reports that the site cannot be reached, which
 * looks exactly like a bug in the player view.
 *
 * Worse, the "allow access?" prompt Windows shows the first time the server
 * binds writes a permanent **Block** rule named after the app if it is
 * dismissed (or if the app exits while it is still on screen). After that no
 * prompt ever appears again and nothing on the network can connect. So Sanctum
 * keeps its own separately named rule: the distinct name tells our allow rule
 * apart from the one Windows may have written to block us, and the fix below
 * clears that blocking rule before adding ours — a block rule always wins over
 * an allow rule, so deleting it is what actually unsticks the connection.
 */
const OUR_RULE_NAME = "Sanctum player view sharing";
const WINDOWS_RULE_NAME = "Sanctum";

/**
 * "allowed" means *we* put the rule there, so it is known good. Anything else
 * is "unknown" rather than "blocked": the DM may well have clicked Allow on
 * Windows' own prompt, which writes a differently named rule that works fine,
 * and reading the action out of netsh to tell allow from block would mean
 * parsing localized text. The UI offers the fix instead of asserting a fault.
 */
export type FirewallState = "allowed" | "unknown" | "unsupported";

/** The executable the firewall rule has to name: the one holding the socket. */
function serverExecutable(): string {
  return process.execPath;
}

/**
 * Whether our own inbound rule exists for this executable.
 *
 * Matches on the program path in netsh's output rather than on any field
 * label, because netsh prints localized field names ("Action", "Ενέργεια") but
 * a path is a path. A missing rule exits non-zero.
 */
export function firewallState(): FirewallState {
  if (process.platform !== "win32") return "unsupported";
  try {
    const out = execFileSync(
      "netsh",
      [
        "advfirewall",
        "firewall",
        "show",
        "rule",
        `name=${OUR_RULE_NAME}`,
        "dir=in",
        "verbose",
      ],
      { encoding: "utf8", timeout: 10_000, windowsHide: true },
    );
    return out.toLowerCase().includes(serverExecutable().toLowerCase())
      ? "allowed"
      : "unknown";
  } catch {
    return "unknown";
  }
}

/** Raised when the firewall change could not be made, with a reason to show. */
export class FirewallError extends Error {}

/**
 * Allow Sanctum through the firewall for private networks.
 *
 * Changing firewall rules needs administrator rights, so this raises a UAC
 * prompt; declining it changes nothing and is reported as such. The rule is
 * scoped to private and domain networks on purpose — sharing is meant for the
 * home Wi-Fi the table is sitting on, not for the café.
 */
export function allowThroughFirewall(): void {
  if (process.platform !== "win32") {
    throw new FirewallError("Only Windows needs a firewall rule for this.");
  }

  const exe = serverExecutable();
  const script = [
    "@echo off",
    // The install path can contain non-ASCII characters (any account name can);
    // without UTF-8 cmd would hand netsh a mangled path and the rule would name
    // an executable that does not exist.
    "chcp 65001 >nul",
    // The rule Windows writes itself is the one that may be set to Block, and
    // a block always beats an allow — it has to go before ours goes in. Both
    // deletions are scoped by program, so no unrelated rule is touched.
    `netsh advfirewall firewall delete rule name="${WINDOWS_RULE_NAME}" program="${exe}" >nul 2>&1`,
    `netsh advfirewall firewall delete rule name="${OUR_RULE_NAME}" program="${exe}" >nul 2>&1`,
    `netsh advfirewall firewall add rule name="${OUR_RULE_NAME}" dir=in action=allow ` +
      `program="${exe}" enable=yes profile=private,domain`,
    "exit /b %errorlevel%",
  ].join("\r\n");

  // Written to the per-user temp directory (not a shared one) because it is
  // about to be run elevated.
  const scriptPath = path.join(os.tmpdir(), `sanctum-firewall-${process.pid}.bat`);
  fs.writeFileSync(scriptPath, script, "utf8");

  try {
    const quoted = scriptPath.replace(/'/g, "''");
    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-WindowStyle",
        "Hidden",
        "-Command",
        `try { $p = Start-Process -FilePath '${quoted}' -Verb RunAs -WindowStyle Hidden ` +
          `-Wait -PassThru -ErrorAction Stop; exit $p.ExitCode } catch { exit 1223 }`,
      ],
      { encoding: "utf8", timeout: 120_000, windowsHide: true },
    );

    // 1223 is ERROR_CANCELLED: the administrator prompt was dismissed.
    if (result.status === 1223) {
      throw new FirewallError(
        "Windows needs permission to change firewall rules — the prompt was cancelled.",
      );
    }
    if (result.status !== 0) {
      throw new FirewallError(
        "Windows would not add the firewall rule. You can add it by hand: allow " +
          "inbound connections for Sanctum on private networks.",
      );
    }
  } finally {
    fs.rmSync(scriptPath, { force: true });
  }
}
