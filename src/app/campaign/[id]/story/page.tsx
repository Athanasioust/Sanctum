import { and, asc, desc, eq } from "drizzle-orm";
import { ScrollText } from "lucide-react";
import { db } from "@/db";
import { storyEvents, npcs, locations } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { StoryTimeline } from "@/components/story/story-timeline";

export const dynamic = "force-dynamic";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const [events, npcOptions, locationOptions] = await Promise.all([
    db.select().from(storyEvents).where(eq(storyEvents.campaignId, campaignId)).orderBy(desc(storyEvents.createdAt)),
    db
      .select({ id: npcs.id, name: npcs.name })
      .from(npcs)
      .where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, false)))
      .orderBy(asc(npcs.name)),
    db.select({ id: locations.id, name: locations.name }).from(locations).where(eq(locations.campaignId, campaignId)).orderBy(asc(locations.name)),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Story"
        description="A timeline of sessions, plot threads, milestones and events."
        icon={ScrollText}
      />
      <StoryTimeline
        campaignId={campaignId}
        initialEvents={events}
        npcs={npcOptions}
        locations={locationOptions}
      />
    </PageContainer>
  );
}
