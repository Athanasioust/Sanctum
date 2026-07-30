import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { Upload } from "lucide-react";
import { db } from "@/db";
import { campaigns, characters, npcs } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { ImportClient } from "@/components/import/import-client";
import type { OwnerOption } from "@/components/import/markdown-import";

export const dynamic = "force-dynamic";

export default async function ImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));
  if (!campaign) notFound();

  // Possible owners for imported spells — bestiary templates are left out to
  // keep the list to the things actually in play.
  const [characterRows, npcRows] = await Promise.all([
    db
      .select({ id: characters.id, name: characters.name })
      .from(characters)
      .where(eq(characters.campaignId, campaignId))
      .orderBy(asc(characters.name)),
    db
      .select({ id: npcs.id, name: npcs.name })
      .from(npcs)
      .where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, false)))
      .orderBy(asc(npcs.name)),
  ]);

  const owners: OwnerOption[] = [
    ...characterRows.map((c) => ({ ...c, type: "character" as const })),
    ...npcRows.map((n) => ({ ...n, type: "npc" as const })),
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Import"
        description="Bring existing notes and character sheets into this campaign."
        icon={Upload}
      />
      <ImportClient campaignId={campaignId} owners={owners} />
    </PageContainer>
  );
}
