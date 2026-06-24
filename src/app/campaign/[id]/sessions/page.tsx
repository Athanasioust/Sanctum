import { desc, eq } from "drizzle-orm";
import { ClipboardList } from "lucide-react";
import { db } from "@/db";
import { sessionPreps } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { SessionsClient } from "@/components/sessions/sessions-client";

export const dynamic = "force-dynamic";

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const list = await db
    .select()
    .from(sessionPreps)
    .where(eq(sessionPreps.campaignId, campaignId))
    .orderBy(desc(sessionPreps.sessionNumber));

  return (
    <PageContainer>
      <PageHeader
        title="Session Prep"
        description="Plan upcoming sessions; completed ones become your session history."
        icon={ClipboardList}
      />
      <SessionsClient campaignId={campaignId} initialSessions={list} />
    </PageContainer>
  );
}
