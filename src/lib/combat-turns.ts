/**
 * Turn order for the combat tracker.
 *
 * The tracker's rows are participants, but a round is walked in *slots*: a
 * slot is one creature or one group of minions sharing an initiative, and the
 * "Lair Actions" prompt is a slot of its own that belongs to no participant.
 * Keeping the slot maths here, away from the React component, is what lets
 * next/previous turn stay simple.
 *
 * `currentTurnIndex` on the encounter always points at a participant (the one
 * acting, or — while the lair row is current — the one acting next), so the
 * player view and older data keep reading it the way they always have.
 */

import type { StatBlockAction } from "@/db/schema";

/** Lair actions happen on initiative count 20, losing initiative ties. */
export const LAIR_INITIATIVE = 20;

export type TurnPart = {
  id: number;
  initiativeTotal: number;
  hasLairAction: boolean;
  /** Members of one minion group share an id here and take one turn. */
  groupId?: string | null;
};

export type TurnSlot =
  | { kind: "lair" }
  /** `start` is the index of the slot's first participant in turn order. */
  | { kind: "creatures"; ids: number[]; start: number };

/**
 * The round's slots, in order. `parts` must already be in turn order (see
 * `keepGroupsTogether`). Consecutive members of a group become one slot. When
 * any combatant has lair actions, the lair slot goes in front of the first
 * creature below initiative 20 (or at the end if everyone rolled 20+).
 */
export function turnSlots(parts: TurnPart[]): TurnSlot[] {
  const slots: TurnSlot[] = [];
  parts.forEach((p, i) => {
    const last = slots[slots.length - 1];
    if (
      p.groupId &&
      last?.kind === "creatures" &&
      parts[last.start].groupId === p.groupId
    ) {
      last.ids.push(p.id);
    } else {
      slots.push({ kind: "creatures", ids: [p.id], start: i });
    }
  });
  if (!parts.some((p) => p.hasLairAction)) return slots;
  const at = slots.findIndex(
    (s) => s.kind === "creatures" && parts[s.start].initiativeTotal < LAIR_INITIATIVE,
  );
  slots.splice(at === -1 ? slots.length : at, 0, { kind: "lair" });
  return slots;
}

/**
 * Pull every group's members up behind its first member, so a group is always
 * one contiguous run in turn order however the list was sorted or dragged.
 */
export function keepGroupsTogether<T extends TurnPart>(parts: T[]): T[] {
  const out: T[] = [];
  const placed = new Set<string>();
  for (const p of parts) {
    if (!p.groupId) {
      out.push(p);
    } else if (!placed.has(p.groupId)) {
      placed.add(p.groupId);
      out.push(...parts.filter((q) => q.groupId === p.groupId));
    }
  }
  return out;
}

/** Highest initiative first, with each group kept together. */
export function sortByInitiative<T extends TurnPart>(parts: T[]): T[] {
  return keepGroupsTogether([...parts].sort((a, b) => b.initiativeTotal - a.initiativeTotal));
}

/** Which slot is current, from the encounter's stored turn pointer. */
export function currentSlotIndex(
  slots: TurnSlot[],
  turnIndex: number,
  lairActive: boolean,
): number {
  if (slots.length === 0) return -1;
  if (lairActive) {
    const lair = slots.findIndex((s) => s.kind === "lair");
    if (lair !== -1) return lair;
  }
  const found = slots.findIndex(
    (s) => s.kind === "creatures" && turnIndex >= s.start && turnIndex < s.start + s.ids.length,
  );
  if (found !== -1) return found;
  // A pointer left past the end (someone was removed) falls back to the top.
  return 0;
}

/** The stored turn pointer for a slot. */
export function pointerForSlot(
  slots: TurnSlot[],
  slotIndex: number,
): { currentTurnIndex: number; lairTurnActive: boolean } {
  const slot = slots[slotIndex];
  if (!slot) return { currentTurnIndex: 0, lairTurnActive: false };
  if (slot.kind === "creatures") {
    return { currentTurnIndex: slot.start, lairTurnActive: false };
  }
  // The lair row points at whoever acts after it.
  for (let i = 1; i <= slots.length; i++) {
    const next = slots[(slotIndex + i) % slots.length];
    if (next.kind === "creatures") return { currentTurnIndex: next.start, lairTurnActive: true };
  }
  return { currentTurnIndex: 0, lairTurnActive: true };
}

/**
 * Legendary-action and lair defaults for a stat block, used to prefill a
 * monster when it joins a fight. The SRD phrases the count as "can take 3
 * legendary actions"; a homebrew block that lists legendary actions without
 * saying how many gets the usual three.
 */
export function legendaryDefaults(npc: {
  legendaryActions: StatBlockAction[];
  lairActions: StatBlockAction[];
}): { legendaryActionsMax: number; hasLairAction: boolean } {
  let legendaryActionsMax = 0;
  if (npc.legendaryActions.length > 0) {
    legendaryActionsMax = 3;
    for (const a of npc.legendaryActions) {
      const m = /can take (\d+) legendary actions?/i.exec(a.description);
      if (m) {
        legendaryActionsMax = Math.max(1, Math.min(10, Number(m[1])));
        break;
      }
    }
  }
  return { legendaryActionsMax, hasLairAction: npc.lairActions.length > 0 };
}
