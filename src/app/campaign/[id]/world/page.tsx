import { asc, eq } from "drizzle-orm";
import { Map as MapIcon } from "lucide-react";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LocationTree } from "@/components/world/location-tree";
import { LocationDialog } from "@/components/world/location-dialog";

export const dynamic = "force-dynamic";

export default async function WorldPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const list = await db
    .select()
    .from(locations)
    .where(eq(locations.campaignId, campaignId))
    .orderBy(asc(locations.name));

  const options = list.map((l) => ({ id: l.id, name: l.name }));

  return (
    <PageContainer>
      <PageHeader
        title="World"
        description="Browse your world's locations, maps and dungeons."
        icon={MapIcon}
        actions={list.length > 0 ? <LocationDialog campaignId={campaignId} parentOptions={options} /> : null}
      />
      {list.length === 0 ? (
        <EmptyState
          icon={MapIcon}
          title="No locations yet"
          description="Map out your world. Create cities, dungeons and regions, nest them, and build maps."
          action={<LocationDialog campaignId={campaignId} parentOptions={options} />}
        />
      ) : (
        <LocationTree campaignId={campaignId} locations={list} />
      )}
    </PageContainer>
  );
}
