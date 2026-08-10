import { UserPlus } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { CharacterForm } from "@/components/characters/character-form";

export const dynamic = "force-dynamic";

/**
 * The full, every-field character form. The wizard at `../new` is the default
 * entry point; this is the escape hatch for homebrew and for importing a sheet
 * built somewhere else.
 */
export default async function NewCharacterAdvancedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  return (
    <PageContainer>
      <PageHeader
        title="New Character — full form"
        description="Every field on the sheet, nothing filled in for you."
        icon={UserPlus}
      />
      <CharacterForm campaignId={campaignId} />
    </PageContainer>
  );
}
