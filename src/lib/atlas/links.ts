import type { AtlasLinkType } from "@/db/schema";
import type { TranslationKey } from "@/lib/i18n";

/** A record a marker can be linked to, flattened for the picker. */
export type AtlasLinkable = { type: AtlasLinkType; id: number; name: string };

export const ATLAS_LINK_LABEL_KEYS: Record<AtlasLinkType, TranslationKey> = {
  location: "atlas.link.location",
  npc: "atlas.link.npc",
  quest: "atlas.link.quest",
  shop: "atlas.link.shop",
  faction: "atlas.link.faction",
  handout: "atlas.link.handout",
  rumor: "atlas.link.rumor",
};

/**
 * Where a linked record lives. Locations, NPCs and shops have their own pages;
 * the rest are boards, so the link opens the board.
 */
export function atlasLinkHref(campaignId: number, type: AtlasLinkType, id: number): string {
  const base = `/campaign/${campaignId}`;
  switch (type) {
    case "location":
      return `${base}/world/${id}`;
    case "npc":
      return `${base}/npcs/${id}`;
    case "shop":
      return `${base}/shops/${id}`;
    case "quest":
      return `${base}/quests`;
    case "faction":
      return `${base}/factions`;
    case "handout":
      return `${base}/handouts`;
    case "rumor":
      return `${base}/rumors`;
  }
}

export function atlasMapHref(campaignId: number, mapId: number): string {
  return `/campaign/${campaignId}/world/maps/${mapId}`;
}

/** Walk parent links up to the root, root first. Guards against cycles. */
export function atlasAncestors<T extends { id: number; parentMapId: number | null }>(
  maps: T[],
  mapId: number,
): T[] {
  const byId = new Map(maps.map((m) => [m.id, m]));
  const chain: T[] = [];
  const seen = new Set<number>();
  let cur = byId.get(mapId);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.unshift(cur);
    cur = cur.parentMapId ? byId.get(cur.parentMapId) : undefined;
  }
  return chain;
}

/** Ids of a map and everything beneath it (the maps that can't be its parent). */
export function atlasDescendantIds<T extends { id: number; parentMapId: number | null }>(
  maps: T[],
  mapId: number,
): Set<number> {
  const out = new Set<number>([mapId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const m of maps) {
      if (m.parentMapId && out.has(m.parentMapId) && !out.has(m.id)) {
        out.add(m.id);
        grew = true;
      }
    }
  }
  return out;
}
