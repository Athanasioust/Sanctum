import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Pencil } from "lucide-react";
import { db } from "@/db";
import { npcs } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { NpcForm } from "@/components/npcs/npc-form";

export const dynamic = "force-dynamic";

export default async function EditNpcPage({
  params,
}: {
  params: Promise<{ id: string; npcId: string }>;
}) {
  const { id, npcId } = await params;
  const campaignId = Number(id);
  const [npc] = await db.select().from(npcs).where(eq(npcs.id, Number(npcId)));
  if (!npc) notFound();

  return (
    <PageContainer>
      <PageHeader title={`Edit ${npc.name}`} icon={Pencil} />
      <NpcForm campaignId={campaignId} npc={npc} redirectBase={npc.isTemplate ? "bestiary" : "npcs"} />
    </PageContainer>
  );
}
