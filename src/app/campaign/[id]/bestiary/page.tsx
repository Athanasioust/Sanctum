import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { BookOpen, Plus } from "lucide-react";
import { db } from "@/db";
import { npcs } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { NpcGrid } from "@/components/npcs/npc-grid";
import { SeedBestiaryButton } from "@/components/npcs/seed-bestiary-button";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BestiaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const list = await db
    .select()
    .from(npcs)
    .where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, true)))
    .orderBy(asc(npcs.name));

  return (
    <PageContainer>
      <PageHeader
        title="Bestiary"
        description="Reusable stat block templates you can drop into encounters or the campaign."
        icon={BookOpen}
        actions={
          list.length > 0 ? (
            <div className="flex items-center gap-2">
              <SeedBestiaryButton campaignId={campaignId} />
              <Button asChild>
                <Link href={`/campaign/${campaignId}/bestiary/new`}>
                  <Plus className="size-4" /> New Template
                </Link>
              </Button>
            </div>
          ) : null
        }
      />
      {list.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Your Bestiary is empty"
          description="Add 140+ ready-to-use SRD monsters in one click, create your own reusable templates, or save existing NPCs to the Bestiary from their page."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <SeedBestiaryButton campaignId={campaignId} variant="default" />
              <Button variant="outline" asChild>
                <Link href={`/campaign/${campaignId}/bestiary/new`}>
                  <Plus className="size-4" /> New Template
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <NpcGrid campaignId={campaignId} npcs={list} basePath="bestiary" entityLabel="Template" />
      )}
    </PageContainer>
  );
}
