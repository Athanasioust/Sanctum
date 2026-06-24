import { and, asc, eq } from "drizzle-orm";
import { Flag } from "lucide-react";
import { db } from "@/db";
import { factions, npcs } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { FactionsBoard } from "@/components/factions/factions-board";

export const dynamic = "force-dynamic";

export default async function FactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const [list, npcOptions] = await Promise.all([
    db.select().from(factions).where(eq(factions.campaignId, campaignId)).orderBy(asc(factions.name)),
    db
      .select({ id: npcs.id, name: npcs.name })
      .from(npcs)
      .where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, false)))
      .orderBy(asc(npcs.name)),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Factions"
        description="The powers and organisations shaping your world."
        icon={Flag}
      />
      <FactionsBoard campaignId={campaignId} initialFactions={list} npcs={npcOptions} />
    </PageContainer>
  );
}
