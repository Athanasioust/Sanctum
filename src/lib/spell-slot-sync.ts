/**
 * Client helper that reconciles a character's stored spell slots with what
 * their class levels should grant. Shared by the character wizard and the
 * level-up flow so both write slots the same way.
 */

import { api } from "@/lib/client";
import { spellSlotsFor, type ClassLevel } from "@/lib/class-rules";
import type { SpellSlot } from "@/db/schema";

export type OwnerType = "character" | "npc";

/**
 * Write the slots `classes` should grant, leaving expended slots alone.
 *
 * Growing a pool keeps `used` where it is (a level-up shouldn't refill you);
 * shrinking one clamps `used` so it can never exceed the new total. Levels that
 * no longer grant anything are deleted rather than zeroed, so the spells tab
 * doesn't show empty rows.
 */
export async function syncSpellSlots(
  ownerId: number,
  ownerType: OwnerType,
  classes: ClassLevel[],
): Promise<void> {
  const desired = spellSlotsFor(classes);
  const existing = await api.get<SpellSlot[]>(
    `/api/spell-slots?ownerId=${ownerId}&ownerType=${ownerType}`,
  );

  const writes: Promise<unknown>[] = [];

  for (const [level, total] of Object.entries(desired)) {
    const slotLevel = Number(level);
    const row = existing.find((s) => s.slotLevel === slotLevel);
    if (!row) {
      writes.push(
        api.post("/api/spell-slots", { ownerId, ownerType, slotLevel, total, used: 0 }),
      );
    } else if (row.total !== total || row.used > total) {
      writes.push(
        api.patch(`/api/spell-slots/${row.id}`, {
          total,
          used: Math.min(row.used, total),
        }),
      );
    }
  }

  for (const row of existing) {
    if (desired[row.slotLevel] === undefined) {
      writes.push(api.delete(`/api/spell-slots/${row.id}`));
    }
  }

  await Promise.all(writes);
}

/**
 * Every class the character has levels in.
 *
 * `characters.level` is the *total* character level and `multiclassInfo` lists
 * the classes taken beyond the primary one, so the primary class's own level is
 * whatever is left after subtracting them.
 */
export function classLevels(
  primaryClass: string,
  totalLevel: number,
  multiclass: { className: string; level: number }[],
): ClassLevel[] {
  const extra = multiclass.filter((e) => e.className?.trim() && e.level > 0);
  const spent = extra.reduce((sum, e) => sum + e.level, 0);

  const entries: ClassLevel[] = [];
  const primaryLevel = totalLevel - spent;
  if (primaryClass.trim() && primaryLevel > 0) {
    entries.push({ className: primaryClass, level: primaryLevel });
  }
  for (const entry of extra) {
    entries.push({ className: entry.className, level: entry.level });
  }
  return entries;
}
