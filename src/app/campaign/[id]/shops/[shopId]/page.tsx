import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, User, MapPin } from "lucide-react";
import { db } from "@/db";
import { shops, shopItems, locations, npcs } from "@/db/schema";
import { PageContainer } from "@/components/shared/page-header";
import { EntityActions } from "@/components/shared/entity-actions";
import { ShopItemsManager } from "@/components/shops/shop-items-manager";

export const dynamic = "force-dynamic";

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ id: string; shopId: string }>;
}) {
  const { id, shopId } = await params;
  const campaignId = Number(id);
  const [shop] = await db.select().from(shops).where(eq(shops.id, Number(shopId)));
  if (!shop || shop.campaignId !== campaignId) notFound();

  const [items, owner, location] = await Promise.all([
    db.select().from(shopItems).where(eq(shopItems.shopId, shop.id)).orderBy(asc(shopItems.name)),
    shop.ownerNpcId
      ? db.select({ id: npcs.id, name: npcs.name }).from(npcs).where(eq(npcs.id, shop.ownerNpcId))
      : Promise.resolve([]),
    shop.locationId
      ? db.select({ id: locations.id, name: locations.name }).from(locations).where(eq(locations.id, shop.locationId))
      : Promise.resolve([]),
  ]);

  return (
    <PageContainer>
      <Link
        href={`/campaign/${campaignId}/shops`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Shops
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">{shop.name}</h1>
          {shop.description ? <p className="mt-1 max-w-2xl text-muted-foreground">{shop.description}</p> : null}
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {owner[0] ? (
              <Link href={`/campaign/${campaignId}/npcs/${owner[0].id}`} className="flex items-center gap-1 hover:text-foreground">
                <User className="size-4" /> {owner[0].name}
              </Link>
            ) : null}
            {location[0] ? (
              <Link href={`/campaign/${campaignId}/world/${location[0].id}`} className="flex items-center gap-1 hover:text-foreground">
                <MapPin className="size-4" /> {location[0].name}
              </Link>
            ) : null}
          </div>
        </div>
        <EntityActions
          deleteEndpoint={`/api/shops/${shop.id}`}
          entityLabel="Shop"
          redirectTo={`/campaign/${campaignId}/shops`}
        />
      </div>

      {shop.notes ? (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <h3 className="mb-1 text-sm font-medium">Notes</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{shop.notes}</p>
        </div>
      ) : null}

      <ShopItemsManager shopId={shop.id} initialItems={items} />
    </PageContainer>
  );
}
