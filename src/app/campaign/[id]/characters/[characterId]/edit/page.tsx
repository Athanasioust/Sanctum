import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Pencil } from "lucide-react";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { CharacterForm } from "@/components/characters/character-form";

export const dynamic = "force-dynamic";

export default async function EditCharacterPage({
  params,
}: {
  params: Promise<{ id: string; characterId: string }>;
}) {
  const { id, characterId } = await params;
  const campaignId = Number(id);
  const [character] = await db
    .select()
    .from(characters)
    .where(eq(characters.id, Number(characterId)));
  if (!character) notFound();

  return (
    <PageContainer>
      <PageHeader title={`Edit ${character.name}`} icon={Pencil} />
      <CharacterForm campaignId={campaignId} character={character} />
    </PageContainer>
  );
}
