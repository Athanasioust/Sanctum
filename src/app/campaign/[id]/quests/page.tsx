import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quests } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { QuestsBoard } from "@/components/quests/quests-board";
import { ListTodo } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);

  const allQuests = await db
    .select()
    .from(quests)
    .where(eq(quests.campaignId, id));

  return (
    <PageContainer>
      <PageHeader
        icon={ListTodo}
        title="Quests"
        description="Track your party's active quests, objectives, and rewards."
      />
      <QuestsBoard campaignId={id} initialQuests={allQuests} />
    </PageContainer>
  );
}
