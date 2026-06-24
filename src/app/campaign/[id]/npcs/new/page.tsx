import { Skull } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { NpcForm } from "@/components/npcs/npc-form";

export const dynamic = "force-dynamic";

export default async function NewNpcPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  return (
    <PageContainer>
      <PageHeader title="New NPC / Monster" description="Build a full 5e stat block." icon={Skull} />
      <NpcForm campaignId={campaignId} redirectBase="npcs" />
    </PageContainer>
  );
}
