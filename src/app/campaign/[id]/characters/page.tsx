import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Users, Plus } from "lucide-react";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CharacterGrid } from "@/components/characters/character-grid";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const list = await db
    .select()
    .from(characters)
    .where(eq(characters.campaignId, campaignId))
    .orderBy(asc(characters.name));

  return (
    <PageContainer>
      <PageHeader
        title="Characters"
        description="Your players' heroes and their full stat blocks."
        icon={Users}
        actions={
          list.length > 0 ? (
            <Button asChild>
              <Link href={`/campaign/${campaignId}/characters/new`}>
                <Plus className="size-4" />
                New Character
              </Link>
            </Button>
          ) : null
        }
      />

      {list.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No characters yet"
          description="Add your players' characters to track their stats, spells, inventory and more."
          action={
            <Button asChild>
              <Link href={`/campaign/${campaignId}/characters/new`}>
                <Plus className="size-4" />
                New Character
              </Link>
            </Button>
          }
        />
      ) : (
        <CharacterGrid campaignId={campaignId} characters={list} />
      )}
    </PageContainer>
  );
}
