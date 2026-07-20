import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { BookOpen, Plus } from "lucide-react";
import { db } from "@/db";
import { npcs } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { InfoCallout } from "@/components/shared/info-callout";
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
        description="Your reusable library of stat-block templates — the monster manual you draw from."
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
      {list.length > 0 ? (
        <InfoCallout>
          Templates here aren&apos;t in play — they&apos;re a library. Use{" "}
          <strong className="text-foreground">Add to campaign</strong> to create a
          living NPC/monster (it appears under{" "}
          <strong className="text-foreground">NPCs &amp; Monsters</strong>), or{" "}
          <strong className="text-foreground">To encounter</strong> to drop one
          into an active fight.
        </InfoCallout>
      ) : null}

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
