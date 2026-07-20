import { and, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import {
  characters,
  npcs,
  locations,
  quests,
  magicItems,
  handouts,
  rumors,
} from "@/db/schema";
import { apiRoute, json, ApiError } from "@/lib/api";

export type SearchResult = {
  id: number;
  type: "character" | "npc" | "location" | "quest" | "magic_item" | "handout" | "rumor";
  label: string;
  sublabel?: string;
  href: string;
};

export const GET = apiRoute(async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const campaignId = Number(url.searchParams.get("campaignId"));

  if (!q || q.length < 2) return json<SearchResult[]>([]);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw new ApiError("campaignId is required", 400);
  }

  const pattern = `%${q}%`;
  const base = `/campaign/${campaignId}`;

  const [chars, npcRows, locs, questRows, items, handoutRows, rumorRows] = await Promise.all([
    db
      .select({ id: characters.id, name: characters.name, class: characters.class })
      .from(characters)
      .where(and(eq(characters.campaignId, campaignId), like(characters.name, pattern)))
      .limit(5),
    db
      .select({ id: npcs.id, name: npcs.name, type: npcs.type })
      .from(npcs)
      .where(and(eq(npcs.campaignId, campaignId), like(npcs.name, pattern)))
      .limit(5),
    db
      .select({ id: locations.id, name: locations.name, type: locations.type })
      .from(locations)
      .where(and(eq(locations.campaignId, campaignId), like(locations.name, pattern)))
      .limit(5),
    db
      .select({ id: quests.id, title: quests.title, status: quests.status })
      .from(quests)
      .where(
        and(
          eq(quests.campaignId, campaignId),
          or(like(quests.title, pattern), like(quests.description, pattern)),
        ),
      )
      .limit(5),
    db
      .select({ id: magicItems.id, name: magicItems.name, rarity: magicItems.rarity })
      .from(magicItems)
      .where(and(eq(magicItems.campaignId, campaignId), like(magicItems.name, pattern)))
      .limit(5),
    db
      .select({ id: handouts.id, title: handouts.title })
      .from(handouts)
      .where(and(eq(handouts.campaignId, campaignId), like(handouts.title, pattern)))
      .limit(5),
    db
      .select({ id: rumors.id, text: rumors.text, source: rumors.source })
      .from(rumors)
      .where(and(eq(rumors.campaignId, campaignId), like(rumors.text, pattern)))
      .limit(5),
  ]);

  const results: SearchResult[] = [
    ...chars.map((c) => ({
      id: c.id,
      type: "character" as const,
      label: c.name,
      sublabel: c.class || "Character",
      href: `${base}/characters/${c.id}`,
    })),
    ...npcRows.map((n) => ({
      id: n.id,
      type: "npc" as const,
      label: n.name,
      sublabel: n.type === "monster" ? "Monster" : "NPC",
      href: `${base}/npcs/${n.id}`,
    })),
    ...locs.map((l) => ({
      id: l.id,
      type: "location" as const,
      label: l.name,
      sublabel: l.type || "Location",
      href: `${base}/world`,
    })),
    ...questRows.map((qt) => ({
      id: qt.id,
      type: "quest" as const,
      label: qt.title,
      sublabel: qt.status,
      href: `${base}/quests`,
    })),
    ...items.map((mi) => ({
      id: mi.id,
      type: "magic_item" as const,
      label: mi.name,
      sublabel: mi.rarity,
      href: `${base}/magic-items`,
    })),
    ...handoutRows.map((h) => ({
      id: h.id,
      type: "handout" as const,
      label: h.title,
      sublabel: "Handout",
      href: `${base}/handouts`,
    })),
    ...rumorRows.map((r) => ({
      id: r.id,
      type: "rumor" as const,
      label: r.text.length > 80 ? r.text.slice(0, 80) + "…" : r.text,
      sublabel: r.source || "Rumor",
      href: `${base}/rumors`,
    })),
  ];

  return json(results);
});
