import type { CustomCalendarConfig } from "@/db/schema";

/** A date in a custom in-world calendar. monthIndex is 0-based. */
export type CustomDate = { year: number; monthIndex: number; day: number };

const SEP = "|";

/** Canonical, parseable string for a custom date: "year|monthIndex|day". */
export function canonicalCustomDate(d: CustomDate): string {
  return `${d.year}${SEP}${d.monthIndex}${SEP}${d.day}`;
}

export function parseCustomDate(value: string | null | undefined): CustomDate | null {
  if (!value) return null;
  const parts = value.split(SEP);
  if (parts.length !== 3) return null;
  const [year, monthIndex, day] = parts.map(Number);
  if ([year, monthIndex, day].some(Number.isNaN)) return null;
  return { year, monthIndex, day };
}

/** Human-readable rendering, e.g. "12 Mirtul, 1492 AG". */
export function formatCustomDate(
  d: CustomDate,
  config: CustomCalendarConfig,
): string {
  const month = config.months[d.monthIndex];
  const label = config.yearLabel ? ` ${config.yearLabel}` : "";
  return `${d.day} ${month?.name ?? `Month ${d.monthIndex + 1}`}, ${d.year}${label}`;
}

export function daysInCustomYear(config: CustomCalendarConfig): number {
  return config.months.reduce((sum, m) => sum + m.days, 0);
}

/**
 * Weekday index (0-based) for a given custom date, assuming day 1 of yearOne
 * is weekday 0 and time flows continuously across months and years.
 */
export function customWeekday(d: CustomDate, config: CustomCalendarConfig): number {
  const weekLen = config.weekdays?.length ?? 7;
  const yearOne = config.yearOne ?? 1;
  const yearsBefore = d.year - yearOne;
  const daysPerYear = daysInCustomYear(config);
  let absolute = yearsBefore * daysPerYear;
  for (let i = 0; i < d.monthIndex; i++) absolute += config.months[i]?.days ?? 0;
  absolute += d.day - 1;
  return ((absolute % weekLen) + weekLen) % weekLen;
}
