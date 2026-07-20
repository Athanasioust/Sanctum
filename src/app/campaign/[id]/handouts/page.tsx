import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { handouts } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { HandoutsManager } from "@/components/handouts/handouts-manager";
import { Image } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HandoutsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);

  const allHandouts = await db
    .select()
    .from(handouts)
    .where(eq(handouts.campaignId, id))
    .orderBy(asc(handouts.sortOrder));

  return (
    <PageContainer>
      <PageHeader
        icon={Image}
        title="Handouts"
        description="Create and reveal player-facing handouts — letters, maps, lore excerpts, images."
      />
      <HandoutsManager campaignId={id} initialHandouts={allHandouts} />
    </PageContainer>
  );
}
