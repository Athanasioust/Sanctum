/**
 * What changed in each release, newest first. The "What's new" dialog shows
 * the entries newer than the last version the DM dismissed it for.
 *
 * Add an entry here when bumping the version in package.json.
 */

export type ChangelogEntry = {
  version: string;
  /** ISO date of the release. */
  date: string;
  highlights: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.6.1",
    date: "2026-10-27",
    highlights: [
      "Optional update check: turn on Settings → Check for updates and Sanctum asks GitHub once per launch whether a newer version is out. Off by default, and nothing about you or your campaigns is sent.",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-10-26",
    highlights: [
      "Encounter difficulty: the builder and the live tracker rate fights Easy to Deadly against your party, and suggest monsters that fit.",
      "Boss fights: legendary-action pips, a Lair Actions row at initiative 20, and reaction markers that reset on each creature's turn.",
      "Minion groups: add a pack as one \"5× Goblin\" initiative row that takes one turn and still tracks each member's HP.",
      "Timed conditions that drop off by themselves, and limited-use abilities (Second Wind, Channel Divinity…) restored by rests.",
      "Portraits for characters and NPCs, used as round token art on the battle map and the player view.",
      "Area damage: drop a fireball template and apply damage, with save-for-half, to everything under it.",
      "Players can drag their own tokens from the player view on their phones (opt-in, LAN only).",
      "Progress clocks on the dashboard, optionally shown to players.",
      "Pop the combat tracker or soundpad out into its own window, and run combat from the keyboard (press ? in combat).",
      "Saved encounters and location random-encounter tables, bulk select with undo, more languages (Spanish, Italian, Portuguese) and a sample campaign for new installs.",
      "Copy or export a fight's combat log, plus keyboard focus rings and screen-reader labels throughout.",
    ],
  },
  {
    version: "0.5.2",
    date: "2026-08-12",
    highlights: ["The player view no longer hands out a link phones cannot open."],
  },
];

/** The running app's version, baked in at build time (see next.config.ts). */
export const APP_VERSION = process.env.NEXT_PUBLIC_SANCTUM_VERSION ?? CHANGELOG[0].version;

/** Compare dotted versions numerically: negative if a < b, 0 if equal, positive if a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/**
 * Entries newer than `lastSeen`, up to the running version. With nothing seen
 * yet (an install updated from before this dialog existed) only the current
 * release is shown — the DM was already using the older ones.
 */
export function entriesSince(lastSeen: string | null): ChangelogEntry[] {
  return CHANGELOG.filter((e) =>
    lastSeen === null
      ? compareVersions(e.version, APP_VERSION) === 0
      : compareVersions(e.version, APP_VERSION) <= 0 && compareVersions(e.version, lastSeen) > 0,
  );
}
