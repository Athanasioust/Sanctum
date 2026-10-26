/**
 * Turning a rolled random-encounter result ("2d4 Skeletons rise from the
 * alcoves") into combatants: find the campaign's creatures named in the text
 * and how many of each. Plain text with no creature in it is still a fine
 * result — it just has nothing to start a fight with.
 */

import { roll } from "@/lib/dice";

export type KnownCreature = { id: number; name: string };

export type FoundCreature<C extends KnownCreature = KnownCreature> = {
  creature: C;
  count: number;
  /** How the count was written, e.g. "2d4" — shown so the DM sees it was rolled. */
  countText: string | null;
};

const WORD_NUMBERS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, twenty: 20,
};

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Creatures named in `text`, longest names first so "Goblin Boss" wins over
 * "Goblin". A count written just before the name — "3", "2d4", "1d6+1",
 * "two" — is rolled or read; with none it's one. Plurals made with -s/-es
 * ("Skeletons", "Ogres") match the singular; irregular ones ("Wolves") don't.
 */
export function findCreatures<C extends KnownCreature>(
  text: string,
  known: C[],
): FoundCreature<C>[] {
  const found: FoundCreature<C>[] = [];
  let rest = ` ${text} `;
  const byLength = [...known].sort((a, b) => b.name.length - a.name.length);
  const seen = new Set<string>();

  for (const creature of byLength) {
    const key = creature.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const re = new RegExp(
      `(?:(\\d+d\\d+(?:\\s*[+-]\\s*\\d+)?|\\d+|${Object.keys(WORD_NUMBERS).join("|")})\\s+)?` +
        `\\b${escapeRe(creature.name.trim())}(?:e?s)?\\b`,
      "i",
    );
    const m = re.exec(rest);
    if (!m) continue;
    const countText = m[1] ?? null;
    let count = 1;
    if (countText) {
      const lower = countText.toLowerCase();
      if (lower in WORD_NUMBERS) count = WORD_NUMBERS[lower];
      else if (/d/i.test(countText)) {
        try {
          count = roll(countText.replace(/\s+/g, "")).total;
        } catch {
          count = 1;
        }
      } else count = Number(countText);
    }
    found.push({ creature, count: Math.max(1, Math.min(30, count)), countText });
    // Blank the match so a shorter name inside it can't match again.
    rest = rest.slice(0, m.index) + " ".repeat(m[0].length) + rest.slice(m.index + m[0].length);
  }
  return found;
}
