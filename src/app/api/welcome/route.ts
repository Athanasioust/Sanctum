import { apiRoute, json } from "@/lib/api";
import { markWelcomeShown, welcomeEligible } from "@/lib/onboarding";

/**
 * Whether to show the first-run welcome. It is shown at most once: the flag is
 * written the moment we say "show", so closing the app with the dialog open,
 * declining it or taking the tour all count the same and it never returns on
 * its own. The tour stays reachable from Help.
 */
export const GET = apiRoute(async () => {
  const show = welcomeEligible();
  if (show) {
    try {
      markWelcomeShown();
    } catch {
      // Couldn't record it: don't risk showing it on every launch.
      return json({ show: false });
    }
  }
  return json({ show });
});
