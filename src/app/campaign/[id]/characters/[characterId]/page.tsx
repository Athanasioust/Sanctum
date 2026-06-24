import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { PageContainer } from "@/components/shared/page-header";
import { CharacterDetail } from "@/components/characters/character-detail";

export const dynamic = "force-dynamic";

export default async function CharacterDetailPage({
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
  if (!character || character.campaignId !== campaignId) notFound();

  return (
    <PageContainer>
      <Link
        href={`/campaign/${campaignId}/characters`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to characters
      </Link>
      <CharacterDetail character={character} campaignId={campaignId} />
    </PageContainer>
  );
}
