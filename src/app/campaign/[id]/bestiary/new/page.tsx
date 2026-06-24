import { BookPlus } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { NpcForm } from "@/components/npcs/npc-form";

export const dynamic = "force-dynamic";

export default async function NewBestiaryTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  return (
    <PageContainer>
      <PageHeader title="New Bestiary Template" description="A reusable stat block for this campaign." icon={BookPlus} />
      <NpcForm campaignId={campaignId} isTemplate redirectBase="bestiary" />
    </PageContainer>
  );
}
