import { asc, desc, eq } from "drizzle-orm";
import { Network } from "lucide-react";
import { db } from "@/db";
import { characters, factions, locations, mindMaps, npcs, quests } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { MindMap, type LinkableEntity } from "@/components/mindmap/mind-map";

export const dynamic = "force-dynamic";

export default async function MindMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);

  const [maps, npcRows, locationRows, questRows, factionRows, characterRows] =
    await Promise.all([
      db
        .select()
        .from(mindMaps)
        .where(eq(mindMaps.campaignId, campaignId))
        .orderBy(desc(mindMaps.updatedAt)),
      db
        .select({ id: npcs.id, name: npcs.name })
        .from(npcs)
        .where(eq(npcs.campaignId, campaignId))
        .orderBy(asc(npcs.name)),
      db
        .select({ id: locations.id, name: locations.name })
        .from(locations)
        .where(eq(locations.campaignId, campaignId))
        .orderBy(asc(locations.name)),
      db
        .select({ id: quests.id, name: quests.title })
        .from(quests)
        .where(eq(quests.campaignId, campaignId))
        .orderBy(asc(quests.title)),
      db
        .select({ id: factions.id, name: factions.name })
        .from(factions)
        .where(eq(factions.campaignId, campaignId))
        .orderBy(asc(factions.name)),
      db
        .select({ id: characters.id, name: characters.name })
        .from(characters)
        .where(eq(characters.campaignId, campaignId))
        .orderBy(asc(characters.name)),
    ]);

  // Everything a node can point at, flattened into one pick list.
  const entities: LinkableEntity[] = [
    ...npcRows.map((r) => ({ ...r, type: "npc" as const })),
    ...locationRows.map((r) => ({ ...r, type: "location" as const })),
    ...questRows.map((r) => ({ ...r, type: "quest" as const })),
    ...factionRows.map((r) => ({ ...r, type: "faction" as const })),
    ...characterRows.map((r) => ({ ...r, type: "character" as const })),
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Mind Map"
        description="An infinite canvas for mysteries, plot threads and faction webs."
        icon={Network}
      />
      <MindMap campaignId={campaignId} maps={maps} entities={entities} />
    </PageContainer>
  );
}
