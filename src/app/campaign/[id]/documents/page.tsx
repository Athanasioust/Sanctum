import { asc, eq } from "drizzle-orm";
import { FileText } from "lucide-react";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { DocumentsLibrary } from "@/components/documents/documents-library";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const list = await db
    .select()
    .from(documents)
    .where(eq(documents.campaignId, campaignId))
    .orderBy(asc(documents.name));

  return (
    <PageContainer>
      <PageHeader
        title="Documents"
        description="Reference PDFs you can read without leaving Sanctum."
        icon={FileText}
      />
      <DocumentsLibrary campaignId={campaignId} documents={list} />
    </PageContainer>
  );
}
