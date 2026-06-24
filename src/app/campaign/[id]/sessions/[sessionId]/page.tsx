import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { sessionPreps, npcs } from "@/db/schema";
import { PageContainer } from "@/components/shared/page-header";
import { SessionPrepEditor } from "@/components/sessions/session-prep-editor";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const campaignId = Number(id);
  const [session] = await db
    .select()
    .from(sessionPreps)
    .where(eq(sessionPreps.id, Number(sessionId)));
  if (!session || session.campaignId !== campaignId) notFound();

  const [bestiary, campaignNpcs] = await Promise.all([
    db
      .select({ id: npcs.id, name: npcs.name })
      .from(npcs)
      .where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, true)))
      .orderBy(asc(npcs.name)),
    db
      .select({ id: npcs.id, name: npcs.name })
      .from(npcs)
      .where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, false)))
      .orderBy(asc(npcs.name)),
  ]);

  return (
    <PageContainer>
      <Link
        href={`/campaign/${campaignId}/sessions`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Sessions
      </Link>
      <SessionPrepEditor session={session} bestiary={bestiary} npcs={campaignNpcs} />
    </PageContainer>
  );
}
