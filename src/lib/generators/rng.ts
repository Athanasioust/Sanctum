/**
 * Seeded randomness for the generators.
 *
 * Every generated field carries its own 32-bit seed. The same seed (and the
 * same inputs) always rolls the same value, so a locked field stays put, a
 * reroll only touches the field asked for, and a result can be rebuilt
 * exactly from its seeds. New results still differ press to press because
 * fresh seeds come from `Math.random`.
 */

export type Rng = {
  /** A float in [0, 1). */
  next(): number;
  /** An integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  /** `n` distinct picks (or all of them, if there are fewer). */
  sample<T>(items: readonly T[], n: number): T[];
  chance(p: number): boolean;
};

/** mulberry32 — tiny, fast, and plenty random for table rolls. */
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    pick: (items) => items[Math.floor(next() * items.length)],
    sample: (items, n) => {
      const pool = [...items];
      const out: (typeof pool)[number][] = [];
      while (out.length < n && pool.length) out.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
      return out;
    },
    chance: (p) => next() < p,
  };
}

export function newSeed(): number {
  return Math.floor(Math.random() * 4294967296) >>> 0;
}
