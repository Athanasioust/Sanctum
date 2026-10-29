import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { atlasMaps, atlasMarkers, locations } from "@/db/schema";
import { PageContainer } from "@/components/shared/page-header";
import { AtlasEditor } from "@/components/atlas/atlas-editor";
import { getTranslation } from "@/lib/i18n/server";
import { ensureAtlasCategories, loadAtlasLinkables } from "@/lib/atlas/server";

export const dynamic = "force-dynamic";

export default async function AtlasMapPage({
  params,
}: {
  params: Promise<{ id: string; mapId: string }>;
}) {
  const { id, mapId } = await params;
  const campaignId = Number(id);
  const [map] = await db.select().from(atlasMaps).where(eq(atlasMaps.id, Number(mapId)));
  if (!map || map.campaignId !== campaignId) notFound();

  const { t } = await getTranslation();
  const [markers, categories, maps, places, records] = await Promise.all([
    db.select().from(atlasMarkers).where(eq(atlasMarkers.mapId, map.id)).orderBy(asc(atlasMarkers.id)),
    ensureAtlasCategories(campaignId, t),
    db
      .select({ id: atlasMaps.id, name: atlasMaps.name, parentMapId: atlasMaps.parentMapId })
      .from(atlasMaps)
      .where(eq(atlasMaps.campaignId, campaignId))
      .orderBy(asc(atlasMaps.name)),
    db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .where(eq(locations.campaignId, campaignId))
      .orderBy(asc(locations.name)),
    loadAtlasLinkables(campaignId),
  ]);

  return (
    <PageContainer>
      {/* Keyed by map so walking through a portal starts a fresh editor. */}
      <AtlasEditor
        key={map.id}
        campaignId={campaignId}
        initialMap={map}
        initialMarkers={markers}
        initialCategories={categories}
        maps={maps}
        places={places}
        records={records}
      />
    </PageContainer>
  );
}
