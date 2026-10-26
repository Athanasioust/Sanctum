/**
 * Combat conditions, optionally on a timer.
 *
 * A combatant's conditions used to be plain names ("Stunned"). They still can
 * be — that is what every older encounter holds, and it means "until the DM
 * removes it" — but an entry can now also carry a duration that the tracker
 * counts down and clears by itself.
 *
 * `rounds` counts the affected creature's own turns: "Stunned, 1 round, end of
 * turn" drops off at the end of that creature's next turn. `endOfCombat` never
 * ticks; it is there so a condition can say so out loud.
 */

export const CONDITION_EXPIRIES = ["startOfTurn", "endOfTurn", "endOfCombat"] as const;
export type ConditionExpiry = (typeof CONDITION_EXPIRIES)[number];

export type TimedCondition = {
  name: string;
  rounds?: number;
  expiry?: ConditionExpiry;
};

export type ConditionEntry = string | TimedCondition;

export function conditionName(entry: ConditionEntry): string {
  return typeof entry === "string" ? entry : entry.name;
}

export function conditionNames(entries: ConditionEntry[] | null | undefined): string[] {
  return (entries ?? []).map(conditionName);
}

/** The timer on an entry, or null for an untimed one. */
export function conditionTimer(
  entry: ConditionEntry,
): { rounds?: number; expiry: ConditionExpiry } | null {
  if (typeof entry === "string" || !entry.expiry) return null;
  return { rounds: entry.rounds, expiry: entry.expiry };
}

/**
 * Count down the conditions whose timer runs out at `phase` of the creature's
 * own turn. Returns the surviving list and the names that just expired. The
 * list comes back as the same array when nothing changed, so a caller can skip
 * a save.
 */
export function tickConditions(
  entries: ConditionEntry[],
  phase: "startOfTurn" | "endOfTurn",
): { next: ConditionEntry[]; expired: string[] } {
  let changed = false;
  const expired: string[] = [];
  const next: ConditionEntry[] = [];
  for (const entry of entries) {
    if (typeof entry === "string" || entry.expiry !== phase || entry.rounds === undefined) {
      next.push(entry);
      continue;
    }
    changed = true;
    const rounds = entry.rounds - 1;
    if (rounds <= 0) expired.push(entry.name);
    else next.push({ ...entry, rounds });
  }
  return { next: changed ? next : entries, expired };
}
