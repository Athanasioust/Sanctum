import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { Skull, Plus } from "lucide-react";
import { db } from "@/db";
import { npcs } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { NpcGrid } from "@/components/npcs/npc-grid";
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
        description="Everyone and everything that isn't a player character."
        icon={Skull}
        actions={
          list.length > 0 ? (
            <Button asChild>
              <Link href={`/campaign/${campaignId}/npcs/new`}>
                <Plus className="size-4" /> New NPC / Monster
              </Link>
            </Button>
          ) : null
        }
      />
      {list.length === 0 ? (
        <EmptyState
          icon={Skull}
          title="No NPCs or monsters yet"
          description="Create NPCs and monsters with full 5e stat blocks. Save reusable ones to your Bestiary."
          action={
            <Button asChild>
              <Link href={`/campaign/${campaignId}/npcs/new`}>
                <Plus className="size-4" /> New NPC / Monster
              </Link>
            </Button>
          }
        />
      ) : (
        <NpcGrid campaignId={campaignId} npcs={list} />
      )}
    </PageContainer>
  );
}
