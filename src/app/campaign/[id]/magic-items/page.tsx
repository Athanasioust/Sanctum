import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { magicItems, characters } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { MagicItemsList } from "@/components/magic-items/magic-items-list";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MagicItemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);

  const [allItems, allCharacters] = await Promise.all([
    db.select().from(magicItems).where(eq(magicItems.campaignId, id)).orderBy(asc(magicItems.name)),
    db
      .select({ id: characters.id, name: characters.name })
      .from(characters)
      .where(eq(characters.campaignId, id))
      .orderBy(asc(characters.name)),
  ]);

  return (
    <PageContainer>
      <PageHeader
        icon={Sparkles}
        title="Magic Items"
        description="Track the party's magic items, attunement slots, and charges."
      />
      <MagicItemsList campaignId={id} initialItems={allItems} characters={allCharacters} />
    </PageContainer>
  );
}
