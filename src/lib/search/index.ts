import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  atlasMaps,
  atlasMarkers,
  battleMaps,
  calendarEvents,
  characters,
  clocks,
  documents,
  encounters,
  factions,
  handouts,
  homebrewFeats,
  homebrewSpells,
  locations,
  magicItems,
  mindMaps,
  notes,
  npcs,
  quests,
  rollTables,
  rumors,
  sessionPreps,
  shopItems,
  shops,
  storyEvents,
} from "@/db/schema";
import { searchGeneration } from "@/lib/search/stale";
import type { SearchResult, SearchType } from "@/lib/search/types";

/**
 * Global search over a whole campaign.
 *
 * Every searchable record is flattened into one document — its name, plus all
 * of its prose (descriptions, notes, secrets, backstory, stat-block text…) —
 * and kept in memory per campaign. A query is a handful of string scans over
 * a few thousand documents at most, which is well under a millisecond, so no
 * search engine or FTS table is needed.
 *
 * The index is rebuilt lazily: any write through the API (see `apiRoute`)
 * bumps a generation counter, and the next search for a campaign rebuilds it
 * if its copy is from an older generation.
 */

type SearchDoc = Omit<SearchResult, "snippet"> & {
  /** Lower-cased name, matched first and ranked highest. */
  name: string;
  /** Original body text, for building snippets. */
  body: string;
  /** Lower-cased body text, for matching. */
  bodyLower: string;
};

type CampaignIndex = { generation: number; docs: SearchDoc[] };

// Survive dev-server module reloads, and share state across route bundles.
const store = globalThis as typeof globalThis & {
  __sanctumSearchIndexes?: Map<number, CampaignIndex>;
};
function indexes() {
  store.__sanctumSearchIndexes ??= new Map();
  return store.__sanctumSearchIndexes;
}

/** Text out of arbitrary JSON columns (traits, actions, plot points, nodes…). */
function textOf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return "";
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(" · ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      // Ids, urls and colours aren't prose — skip them so they don't match.
      .filter(([k]) => !/(^id$|Id$|url|Url|color|icon)/.test(k))
      .map(([, v]) => textOf(v))
      .filter(Boolean)
      .join(" · ");
  }
  return "";
}

function joinText(...parts: unknown[]): string {
  return parts.map(textOf).filter((p) => p.trim()).join(" · ");
}

function doc(
  type: SearchType,
  id: number,
  label: string,
  href: string,
  body: string,
  sublabel?: string,
): SearchDoc {
  const name = label.trim() || "—";
  return {
    type,
    id,
    label: name,
    href,
    sublabel: sublabel?.trim() || undefined,
    name: name.toLowerCase(),
    body,
    bodyLower: body.toLowerCase(),
  };
}

const short = (s: string, n = 80) => (s.length > n ? s.slice(0, n).trimEnd() + "…" : s);

async function buildIndex(campaignId: number): Promise<SearchDoc[]> {
  const base = `/campaign/${campaignId}`;
  const by = <T extends { campaignId: unknown }>(table: T) => eq(table.campaignId as never, campaignId);

  const [
    charRows, npcRows, locRows, mapRows, questRows, itemRows, handoutRows, rumorRows,
    shopRows, factionRows, noteRows, docRows, sessionRows, storyRows, calRows, clockRows,
    mindRows, tableRows, spellRows, featRows, encRows, battleRows,
  ] = await Promise.all([
    db.select().from(characters).where(by(characters)),
    db.select().from(npcs).where(by(npcs)),
    db.select().from(locations).where(by(locations)),
    db.select({ id: atlasMaps.id, name: atlasMaps.name }).from(atlasMaps).where(by(atlasMaps)),
    db.select().from(quests).where(by(quests)),
    db.select().from(magicItems).where(by(magicItems)),
    db.select().from(handouts).where(by(handouts)),
    db.select().from(rumors).where(by(rumors)),
    db.select().from(shops).where(by(shops)),
    db.select().from(factions).where(by(factions)),
    db.select().from(notes).where(by(notes)),
    db.select({ id: documents.id, name: documents.name, notes: documents.notes }).from(documents).where(by(documents)),
    db.select().from(sessionPreps).where(by(sessionPreps)),
    db.select().from(storyEvents).where(by(storyEvents)),
    db.select().from(calendarEvents).where(by(calendarEvents)),
    db.select().from(clocks).where(by(clocks)),
    db.select().from(mindMaps).where(by(mindMaps)),
    db.select().from(rollTables).where(by(rollTables)),
    db.select().from(homebrewSpells).where(by(homebrewSpells)),
    db.select().from(homebrewFeats).where(by(homebrewFeats)),
    db.select({ id: encounters.id, name: encounters.name, isTemplate: encounters.isTemplate, status: encounters.status }).from(encounters).where(by(encounters)),
    db.select({ id: battleMaps.id, name: battleMaps.name }).from(battleMaps).where(by(battleMaps)),
  ]);

  const mapIds = mapRows.map((m) => m.id);
  const shopIds = shopRows.map((s) => s.id);
  const [markerRows, itemRowsInShops] = await Promise.all([
    mapIds.length
      ? db.select().from(atlasMarkers).where(inArray(atlasMarkers.mapId, mapIds))
      : Promise.resolve([]),
    shopIds.length
      ? db.select().from(shopItems).where(inArray(shopItems.shopId, shopIds))
      : Promise.resolve([]),
  ]);
  const mapName = new Map(mapRows.map((m) => [m.id, m.name]));
  const shopName = new Map(shopRows.map((s) => [s.id, s.name]));

  const focus = (path: string, key: string, extra = "") =>
    `${base}/${path}?${extra ? `${extra}&` : ""}focus=${key}`;

  return [
    ...charRows.map((c) =>
      doc("character", c.id, c.name, `${base}/characters/${c.id}`,
        joinText(c.race, c.class, c.subclass, c.background, c.personalityTraits, c.ideals, c.bonds, c.flaws, c.backstory, c.notes, c.featuresAndTraits, c.feats),
        [c.race, c.class].filter(Boolean).join(" ")),
    ),
    ...npcRows.map((n) =>
      doc("npc", n.id, n.name, `${base}/${n.type === "monster" ? "bestiary" : "npcs"}/${n.id}`,
        joinText(n.race, n.class, n.alignment, n.notes, n.traits, n.actions, n.reactions, n.legendaryActions, n.lairActions),
        n.type === "monster" ? [n.challengeRating && `CR ${n.challengeRating}`, n.race].filter(Boolean).join(" · ") : [n.race, n.class].filter(Boolean).join(" ")),
    ),
    ...locRows.map((l) =>
      doc("location", l.id, l.name, `${base}/world/${l.id}`, joinText(l.description, l.notes), l.type),
    ),
    ...mapRows.map((m) => doc("map", m.id, m.name, `${base}/world/maps/${m.id}`, "")),
    ...markerRows.map((m) =>
      doc("marker", m.id, m.title, `${base}/world/maps/${m.mapId}?marker=${m.id}`,
        joinText(m.description, m.dmNotes), mapName.get(m.mapId)),
    ),
    ...questRows.map((q) =>
      doc("quest", q.id, q.title, focus("quests", `quest-${q.id}`),
        joinText(q.description, q.subObjectives, q.reward, q.notes), q.status),
    ),
    ...itemRows.map((i) =>
      doc("magic_item", i.id, i.name, focus("magic-items", `magic_item-${i.id}`),
        joinText(i.itemType, i.description, i.rechargeCondition, i.notes), i.rarity),
    ),
    ...handoutRows.map((h) =>
      doc("handout", h.id, h.title, focus("handouts", `handout-${h.id}`), joinText(h.content)),
    ),
    ...rumorRows.map((r) =>
      doc("rumor", r.id, short(r.text), focus("rumors", `rumor-${r.id}`), joinText(r.text, r.source), r.source),
    ),
    ...shopRows.map((s) =>
      doc("shop", s.id, s.name, `${base}/shops/${s.id}`, joinText(s.description, s.notes)),
    ),
    ...itemRowsInShops.map((i) =>
      doc("shop_item", i.id, i.name, `${base}/shops/${i.shopId}?focus=shop_item-${i.id}`,
        joinText(i.itemType, i.description, i.price), shopName.get(i.shopId)),
    ),
    ...factionRows.map((f) =>
      doc("faction", f.id, f.name, focus("factions", `faction-${f.id}`),
        joinText(f.description, f.goals, f.resources, f.secrets, f.notes)),
    ),
    ...noteRows.map((n) =>
      doc("note", n.id, n.title || short(n.content, 60), focus("notes", `note-${n.id}`), joinText(n.content)),
    ),
    ...docRows.map((d) =>
      doc("document", d.id, d.name, focus("documents", `document-${d.id}`), joinText(d.notes)),
    ),
    ...sessionRows.map((s) =>
      doc("session", s.id, s.sessionNumber != null ? `#${s.sessionNumber}` : s.sessionDate ?? `#${s.id}`,
        `${base}/sessions/${s.id}`, joinText(s.dmNotes, s.plotPoints), s.sessionDate ?? undefined),
    ),
    ...storyRows.map((e) =>
      doc("story_event", e.id, e.title, focus("story", `story_event-${e.id}`), joinText(e.description), e.inWorldDate ?? undefined),
    ),
    ...calRows.map((e) =>
      doc("calendar_event", e.id, e.title, focus("calendar", `calendar_event-${e.id}`), joinText(e.description), e.inWorldDate ?? e.realDate ?? undefined),
    ),
    ...clockRows.map((c) =>
      doc("clock", c.id, c.name, `${base}?focus=clock-${c.id}`, joinText(c.note)),
    ),
    ...mindRows.map((m) =>
      doc("mind_map", m.id, m.name, `${base}/mind-map?map=${m.id}`, joinText(m.nodes, m.edges)),
    ),
    ...tableRows.map((t) =>
      doc("roll_table", t.id, t.name, focus("magic-items", `roll_table-${t.id}`, "tab=shops"),
        joinText(t.description, t.entries)),
    ),
    ...spellRows.map((s) =>
      doc("homebrew_spell", s.id, s.name, focus("homebrew", `homebrew_spell-${s.id}`),
        joinText(s.school, s.description, s.classes), s.school),
    ),
    ...featRows.map((f) =>
      doc("homebrew_feat", f.id, f.name, focus("homebrew", `homebrew_feat-${f.id}`),
        joinText(f.prerequisite, f.description)),
    ),
    // Live fights are found on the Combat page; saved ones in the builder.
    ...encRows.map((e) =>
      doc("encounter", e.id, e.name,
        e.isTemplate ? focus("combat/builder", `encounter-${e.id}`) : `${base}/combat`, ""),
    ),
    ...battleRows.map((m) => doc("battle_map", m.id, m.name, `${base}/battle-map?map=${m.id}`, "")),
  ];
}

async function indexFor(campaignId: number): Promise<SearchDoc[]> {
  const cached = indexes().get(campaignId);
  const generation = searchGeneration();
  if (cached && cached.generation === generation) return cached.docs;
  const docs = await buildIndex(campaignId);
  indexes().set(campaignId, { generation, docs });
  return docs;
}

function snippet(body: string, lower: string, term: string): string {
  const at = lower.indexOf(term);
  if (at < 0) return "";
  const start = Math.max(0, at - 40);
  const end = Math.min(body.length, at + term.length + 60);
  return `${start > 0 ? "…" : ""}${body.slice(start, end).replace(/\s+/g, " ").trim()}${end < body.length ? "…" : ""}`;
}

/** Results per record type, so one busy type can't crowd out the rest. */
const PER_TYPE = 6;
const TOTAL = 40;

export async function searchCampaign(campaignId: number, query: string): Promise<SearchResult[]> {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const phrase = terms.join(" ");
  const docs = await indexFor(campaignId);

  const scored: { doc: SearchDoc; score: number; inBody: string | null }[] = [];
  for (const d of docs) {
    let score = 0;
    let inBody: string | null = null;
    let all = true;
    for (const term of terms) {
      if (d.name.includes(term)) score += d.name.startsWith(term) ? 6 : 4;
      else if (d.bodyLower.includes(term)) {
        score += 1;
        inBody ??= term;
      } else {
        all = false;
        break;
      }
    }
    if (!all) continue;
    if (d.name === phrase) score += 20;
    else if (d.name.startsWith(phrase)) score += 10;
    scored.push({ doc: d, score, inBody });
  }
  scored.sort((a, b) => b.score - a.score || a.doc.label.localeCompare(b.doc.label));

  const perType = new Map<SearchType, number>();
  const out: SearchResult[] = [];
  for (const { doc: d, inBody } of scored) {
    const n = perType.get(d.type) ?? 0;
    if (n >= PER_TYPE) continue;
    perType.set(d.type, n + 1);
    out.push({
      id: d.id,
      type: d.type,
      label: d.label,
      sublabel: d.sublabel,
      snippet: inBody ? snippet(d.body, d.bodyLower, inBody) : undefined,
      href: d.href,
    });
    if (out.length >= TOTAL) break;
  }
  return out;
}
