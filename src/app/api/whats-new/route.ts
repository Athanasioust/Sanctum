import { count } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { apiRoute, json } from "@/lib/api";
import { getSetting, setSetting } from "@/lib/app-settings";
import { APP_VERSION, entriesSince } from "@/lib/changelog";

const KEY = "lastSeenVersion";

/**
 * Whether to show "What's new", and what to show in it.
 *
 * A brand-new install has nothing to compare against and nothing that changed
 * for it, so the first visit with no campaigns just records the version
 * quietly. An existing install with no record yet is one that has just been
 * updated from a version before this dialog existed — that one sees it.
 */
export const GET = apiRoute(async () => {
  let lastSeen = getSetting(KEY);
  if (lastSeen === null) {
    const [{ value }] = await db.select({ value: count() }).from(campaigns);
    if (value === 0) {
      setSetting(KEY, APP_VERSION);
      lastSeen = APP_VERSION;
    }
  }
  const entries = entriesSince(lastSeen);
  return json({ version: APP_VERSION, lastSeen, show: entries.length > 0, entries });
});

/** Mark the running version as seen. */
export const POST = apiRoute(async () => {
  setSetting(KEY, APP_VERSION);
  return json({ lastSeen: APP_VERSION });
});
