import { and, asc, desc, eq } from "drizzle-orm";
import { Swords } from "lucide-react";
import { db } from "@/db";
import {
  encounters,
  combatParticipants,
  characters,
  npcs,
  type CombatParticipant,
} from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CombatTracker, type Addable } from "@/components/combat/combat-tracker";
import {
  NewEncounterButton,
  PastEncounters,
} from "@/components/combat/encounter-controls";
import { abilityModifier } from "@/lib/dnd";

export const dynamic = "force-dynamic";

export default async function CombatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);

  const allEncounters = await db
    .select()
    .from(encounters)
    .where(eq(encounters.campaignId, campaignId))
    .orderBy(desc(encounters.createdAt));

  const active = allEncounters.find((e) => e.status === "active");
  const past = allEncounters.filter((e) => e.status !== "active");

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

  let participants: CombatParticipant[] = [];
  if (active) {
    participants = await db
      .select()
      .from(combatParticipants)
      .where(eq(combatParticipants.encounterId, active.id))
      .orderBy(asc(combatParticipants.turnOrder));
  }

  return (
    <PageContainer>
      <PageHeader
        title="Combat Tracker"
        description={active ? active.name : "Initiative, HP, conditions and turns."}
        icon={Swords}
        actions={active ? null : <NewEncounterButton campaignId={campaignId} />}
      />

      {active ? (
        <CombatTracker
          encounter={{ ...active, participants }}
          addableCharacters={addableCharacters}
          addableNpcs={addableNpcs}
          addableBestiary={addableBestiary}
        />
      ) : (
        <EmptyState
          icon={Swords}
          title="No active encounter"
          description="Start a new encounter, then add player characters, NPCs and monsters to roll initiative and track the fight."
          action={<NewEncounterButton campaignId={campaignId} />}
        />
      )}

      <PastEncounters encounters={past} />
    </PageContainer>
  );
}
