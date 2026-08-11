import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { BookOpen, Network, Plus, Skull } from "lucide-react";
import { db } from "@/db";
import { npcRelationships, npcs } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { InfoCallout } from "@/components/shared/info-callout";
import { TabLinks } from "@/components/shared/tab-links";
import { NpcGrid } from "@/components/npcs/npc-grid";
import { GenerateNpcButton } from "@/components/npcs/generate-npc-button";
import { SeedBestiaryButton } from "@/components/npcs/seed-bestiary-button";
import { RelationsGraph } from "@/components/relations/relations-graph";
import { CreateHomebrewButton } from "@/components/homebrew/create-homebrew-button";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/**
 * The campaign's cast, in three views.
 *
 * Bestiary and Relations used to be their own sidebar entries; they're tabs
 * here now, selected by `?tab=`. Their old routes redirect to these tabs, so
 * bookmarks and deep links keep working.
 */
const TABS = ["cast", "bestiary", "relations"] as const;
type NpcTab = (typeof TABS)[number];

function normalizeTab(value: string | string[] | undefined): NpcTab {
  const first = Array.isArray(value) ? value[0] : value;
  return TABS.includes(first as NpcTab) ? (first as NpcTab) : "cast";
}

export default async function NpcsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const campaignId = Number((await params).id);
  const tab = normalizeTab((await searchParams).tab);
  const base = `/campaign/${campaignId}/npcs`;

  return (
    <PageContainer>
      <TabLinks
        className="mb-5"
        active={tab}
        tabs={[
          { value: "cast", label: "Cast", href: base, icon: Skull },
          { value: "bestiary", label: "Bestiary", href: `${base}?tab=bestiary`, icon: BookOpen },
          { value: "relations", label: "Relations", href: `${base}?tab=relations`, icon: Network },
        ]}
      />

      {tab === "cast" ? <CastTab campaignId={campaignId} /> : null}
      {tab === "bestiary" ? <BestiaryTab campaignId={campaignId} /> : null}
      {tab === "relations" ? <RelationsTab campaignId={campaignId} /> : null}
    </PageContainer>
  );
}

/** The living NPCs and monsters actually in play. */
async function CastTab({ campaignId }: { campaignId: number }) {
  const list = await db
    .select()
    .from(npcs)
    .where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, false)))
    .orderBy(asc(npcs.name));

  return (
    <>
      <PageHeader
        title="NPCs & Monsters"
        description="The living cast of this campaign — the specific characters and creatures in play."
        icon={Skull}
        actions={
          list.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <CreateHomebrewButton campaignId={campaignId} />
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
          <strong className="text-foreground">Bestiary</strong> tab — save any NPC
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
    </>
  );
}

/** The reusable stat-block library. */
async function BestiaryTab({ campaignId }: { campaignId: number }) {
  const list = await db
    .select()
    .from(npcs)
    .where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, true)))
    .orderBy(asc(npcs.name));

  return (
    <>
      <PageHeader
        title="Bestiary"
        description="Your reusable library of stat-block templates — the monster manual you draw from."
        icon={BookOpen}
        actions={
          list.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <CreateHomebrewButton campaignId={campaignId} />
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
          living NPC/monster (it appears under the{" "}
          <strong className="text-foreground">Cast</strong> tab), or{" "}
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
    </>
  );
}

/** The web of relationships between NPCs. */
async function RelationsTab({ campaignId }: { campaignId: number }) {
  const [allRelationships, allNpcs] = await Promise.all([
    db
      .select()
      .from(npcRelationships)
      .where(eq(npcRelationships.campaignId, campaignId)),
    db
      .select({ id: npcs.id, name: npcs.name })
      .from(npcs)
      .where(eq(npcs.campaignId, campaignId))
      .orderBy(asc(npcs.name)),
  ]);

  return (
    <>
      <PageHeader
        icon={Network}
        title="NPC Relations"
        description="Visualize the web of relationships between your NPCs — allies, enemies, family, and more."
      />
      <RelationsGraph
        campaignId={campaignId}
        initialRelationships={allRelationships}
        npcs={allNpcs}
      />
    </>
  );
}
