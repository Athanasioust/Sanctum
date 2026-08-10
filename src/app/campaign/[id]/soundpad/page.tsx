import { asc, eq } from "drizzle-orm";
import { Music } from "lucide-react";
import { db } from "@/db";
import { soundAssets, soundscapes } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { Soundpad } from "@/components/soundpad/soundpad";

export const dynamic = "force-dynamic";

export default async function SoundpadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);

  const [assets, scapes] = await Promise.all([
    db
      .select()
      .from(soundAssets)
      .where(eq(soundAssets.campaignId, campaignId))
      .orderBy(asc(soundAssets.name)),
    db
      .select()
      .from(soundscapes)
      .where(eq(soundscapes.campaignId, campaignId))
      .orderBy(asc(soundscapes.name)),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Soundpad"
        description="Layered music, ambience and one-shot effects from your own audio files."
        icon={Music}
      />
      <Soundpad campaignId={campaignId} assets={assets} soundscapes={scapes} />
    </PageContainer>
  );
}
