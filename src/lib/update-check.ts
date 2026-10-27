import "server-only";
import { getSetting, setSetting } from "@/lib/app-settings";
import { APP_VERSION, compareVersions } from "@/lib/changelog";

/**
 * The opt-in "a newer version is out" check — the only network request Sanctum
 * ever makes, and only after the DM turns it on in Settings.
 *
 * It is one unauthenticated GET to GitHub's public releases API, sent from the
 * local server so nothing but `User-Agent: Sanctum` goes with it: no cookies,
 * no page origin, no query string, nothing about the DM or their campaigns.
 * Every failure (offline, timeout, rate limit, odd JSON) ends in "no update".
 */

const ENABLED_KEY = "updateCheckEnabled";
const SKIPPED_KEY = "skippedUpdateVersion";
const RELEASES_URL = "https://api.github.com/repos/Athanasioust/Sanctum/releases/latest";
const TIMEOUT_MS = 5000;

/** Where "Download" sends people: itch is the real distribution channel. */
export const DOWNLOAD_URL = "https://athanasioust.itch.io/sanctum";

export type UpdateInfo = { version: string; current: string; url: string };

export function updateCheckEnabled(): boolean {
  return getSetting(ENABLED_KEY) === "1";
}

export function setUpdateCheckEnabled(enabled: boolean): void {
  setSetting(ENABLED_KEY, enabled ? "1" : "0");
}

export function skipVersion(version: string): void {
  setSetting(SKIPPED_KEY, version);
}

/**
 * A clean `x.y.z` (optionally `v`-prefixed) as `x.y.z`, or null. Pre-release
 * and build tags are rejected outright so nobody is pointed at a beta.
 */
export function parseReleaseVersion(tag: unknown): string | null {
  if (typeof tag !== "string") return null;
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(tag.trim());
  return match ? `${Number(match[1])}.${Number(match[2])}.${Number(match[3])}` : null;
}

/** The running version without any pre-release/build suffix. */
function currentVersion(): string {
  return APP_VERSION.split(/[-+]/)[0];
}

async function fetchLatest(): Promise<string | null> {
  try {
    const res = await fetch(RELEASES_URL, {
      headers: { "User-Agent": "Sanctum", Accept: "application/vnd.github+json" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (typeof data !== "object" || data === null) return null;
    return parseReleaseVersion((data as { tag_name?: unknown }).tag_name);
  } catch {
    return null;
  }
}

// One server process is one launch: GitHub is asked at most once per launch,
// and the notice is handed out once, however many pages load or reload.
let latest: Promise<string | null> | null = null;
let notified = false;

/** The newer release to tell the DM about, or null. Never throws. */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  if (notified || !updateCheckEnabled()) return null;
  latest ??= fetchLatest();
  const version = await latest;
  if (!version || notified) return null;

  const current = currentVersion();
  if (compareVersions(version, current) <= 0) return null;
  // Skipping 0.7.0 also hides anything older, but 0.7.1 is news again.
  const skipped = getSetting(SKIPPED_KEY);
  if (skipped && compareVersions(version, skipped) <= 0) return null;

  notified = true;
  return { version, current, url: DOWNLOAD_URL };
}
