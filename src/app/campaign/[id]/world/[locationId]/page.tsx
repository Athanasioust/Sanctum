import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, or } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { characters, encounters, locations, npcs, rollTables } from "@/db/schema";
import { LocationEncounters } from "@/components/world/location-encounters";
import { abilityModifier } from "@/lib/dnd";
import { PageContainer } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { EntityActions } from "@/components/shared/entity-actions";
import { LocationDialog } from "@/components/world/location-dialog";
import { LocationMap } from "@/components/world/location-map";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string; locationId: string }>;
}) {
  const { id, locationId } = await params;
  const campaignId = Number(id);
  const [location] = await db
    .select()
    .from(locations)
    .where(eq(locations.id, Number(locationId)));
  if (!location || location.campaignId !== campaignId) notFound();

  const [parent, all, tables, monsterRows, partyRows, active] = await Promise.all([
    location.parentLocationId
      ? db.select({ id: locations.id, name: locations.name }).from(locations).where(eq(locations.id, location.parentLocationId))
      : Promise.resolve([]),
    db.select({ id: locations.id, name: locations.name }).from(locations).where(eq(locations.campaignId, campaignId)).orderBy(asc(locations.name)),
    db.select().from(rollTables).where(eq(rollTables.campaignId, campaignId)).orderBy(asc(rollTables.name)),
    db
      .select()
      .from(npcs)
      .where(and(eq(npcs.campaignId, campaignId), or(eq(npcs.type, "monster"), eq(npcs.isTemplate, true)))),
    db.select().from(characters).where(eq(characters.campaignId, campaignId)).orderBy(asc(characters.name)),
    db
      .select({ id: encounters.id })
      .from(encounters)
      .where(
        and(
          eq(encounters.campaignId, campaignId),
          eq(encounters.status, "active"),
          eq(encounters.isTemplate, false),
        ),
      )
      .limit(1),
  ]);
  // Creatures a rolled result can name. A bestiary template and a placed copy
  // can share a name; the template is the canonical stat block, so it wins.
  const creatures = [...monsterRows]
    .sort((a, b) => Number(b.isTemplate) - Number(a.isTemplate))
    .filter((n, i, list) => n.hpMax > 0 && list.findIndex((m) => m.name === n.name) === i)
    .map((n) => ({
      id: n.id,
      name: n.name,
      hpMax: n.hpMax,
      armorClass: n.armorClass,
      initiativeMod: abilityModifier(n.dex),
    }));

  return (
    <PageContainer>
      <Link
        href={`/campaign/${campaignId}/world`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to World
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {parent[0] ? (
            <Link href={`/campaign/${campaignId}/world/${parent[0].id}`} className="text-sm text-muted-foreground hover:text-foreground">
              {parent[0].name} /
            </Link>
          ) : null}
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">{location.name}</h1>
            <Badge variant="secondary" className="capitalize">{location.type}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LocationDialog
            campaignId={campaignId}
            location={location}
            parentOptions={all}
            trigger={<Button variant="outline">Edit</Button>}
          />
          <EntityActions
            deleteEndpoint={`/api/locations/${location.id}`}
            entityLabel="Location"
            redirectTo={`/campaign/${campaignId}/world`}
          />
        </div>
      </div>

      {location.description ? (
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{location.description}</p>
        </div>
      ) : null}

      {location.notes ? (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <h3 className="mb-1 text-sm font-medium">Notes</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{location.notes}</p>
        </div>
      ) : null}

      <LocationEncounters
        campaignId={campaignId}
        locationId={location.id}
        locationName={location.name}
        tables={tables.filter((t) => t.locationId === location.id)}
        otherTables={tables
          .filter((t) => t.locationId !== location.id)
          .map((t) => ({ id: t.id, name: t.name }))}
        creatures={creatures}
        party={partyRows.map((c) => ({
          id: c.id,
          name: c.name,
          hpMax: c.hpMax,
          hpCurrent: c.hpCurrent,
          armorClass: c.armorClass,
          initiativeMod: c.initiativeBonus,
        }))}
        activeEncounterId={active[0]?.id ?? null}
      />

      <h2 className="mb-3 font-heading text-lg font-semibold">Map</h2>
      <LocationMap location={location} />
    </PageContainer>
  );
}
