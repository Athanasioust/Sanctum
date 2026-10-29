import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { Eye, Map as MapIcon, MapPin } from "lucide-react";
import { db } from "@/db";
import { atlasMaps, atlasMarkers, locations, type AtlasMap } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LocationTree } from "@/components/world/location-tree";
import { LocationDialog } from "@/components/world/location-dialog";
import { MapDialog } from "@/components/atlas/map-dialog";
import { getTranslation } from "@/lib/i18n/server";
import { atlasMapHref } from "@/lib/atlas/links";

export const dynamic = "force-dynamic";

export default async function WorldPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const { t } = await getTranslation();
  const [maps, markerCounts, places] = await Promise.all([
    db.select().from(atlasMaps).where(eq(atlasMaps.campaignId, campaignId)).orderBy(asc(atlasMaps.name)),
    db
      .select({ mapId: atlasMarkers.mapId, n: count() })
      .from(atlasMarkers)
      .innerJoin(atlasMaps, eq(atlasMaps.id, atlasMarkers.mapId))
      .where(eq(atlasMaps.campaignId, campaignId))
      .groupBy(atlasMarkers.mapId),
    db.select().from(locations).where(eq(locations.campaignId, campaignId)).orderBy(asc(locations.name)),
  ]);

  const counts = new Map(markerCounts.map((r) => [r.mapId, r.n]));
  const mapOptions = maps.map((m) => ({ id: m.id, name: m.name, parentMapId: m.parentMapId }));
  const placeOptions = places.map((l) => ({ id: l.id, name: l.name }));
  const ids = new Set(maps.map((m) => m.id));
  // A map whose parent was deleted (or never existed) is shown at the top level.
  const roots = maps.filter((m) => !m.parentMapId || !ids.has(m.parentMapId));
  const childrenOf = (id: number) => maps.filter((m) => m.parentMapId === id);

  function renderTree(list: AtlasMap[], depth: number, seen: Set<number>): React.ReactNode {
    return list
      .filter((m) => !seen.has(m.id))
      .map((m) => {
        const next = new Set(seen).add(m.id);
        const kids = childrenOf(m.id);
        return (
          <div key={m.id}>
            <Link
              href={atlasMapHref(campaignId, m.id)}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 transition-colors hover:border-primary/40"
              style={{ marginLeft: depth * 20 }}
            >
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                {m.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local upload, no optimiser in this app
                  <img src={m.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <MapIcon className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(counts.get(m.id) ?? 0) === 1
                    ? t("atlas.markerCountOne")
                    : t("atlas.markerCount").replace("{n}", String(counts.get(m.id) ?? 0))}
                  {kids.length === 1
                    ? ` · ${t("atlas.subMapCountOne")}`
                    : kids.length
                      ? ` · ${t("atlas.subMapCount").replace("{n}", String(kids.length))}`
                      : ""}
                  {!m.imageUrl ? ` · ${t("atlas.noImage")}` : ""}
                </p>
              </div>
              {m.revealToPlayers ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                  <Eye className="size-3" /> {t("atlas.onPlayerView")}
                </span>
              ) : null}
            </Link>
            {kids.length ? <div className="mt-1 space-y-1">{renderTree(kids, depth + 1, next)}</div> : null}
          </div>
        );
      });
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("nav.world")}
        description={t("atlas.worldDescription")}
        icon={MapIcon}
        actions={maps.length > 0 ? <MapDialog campaignId={campaignId} maps={mapOptions} places={placeOptions} /> : null}
      />

      <section className="mb-10">
        <h2 className="mb-3 font-heading text-lg font-semibold">{t("atlas.maps")}</h2>
        {maps.length === 0 ? (
          <EmptyState
            icon={MapIcon}
            title={t("atlas.noMapsTitle")}
            description={t("atlas.noMapsBody")}
            action={<MapDialog campaignId={campaignId} maps={mapOptions} places={placeOptions} />}
          />
        ) : (
          <div className="space-y-1">{renderTree(roots, 0, new Set())}</div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
              <MapPin className="size-4 text-primary" /> {t("atlas.places")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("atlas.placesHint")}</p>
          </div>
          <LocationDialog campaignId={campaignId} parentOptions={placeOptions} />
        </div>
        {places.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("atlas.noPlaces")}
          </p>
        ) : (
          <LocationTree campaignId={campaignId} locations={places} />
        )}
      </section>
    </PageContainer>
  );
}
