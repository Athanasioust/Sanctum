import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { npcRelationships, npcs } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { RelationsGraph } from "@/components/relations/relations-graph";
import { Network } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RelationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);

  const [allRelationships, allNpcs] = await Promise.all([
    db
      .select()
      .from(npcRelationships)
      .where(eq(npcRelationships.campaignId, id)),
    db
      .select({ id: npcs.id, name: npcs.name })
      .from(npcs)
      .where(eq(npcs.campaignId, id))
      .orderBy(asc(npcs.name)),
  ]);

  return (
    <PageContainer>
      <PageHeader
        icon={Network}
        title="NPC Relations"
        description="Visualize the web of relationships between your NPCs — allies, enemies, family, and more."
      />
      <RelationsGraph
        campaignId={id}
        initialRelationships={allRelationships}
        npcs={allNpcs}
      />
    </PageContainer>
  );
}
