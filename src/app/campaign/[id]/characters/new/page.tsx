import { UserPlus } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { CharacterForm } from "@/components/characters/character-form";

export const dynamic = "force-dynamic";

export default async function NewCharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  return (
    <PageContainer>
      <PageHeader title="New Character" description="Build a full 5e stat block." icon={UserPlus} />
      <CharacterForm campaignId={campaignId} />
    </PageContainer>
  );
}
