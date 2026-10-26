import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { characters, combatParticipants, encounters, npcs, type CombatParticipant } from "@/db/schema";
import type { Addable } from "@/components/combat/combat-tracker";
import { abilityModifier } from "@/lib/dnd";
import { crToXp } from "@/lib/encounter";
import { portraitsFor } from "@/lib/portraits";

/**
 * Everything the combat tracker needs for a campaign, shared by the combat page
 * and its pop-out window so the two can never drift apart.
 */
export async function loadCombatData(campaignId: number) {
  const allEncounters = await db
    .select()
    .from(encounters)
    .where(eq(encounters.campaignId, campaignId))
    .orderBy(desc(encounters.createdAt));

  const saved = allEncounters.filter((e) => e.isTemplate);
  const real = allEncounters.filter((e) => !e.isTemplate);
  const active = real.find((e) => e.status === "active") ?? null;
  const past = real.filter((e) => e.status !== "active");

  const [chars, monsters, templates] = await Promise.all([
    db.select().from(characters).where(eq(characters.campaignId, campaignId)).orderBy(asc(characters.name)),
    db
      .select()
      .from(npcs)
      .where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, false)))
      .orderBy(asc(npcs.name)),
    db
      .select()
      .from(npcs)
      .where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, true)))
      .orderBy(asc(npcs.name)),
  ]);

  const addableCharacters: Addable[] = chars.map((c) => ({
    id: c.id,
    name: c.name,
    hpMax: c.hpMax,
    hpCurrent: c.hpCurrent,
    armorClass: c.armorClass,
    initiativeMod: c.initiativeBonus,
    type: "character",
  }));
  const addableNpcs: Addable[] = monsters.map((n) => ({
    id: n.id,
    name: n.name,
    hpMax: n.hpMax,
    hpCurrent: n.hpCurrent,
    armorClass: n.armorClass,
    initiativeMod: abilityModifier(n.dex),
    type: "npc",
  }));
  const addableBestiary: Addable[] = templates.map((n) => ({
    id: n.id,
    name: n.name,
    hpMax: n.hpMax,
    hpCurrent: n.hpCurrent,
    armorClass: n.armorClass,
    initiativeMod: abilityModifier(n.dex),
    type: "npc",
    cr: n.challengeRating || undefined,
  }));

  // What the live difficulty badge needs: each PC's level and each creature's
  // XP, keyed by the entity ids participants point back at.
  const partyLevels: Record<number, number> = Object.fromEntries(
    chars.map((c) => [c.id, c.level]),
  );
  const npcXp: Record<number, number> = Object.fromEntries(
    [...monsters, ...templates].map((n) => [
      n.id,
      n.experiencePoints || crToXp(n.challengeRating),
    ]),
  );

  let participants: CombatParticipant[] = [];
  if (active) {
    participants = await db
      .select()
      .from(combatParticipants)
      .where(eq(combatParticipants.encounterId, active.id))
      .orderBy(asc(combatParticipants.turnOrder));
  }

  return {
    active,
    past,
    saved,
    participants,
    addableCharacters,
    addableNpcs,
    addableBestiary,
    partyLevels,
    npcXp,
    portraits: await portraitsFor(participants),
  };
}
