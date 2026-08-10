import { and, asc, eq } from "drizzle-orm";
import { FlaskConical } from "lucide-react";
import { db } from "@/db";
import { homebrewFeats, homebrewSpells, magicItems, npcs } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { HomebrewManager } from "@/components/homebrew/homebrew-manager";

export const dynamic = "force-dynamic";

export default async function HomebrewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);

  const [spells, feats, homebrewMonsters, homebrewItems] = await Promise.all([
    db
      .select()
      .from(homebrewSpells)
      .where(eq(homebrewSpells.campaignId, campaignId))
      .orderBy(asc(homebrewSpells.name)),
    db
      .select()
      .from(homebrewFeats)
      .where(eq(homebrewFeats.campaignId, campaignId))
      .orderBy(asc(homebrewFeats.name)),
    db
      .select({ id: npcs.id })
      .from(npcs)
      .where(and(eq(npcs.campaignId, campaignId), eq(npcs.source, "homebrew"))),
    db
      .select({ id: magicItems.id })
      .from(magicItems)
      .where(and(eq(magicItems.campaignId, campaignId), eq(magicItems.source, "homebrew"))),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Homebrew"
        description="Your own spells, feats, monsters and items, living alongside the SRD content."
        icon={FlaskConical}
      />
      <HomebrewManager
        campaignId={campaignId}
        spells={spells}
        feats={feats}
        monsterCount={homebrewMonsters.length}
        itemCount={homebrewItems.length}
      />
    </PageContainer>
  );
}
