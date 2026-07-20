import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { rumors, npcs, locations } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { RumorsBoard } from "@/components/rumors/rumors-board";
import { MessageCircleQuestion } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RumorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);

  const [allRumors, allNpcs, allLocations] = await Promise.all([
    db.select().from(rumors).where(eq(rumors.campaignId, id)).orderBy(desc(rumors.createdAt)),
    db
      .select({ id: npcs.id, name: npcs.name })
      .from(npcs)
      .where(eq(npcs.campaignId, id))
      .orderBy(asc(npcs.name)),
    db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .where(eq(locations.campaignId, id))
      .orderBy(asc(locations.name)),
  ]);

  return (
    <PageContainer>
      <PageHeader
        icon={MessageCircleQuestion}
        title="Rumors"
        description="Collect rumors and gossip the party hears — mark them as followed up once investigated."
      />
      <RumorsBoard
        campaignId={id}
        initialRumors={allRumors}
        npcs={allNpcs}
        locations={allLocations}
      />
    </PageContainer>
  );
}
