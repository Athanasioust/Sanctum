import "server-only";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { getSetting, setSetting } from "@/lib/app-settings";
import { APP_VERSION } from "@/lib/changelog";

/** app_settings keys. `lastSeenVersion` is shared with "What's new". */
export const WELCOME_KEY = "hasSeenWelcome";
export const LAST_SEEN_VERSION_KEY = "lastSeenVersion";

function campaignCount(): number {
  const [{ value }] = db.select({ value: count() }).from(campaigns).all();
  return value;
}

/**
 * Whether this launch is a genuine fresh install that should be welcomed:
 * the welcome flag was never set and there are no campaigns. An install that
 * already has campaigns (an upgrade, or someone who loaded the old sample) is
 * treated as onboarded and has the flag set quietly, so it is never shown the
 * dialog. Read-only apart from that one quiet write; any failure means "no".
 */
export function welcomeEligible(): boolean {
  try {
    if (getSetting(WELCOME_KEY) === "true") return false;
    if (campaignCount() > 0) {
      setSetting(WELCOME_KEY, "true");
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Record that the welcome has been shown. It also marks the running version
 * as seen for "What's new": a brand-new user has nothing new to read about,
 * and the two dialogs must never stack.
 */
export function markWelcomeShown(): void {
  setSetting(WELCOME_KEY, "true");
  setSetting(LAST_SEEN_VERSION_KEY, APP_VERSION);
}
