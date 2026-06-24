import { and, asc, eq } from "drizzle-orm";
import { Coins } from "lucide-react";
import { db } from "@/db";
import { shops, rollTables, locations, npcs } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { ShopsLootClient } from "@/components/shops/shops-loot-client";
import { TreasureGeneratorButton } from "@/components/shops/treasure-generator-button";

export const dynamic = "force-dynamic";

export default async function ShopsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const [shopList, tableList, locationOptions, npcOptions] = await Promise.all([
    db.select().from(shops).where(eq(shops.campaignId, campaignId)).orderBy(asc(shops.name)),
    db.select().from(rollTables).where(eq(rollTables.campaignId, campaignId)).orderBy(asc(rollTables.name)),
    db.select({ id: locations.id, name: locations.name }).from(locations).where(eq(locations.campaignId, campaignId)).orderBy(asc(locations.name)),
    db
      .select({ id: npcs.id, name: npcs.name })
      .from(npcs)
      .where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, false)))
      .orderBy(asc(npcs.name)),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Shops & Loot"
        description="Stock shops and roll on weighted loot tables."
        icon={Coins}
        actions={<TreasureGeneratorButton />}
      />
      <ShopsLootClient
        campaignId={campaignId}
        initialShops={shopList}
        initialRollTables={tableList}
        locations={locationOptions}
        npcs={npcOptions}
      />
    </PageContainer>
  );
}
