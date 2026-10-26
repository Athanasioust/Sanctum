import Link from "next/link";
import { Swords, Calculator, Monitor } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { CombatTracker } from "@/components/combat/combat-tracker";
import {
  NewEncounterButton,
  PastEncounters,
  StartSavedEncounterButton,
} from "@/components/combat/encounter-controls";
import { PopOutButton } from "@/components/shared/pop-out-button";
import { CombatRefresher } from "@/components/combat/combat-refresher";
import { loadCombatData } from "@/lib/combat-data";

export const dynamic = "force-dynamic";

export default async function CombatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const data = await loadCombatData(campaignId);
  const { active, past, saved } = data;

  return (
    <PageContainer>
      <PageHeader
        title="Combat Tracker"
        description={active ? active.name : "Initiative, HP, conditions and turns."}
        icon={Swords}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/campaign/${campaignId}/combat/builder`}>
                <Calculator className="size-4" /> Plan encounter
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={`/screen/${campaignId}`} target="_blank" rel="noopener noreferrer">
                <Monitor className="size-4" /> Player view
              </a>
            </Button>
            <PopOutButton href={`/popout/combat/${campaignId}`} name={`sanctum-combat-${campaignId}`} />
            {active ? null : <StartSavedEncounterButton saved={saved} />}
            {active ? null : <NewEncounterButton campaignId={campaignId} />}
          </div>
        }
      />

      {active ? (
        <CombatTracker
          encounter={{ ...active, participants: data.participants }}
          addableCharacters={data.addableCharacters}
          addableNpcs={data.addableNpcs}
          addableBestiary={data.addableBestiary}
          partyLevels={data.partyLevels}
          npcXp={data.npcXp}
          portraits={data.portraits}
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
      <CombatRefresher />
    </PageContainer>
  );
}
