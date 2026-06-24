import { desc, eq } from "drizzle-orm";
import { StickyNote } from "lucide-react";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { NotesBoard } from "@/components/notes/notes-board";

export const dynamic = "force-dynamic";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const list = await db
    .select()
    .from(notes)
    .where(eq(notes.campaignId, campaignId))
    .orderBy(desc(notes.updatedAt));

  return (
    <PageContainer>
      <PageHeader
        title="Notes"
        description="A pinboard for everything else. Pinned notes show on your dashboard."
        icon={StickyNote}
      />
      <NotesBoard campaignId={campaignId} initialNotes={list} />
    </PageContainer>
  );
}
