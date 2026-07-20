import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { Skull, Plus } from "lucide-react";
import { db } from "@/db";
import { npcs } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { InfoCallout } from "@/components/shared/info-callout";
import { NpcGrid } from "@/components/npcs/npc-grid";
import { GenerateNpcButton } from "@/components/npcs/generate-npc-button";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NpcsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const list = await db
    .select()
    .from(npcs)
    .where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, false)))
    .orderBy(asc(npcs.name));

  return (
    <PageContainer>
      <PageHeader
        title="NPCs & Monsters"
        description="The living cast of this campaign — the specific characters and creatures in play."
        icon={Skull}
        actions={
          list.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <GenerateNpcButton campaignId={campaignId} />
              <Button asChild>
                <Link href={`/campaign/${campaignId}/npcs/new`}>
                  <Plus className="size-4" /> New NPC / Monster
                </Link>
              </Button>
            </div>
          ) : null
        }
      />
      {list.length > 0 ? (
        <InfoCallout>
          These are the actual NPCs and monsters in your campaign. For a reusable
          library of stat blocks (including 140+ SRD monsters), see the{" "}
          <strong className="text-foreground">Bestiary</strong> — save any NPC
          there from its page to reuse it later.
        </InfoCallout>
      ) : null}

      {list.length === 0 ? (
        <EmptyState
          icon={Skull}
          title="No NPCs or monsters yet"
          description="Create NPCs and monsters with full 5e stat blocks, or generate a random one to improvise on the spot."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <GenerateNpcButton campaignId={campaignId} variant="default" />
              <Button variant="outline" asChild>
                <Link href={`/campaign/${campaignId}/npcs/new`}>
                  <Plus className="size-4" /> New NPC / Monster
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <NpcGrid campaignId={campaignId} npcs={list} />
      )}
    </PageContainer>
  );
}
