import { UserPlus } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { CharacterWizard } from "@/components/characters/character-wizard";

export const dynamic = "force-dynamic";

export default async function NewCharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  return (
    <PageContainer>
      <PageHeader
        title="New Character"
        description="Build a 5e character step by step — species, class, background, scores and skills."
        icon={UserPlus}
      />
      <CharacterWizard campaignId={campaignId} />
    </PageContainer>
  );
}
