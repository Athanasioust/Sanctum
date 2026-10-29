import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  atlasCategories,
  atlasMaps,
  atlasMarkers,
  factions,
  handouts,
  locations,
  npcs,
  quests,
  rumors,
  shops,
  type AtlasCategory,
  type AtlasFogOp,
  type AtlasLinkType,
  type AtlasMarker,
} from "@/db/schema";
import type { Translate } from "@/lib/i18n";
import { fogPointVisible } from "@/lib/atlas/fog";
import { atlasAncestors, type AtlasLinkable } from "@/lib/atlas/links";
import type { PlayerAtlasMap, PlayerAtlasState } from "@/lib/atlas/types";

/** The starter categories, named in the DM's language when first seeded. */
const DEFAULT_CATEGORIES = [
  { key: "atlas.cat.city", color: "#d4a017", icon: "castle" },
  { key: "atlas.cat.town", color: "#a16207", icon: "house" },
  { key: "atlas.cat.dungeon", color: "#7c3aed", icon: "door-open" },
  { key: "atlas.cat.landmark", color: "#0891b2", icon: "landmark" },
  { key: "atlas.cat.quest", color: "#16a34a", icon: "scroll-text" },
  { key: "atlas.cat.danger", color: "#dc2626", icon: "skull" },
  { key: "atlas.cat.note", color: "#71717a", icon: "sticky-note" },
] as const;

/**
 * A campaign's marker categories, seeding the starter set the first time the
 * atlas is opened. The last category can't be deleted, so an empty list only
 * ever means "never seeded".
 */
export async function ensureAtlasCategories(campaignId: number, t: Translate): Promise<AtlasCategory[]> {
  const existing = await db
    .select()
    .from(atlasCategories)
    .where(eq(atlasCategories.campaignId, campaignId))
    .orderBy(asc(atlasCategories.sortOrder), asc(atlasCategories.id));
  if (existing.length > 0) return existing;
  return db
    .insert(atlasCategories)
    .values(
      DEFAULT_CATEGORIES.map((c, i) => ({
        campaignId,
        name: t(c.key),
        color: c.color,
        icon: c.icon,
        sortOrder: i,
      })),
    )
    .returning();
}

/** Every record in the campaign a marker can point at. */
export async function loadAtlasLinkables(campaignId: number): Promise<AtlasLinkable[]> {
  const [loc, npc, quest, shop, faction, handout, rumor] = await Promise.all([
    db.select({ id: locations.id, name: locations.name }).from(locations).where(eq(locations.campaignId, campaignId)).orderBy(asc(locations.name)),
    db.select({ id: npcs.id, name: npcs.name }).from(npcs).where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, false))).orderBy(asc(npcs.name)),
    db.select({ id: quests.id, name: quests.title }).from(quests).where(eq(quests.campaignId, campaignId)).orderBy(asc(quests.title)),
    db.select({ id: shops.id, name: shops.name }).from(shops).where(eq(shops.campaignId, campaignId)).orderBy(asc(shops.name)),
    db.select({ id: factions.id, name: factions.name }).from(factions).where(eq(factions.campaignId, campaignId)).orderBy(asc(factions.name)),
    db.select({ id: handouts.id, name: handouts.title }).from(handouts).where(eq(handouts.campaignId, campaignId)).orderBy(asc(handouts.title)),
    db.select({ id: rumors.id, name: rumors.text }).from(rumors).where(eq(rumors.campaignId, campaignId)),
  ]);
  const tag = (type: AtlasLinkType) => (r: { id: number; name: string }) => ({
    type,
    id: r.id,
    name: r.name.length > 80 ? r.name.slice(0, 80) + "…" : r.name,
  });
  return [
    ...loc.map(tag("location")),
    ...npc.map(tag("npc")),
    ...quest.map(tag("quest")),
    ...shop.map(tag("shop")),
    ...faction.map(tag("faction")),
    ...handout.map(tag("handout")),
    ...rumor.map(tag("rumor")),
  ];
}

/** Markers linked to one record, with the map each sits on (the reverse link). */
export async function atlasAppearances(campaignId: number, linkType: AtlasLinkType, linkId: number) {
  return db
    .select({
      markerId: atlasMarkers.id,
      title: atlasMarkers.title,
      mapId: atlasMaps.id,
      mapName: atlasMaps.name,
    })
    .from(atlasMarkers)
    .innerJoin(atlasMaps, eq(atlasMaps.id, atlasMarkers.mapId))
    .where(
      and(
        eq(atlasMaps.campaignId, campaignId),
        eq(atlasMarkers.linkType, linkType),
        eq(atlasMarkers.linkId, linkId),
      ),
    )
    .orderBy(asc(atlasMaps.name));
}

/** Resolve a marker's icon and colour against its category. */
export function markerLook(marker: AtlasMarker, categories: Map<number, AtlasCategory>) {
  const cat = marker.categoryId ? categories.get(marker.categoryId) : undefined;
  return {
    icon: marker.icon || cat?.icon || "map-pin",
    color: marker.color || cat?.color || "#d4a017",
  };
}

/**
 * Is this marker something the players may see on a revealed map? Not hidden
 * by the DM, and standing somewhere the fog has lifted.
 */
export function markerVisibleToPlayers(
  marker: Pick<AtlasMarker, "hidden" | "x" | "y">,
  map: { fogEnabled: boolean; fog: AtlasFogOp[]; width: number; height: number },
) {
  return !marker.hidden && fogPointVisible(map.fogEnabled, map.fog, marker.x, marker.y, map.width, map.height);
}

/**
 * The atlas as the player view may see it. `requestedId` is a map a player
 * followed a portal to; it is honoured only if that map is revealed.
 */
export async function loadPlayerAtlas(campaignId: number, requestedId?: number | null): Promise<PlayerAtlasState> {
  const revealed = await db
    .select()
    .from(atlasMaps)
    .where(and(eq(atlasMaps.campaignId, campaignId), eq(atlasMaps.revealToPlayers, true)))
    .orderBy(desc(atlasMaps.revealedAt), desc(atlasMaps.updatedAt));
  const currentId = revealed[0]?.id ?? null;
  const map = revealed.find((m) => m.id === requestedId) ?? revealed[0];
  if (!map) return { currentId: null, map: null };

  const [markerRows, categoryRows] = await Promise.all([
    db.select().from(atlasMarkers).where(eq(atlasMarkers.mapId, map.id)).orderBy(asc(atlasMarkers.id)),
    db.select().from(atlasCategories).where(eq(atlasCategories.campaignId, campaignId)),
  ]);
  const categories = new Map(categoryRows.map((c) => [c.id, c]));
  const revealedIds = new Set(revealed.map((m) => m.id));

  const imageUrl = map.fogEnabled ? map.playerImageUrl : map.imageUrl;
  const out: PlayerAtlasMap = {
    id: map.id,
    name: map.name,
    imageUrl,
    width: map.width,
    height: map.height,
    // A fogged map with no render yet shows nothing at all, markers included.
    markers: imageUrl
      ? markerRows
          .filter((m) => markerVisibleToPlayers(m, map))
          .map((m) => ({
            id: m.id,
            x: m.x,
            y: m.y,
            title: m.title,
            description: m.description,
            ...markerLook(m, categories),
            portalMapId: m.portalMapId && revealedIds.has(m.portalMapId) ? m.portalMapId : null,
          }))
      : [],
    trail: atlasAncestors(revealed, map.id).map((m) => ({ id: m.id, name: m.name })),
  };
  return { currentId, map: out };
}

/** Maps by id, scoped to a campaign — used to validate parent/portal references. */
export async function campaignMapIds(campaignId: number, ids: number[]): Promise<Set<number>> {
  if (ids.length === 0) return new Set();
  const rows = await db
    .select({ id: atlasMaps.id })
    .from(atlasMaps)
    .where(and(eq(atlasMaps.campaignId, campaignId), inArray(atlasMaps.id, ids)));
  return new Set(rows.map((r) => r.id));
}
