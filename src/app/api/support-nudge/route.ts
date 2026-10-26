import { apiRoute, json } from "@/lib/api";
import { getSetting, setSetting } from "@/lib/app-settings";

/**
 * Whether the Ko-fi link should glow. It does for the first few launches and
 * stops for good once it's been clicked — noticeable, never nagging.
 */
const LAUNCHES_KEY = "supportNudgeLaunches";
const CLICKED_KEY = "supportNudgeClicked";
const GLOW_LAUNCHES = 3;

// One launch is one server process; count it once, however many pages load.
let countedThisLaunch = false;

export const GET = apiRoute(async () => {
  if (getSetting(CLICKED_KEY) === "1") return json({ glow: false });
  let launches = Number(getSetting(LAUNCHES_KEY) ?? 0);
  if (!countedThisLaunch) {
    countedThisLaunch = true;
    launches += 1;
    setSetting(LAUNCHES_KEY, String(launches));
  }
  return json({ glow: launches <= GLOW_LAUNCHES });
});

/** The link was clicked: no more glowing. */
export const POST = apiRoute(async () => {
  setSetting(CLICKED_KEY, "1");
  return json({ glow: false });
});
