/**
 * Damage and healing against a combatant's HP, shared by the tracker's HP
 * controls and the battle map's area damage so both treat temporary HP the
 * same way.
 */

export type HpState = { hpCurrent: number; hpTemp: number; hpMax: number };

/**
 * Apply a signed HP change: negative is damage (temporary HP soaks it first,
 * and current HP never drops below 0), positive is healing (capped at max;
 * temporary HP is untouched).
 */
export function applyHpDelta(p: HpState, delta: number): { hpCurrent: number; hpTemp: number } {
  let hpCurrent = p.hpCurrent;
  let hpTemp = p.hpTemp;
  if (delta < 0) {
    let dmg = -delta;
    if (hpTemp > 0) {
      const absorbed = Math.min(hpTemp, dmg);
      hpTemp -= absorbed;
      dmg -= absorbed;
    }
    hpCurrent = Math.max(0, hpCurrent - dmg);
  } else {
    hpCurrent = Math.min(p.hpMax, hpCurrent + delta);
  }
  return { hpCurrent, hpTemp };
}

/** The 5e concentration save DC for taking `damage`: half of it, minimum 10. */
export function concentrationDc(damage: number): number {
  return Math.max(10, Math.floor(damage / 2));
}
