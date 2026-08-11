import { and, asc, eq } from "drizzle-orm";
import { Coins, Sparkles } from "lucide-react";
import { db } from "@/db";
import { characters, locations, magicItems, npcs, rollTables, shops } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { TabLinks } from "@/components/shared/tab-links";
import { MagicItemsList } from "@/components/magic-items/magic-items-list";
import { ShopsLootClient } from "@/components/shops/shops-loot-client";
import { TreasureGeneratorButton } from "@/components/shops/treasure-generator-button";
import { CreateHomebrewButton } from "@/components/homebrew/create-homebrew-button";

export const dynamic = "force-dynamic";

/**
 * Loot, in two views. Shops & Loot used to be its own sidebar entry; it's a tab
 * here now, selected by `?tab=shops`, and the old route redirects to it.
 */
const TABS = ["items", "shops"] as const;
type ItemsTab = (typeof TABS)[number];

function normalizeTab(value: string | string[] | undefined): ItemsTab {
  const first = Array.isArray(value) ? value[0] : value;
  return TABS.includes(first as ItemsTab) ? (first as ItemsTab) : "items";
}

export default async function MagicItemsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const id = Number((await params).id);
  const tab = normalizeTab((await searchParams).tab);
  const base = `/campaign/${id}/magic-items`;

  return (
    <PageContainer>
      <TabLinks
        className="mb-5"
        active={tab}
        tabs={[
          { value: "items", label: "Magic Items", href: base, icon: Sparkles },
          { value: "shops", label: "Shops & Loot", href: `${base}?tab=shops`, icon: Coins },
        ]}
      />

      {tab === "items" ? <ItemsTabContent campaignId={id} /> : null}
      {tab === "shops" ? <ShopsTabContent campaignId={id} /> : null}
    </PageContainer>
  );
}

async function ItemsTabContent({ campaignId }: { campaignId: number }) {
  const [allItems, allCharacters] = await Promise.all([
    db
      .select()
      .from(magicItems)
      .where(eq(magicItems.campaignId, campaignId))
      .orderBy(asc(magicItems.name)),
    db
      .select({ id: characters.id, name: characters.name })
      .from(characters)
      .where(eq(characters.campaignId, campaignId))
      .orderBy(asc(characters.name)),
  ]);

  return (
    <>
      <PageHeader
        icon={Sparkles}
        title="Magic Items"
        description="Track the party's magic items, attunement slots, and charges."
        actions={<CreateHomebrewButton campaignId={campaignId} />}
      />
      <MagicItemsList
        campaignId={campaignId}
        initialItems={allItems}
        characters={allCharacters}
      />
    </>
  );
}

async function ShopsTabContent({ campaignId }: { campaignId: number }) {
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
    <>
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
    </>
  );
}
