/**
 * Turning a generated result into real campaign records, through the same API
 * routes the rest of the app uses to create them. Client-side only.
 */
import type { AtlasCategory, AtlasMarker, Npc } from "@/db/schema";
import type { AtlasLinkType } from "@/lib/atlas/link-types";
import { api } from "@/lib/client";
import type { GeneratedResult, SaveTarget } from "@/lib/generators/registry";
import { MAGIC_ITEMS, SETTLEMENT_SIZES, TREASURE_TIERS } from "@/lib/generators/tables";

export type SavedRecord = {
  id: number;
  name: string;
  href: string;
  /** Present when the record can be linked from an Atlas marker. */
  linkType?: AtlasLinkType;
};

const lines = (...parts: [string, string | undefined][]) =>
  parts
    .filter(([, v]) => v && v !== "—")
    .map(([k, v]) => `**${k}:** ${v}`)
    .join("\n\n");

const sentence = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);
const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export async function saveResult(
  target: SaveTarget,
  result: GeneratedResult,
  campaignId: number,
  extra: { shopId?: number } = {},
): Promise<SavedRecord> {
  const v = result.values;
  const base = `/campaign/${campaignId}`;

  switch (target) {
    case "npc": {
      const block = v.statBlock
        ? (await import("@/lib/srd-monsters")).SRD_MONSTERS.find((m) => m.name === v.statBlock)
        : undefined;
      const stats = block
        ? {
            str: block.str, dex: block.dex, con: block.con, int: block.int, wis: block.wis, cha: block.cha,
            armorClass: block.armorClass, hpMax: block.hpMax, hpCurrent: block.hpMax, speed: block.speed,
            challengeRating: block.challengeRating, experiencePoints: block.experiencePoints,
            savingThrowProficiencies: block.savingThrowProficiencies, skillProficiencies: block.skillProficiencies,
            languages: block.languages, traits: block.traits, actions: block.actions, reactions: block.reactions,
          }
        : // A commoner's hit points, so the NPC can join a fight without editing first.
          { hpMax: 4, hpCurrent: 4 };
      const npc = await api.post<Npc>("/api/npcs", {
        campaignId,
        type: "npc",
        name: v.name,
        race: v.ancestry,
        class: v.occupation,
        ...stats,
        notes: lines(
          ["Pronouns", v.pronouns],
          ["Occupation", v.occupation],
          ["Appearance", v.appearance],
          ["Personality", v.trait],
          ["Ideal", v.ideal],
          ["Bond", v.bond],
          ["Flaw", v.flaw],
          ["Secret", v.secret],
          ["Hook", v.hook],
          ["Stat block", v.statBlock ? `${v.statBlock} (SRD)` : undefined],
        ),
      });
      return { id: npc.id, name: npc.name, href: `${base}/npcs/${npc.id}`, linkType: "npc" };
    }

    case "shop": {
      const shop = await api.post<{ id: number; name: string }>("/api/shops", {
        campaignId,
        name: v.name,
        description: `${sentence(v.vibe)}\n\n**House specialty:** ${v.specialty}`,
        notes: lines(["Barkeep", v.barkeep], ["Patron", v.patron], ["Rumor", v.rumor]),
      });
      return { id: shop.id, name: shop.name, href: `${base}/shops/${shop.id}`, linkType: "shop" };
    }

    case "location": {
      const size = SETTLEMENT_SIZES.find((s) => v.size?.startsWith(s.label));
      const loc = await api.post<{ id: number; name: string }>("/api/locations", {
        campaignId,
        name: v.name,
        type: size?.type ?? "town",
        description: `${sentence(v.size)}\n\n${sentence(v.feature)}`,
        notes: lines(["Problem", v.problem], ["Local power", v.power]),
      });
      return { id: loc.id, name: loc.name, href: `${base}/world/${loc.id}`, linkType: "location" };
    }

    case "quest": {
      const title = `${capitalise(v.task)} ${v.place}`;
      const quest = await api.post<{ id: number; title: string }>("/api/quests", {
        campaignId,
        title: title.slice(0, 200),
        description: `${v.patron} asks the party to ${v.task} ${v.place}.`,
        reward: v.reward,
        notes: lines(["Twist", v.twist]),
      });
      return { id: quest.id, name: quest.title, href: `${base}/quests?focus=quest-${quest.id}`, linkType: "quest" };
    }

    case "rumor": {
      const rumor = await api.post<{ id: number; text: string }>("/api/rumors", {
        campaignId,
        text: v.rumor,
        source: `${v.source} — ${v.truth}`,
      });
      return { id: rumor.id, name: rumor.text, href: `${base}/rumors?focus=rumor-${rumor.id}`, linkType: "rumor" };
    }

    case "shop_stock": {
      if (!extra.shopId) throw new Error("Pick a shop first");
      const known = new Map(
        TREASURE_TIERS.flatMap((t) => MAGIC_ITEMS[t]).map((i) => [i.name, i] as const),
      );
      const items = (v.items ?? "").split("\n").map((s) => s.trim()).filter((s) => s && s !== "—");
      for (const name of items) {
        const srd = known.get(name);
        await api.post("/api/shop-items", {
          shopId: extra.shopId,
          name,
          quantity: 1,
          rarity: srd?.rarity ?? "uncommon",
          itemType: srd?.type ?? "",
        });
      }
      return { id: extra.shopId, name: "", href: `${base}/shops/${extra.shopId}` };
    }
  }
}

const MARKER_ICONS: Partial<Record<AtlasLinkType, string>> = {
  shop: "beer",
  location: "house",
};

/**
 * Drop a saved record onto an Atlas map as a marker linked to it, using the
 * same marker route the Atlas editor does. It lands in the middle of the map,
 * ready to be dragged into place.
 */
export async function addRecordToMap(
  campaignId: number,
  mapId: number,
  record: SavedRecord,
): Promise<string> {
  if (!record.linkType) throw new Error("This record can't be placed on a map");
  const categories = await api.get<AtlasCategory[]>(`/api/atlas-categories?campaignId=${campaignId}`);
  const marker = await api.post<AtlasMarker>("/api/atlas-markers", {
    mapId,
    x: 0.5,
    y: 0.5,
    title: record.name.slice(0, 120),
    categoryId: categories[0]?.id ?? null,
    icon: MARKER_ICONS[record.linkType] ?? null,
    linkType: record.linkType,
    linkId: record.id,
  });
  return `/campaign/${campaignId}/world/maps/${mapId}?marker=${marker.id}`;
}
