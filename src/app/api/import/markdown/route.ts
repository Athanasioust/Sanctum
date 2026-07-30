import { and, eq, type SQL } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import {
  campaigns,
  characters,
  factions,
  locations,
  magicItems,
  notes,
  npcs,
  quests,
  spells,
} from "@/db/schema";
import { ApiError, apiRoute, json, parseBody, readJson } from "@/lib/api";
import {
  buildFaction,
  buildLocation,
  buildMagicItem,
  buildNote,
  buildNpc,
  buildQuest,
  buildSpell,
  parseMarkdownDoc,
  type ImportTarget,
  type ParsedDoc,
} from "@/lib/markdown-import";
import { markdownImportSchema } from "@/lib/validators";

export type MarkdownImportResult = {
  path: string;
  name: string;
  target: ImportTarget;
  status: "created" | "skipped" | "failed";
  id?: number;
  message?: string;
};

type Buildable = Exclude<ImportTarget, "skip">;

type TargetHandler = {
  table: SQLiteTable;
  /** Column holding the display name, used for duplicate detection. */
  nameColumn: SQLiteColumn;
  /** Campaign-scoped entities; spells are owner-scoped instead. */
  campaignColumn?: SQLiteColumn;
  /** Shown when a record is skipped as a duplicate. */
  duplicateMessage: string;
  build: (doc: ParsedDoc) => { name: string; values: Record<string, unknown> };
};

const HANDLERS: Record<Buildable, TargetHandler> = {
  note: {
    table: notes,
    nameColumn: notes.title,
    campaignColumn: notes.campaignId,
    duplicateMessage: "A note with this title already exists",
    build: (doc) => {
      const values = buildNote(doc);
      return { name: values.title, values };
    },
  },
  npc: {
    table: npcs,
    nameColumn: npcs.name,
    campaignColumn: npcs.campaignId,
    duplicateMessage: "An NPC or monster with this name already exists",
    build: (doc) => {
      const values = buildNpc(doc, "npc");
      return { name: values.name, values };
    },
  },
  monster: {
    table: npcs,
    nameColumn: npcs.name,
    campaignColumn: npcs.campaignId,
    duplicateMessage: "An NPC or monster with this name already exists",
    build: (doc) => {
      const values = buildNpc(doc, "monster");
      return { name: values.name, values };
    },
  },
  spell: {
    table: spells,
    nameColumn: spells.name,
    duplicateMessage: "That owner already knows a spell with this name",
    build: (doc) => {
      const values = buildSpell(doc);
      return { name: values.name, values };
    },
  },
  "magic-item": {
    table: magicItems,
    nameColumn: magicItems.name,
    campaignColumn: magicItems.campaignId,
    duplicateMessage: "A magic item with this name already exists",
    build: (doc) => {
      const values = buildMagicItem(doc);
      return { name: values.name, values };
    },
  },
  location: {
    table: locations,
    nameColumn: locations.name,
    campaignColumn: locations.campaignId,
    duplicateMessage: "A location with this name already exists",
    build: (doc) => {
      const values = buildLocation(doc);
      return { name: values.name, values };
    },
  },
  quest: {
    table: quests,
    nameColumn: quests.title,
    campaignColumn: quests.campaignId,
    duplicateMessage: "A quest with this title already exists",
    build: (doc) => {
      const values = buildQuest(doc);
      return { name: values.title, values };
    },
  },
  faction: {
    table: factions,
    nameColumn: factions.name,
    campaignColumn: factions.campaignId,
    duplicateMessage: "A faction with this name already exists",
    build: (doc) => {
      const values = buildFaction(doc);
      return { name: values.name, values };
    },
  },
};

/**
 * One-way import of markdown notes (an Obsidian vault, typically) into a
 * campaign. The client sends raw file contents plus the target type it wants
 * for each one; parsing happens here so the server stays the authority on what
 * gets written. Each file succeeds or fails on its own — one malformed note
 * never aborts the batch.
 */
export const POST = apiRoute(async (req) => {
  const body = parseBody(markdownImportSchema, await readJson(req));

  const [campaign] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(eq(campaigns.id, body.campaignId));
  if (!campaign) throw new ApiError("Campaign not found", 404);
  const campaignId = campaign.id;

  // Spells hang off a character or NPC rather than the campaign, so importing
  // any spell note requires an owner up front.
  let spellOwner: { ownerId: number; ownerType: "character" | "npc" } | null = null;
  if (body.spellOwnerId && body.spellOwnerType) {
    const table = body.spellOwnerType === "character" ? characters : npcs;
    const [owner] = await db
      .select({ id: table.id })
      .from(table)
      .where(and(eq(table.id, body.spellOwnerId), eq(table.campaignId, campaignId)));
    if (!owner) throw new ApiError("Spell owner not found in this campaign", 404);
    spellOwner = { ownerId: owner.id, ownerType: body.spellOwnerType };
  }

  /* Existing names per target, loaded once and updated as rows are inserted so
     a batch cannot duplicate itself either. */
  const nameCache = new Map<string, Set<string>>();

  async function isDuplicate(
    cacheKey: string,
    handler: TargetHandler,
    scope: SQL | undefined,
    name: string,
  ): Promise<boolean> {
    let known = nameCache.get(cacheKey);
    if (!known) {
      const rows = await db
        .select({ name: handler.nameColumn })
        .from(handler.table)
        .where(scope);
      known = new Set(rows.map((r) => String(r.name).trim().toLowerCase()));
      nameCache.set(cacheKey, known);
    }
    const key = name.trim().toLowerCase();
    if (known.has(key)) return true;
    known.add(key);
    return false;
  }

  const results: MarkdownImportResult[] = [];

  for (const file of body.files) {
    if (file.target === "skip") continue;

    const handler = HANDLERS[file.target];
    const doc = parseMarkdownDoc(file.path, file.content);
    const record: MarkdownImportResult = {
      path: file.path,
      name: doc.title,
      target: file.target,
      status: "failed",
    };

    try {
      const { name, values } = handler.build(doc);
      record.name = name;

      let scope: SQL | undefined;
      let cacheKey: string;
      let scoping: Record<string, unknown>;

      if (handler.campaignColumn === undefined) {
        if (!spellOwner) {
          record.message = "Choose a character or NPC to own imported spells";
          results.push(record);
          continue;
        }
        scope = and(
          eq(spells.ownerId, spellOwner.ownerId),
          eq(spells.ownerType, spellOwner.ownerType),
        );
        cacheKey = `spell:${spellOwner.ownerType}:${spellOwner.ownerId}`;
        scoping = { ...spellOwner };
      } else {
        scope = eq(handler.campaignColumn, campaignId);
        // NPCs and monsters share a table, so they share a duplicate namespace.
        cacheKey = handler.table === npcs ? "npc" : file.target;
        scoping = { campaignId };
      }

      if (body.skipDuplicates && (await isDuplicate(cacheKey, handler, scope, name))) {
        record.status = "skipped";
        record.message = handler.duplicateMessage;
        results.push(record);
        continue;
      }

      const [row] = await db
        .insert(handler.table)
        .values({ ...values, ...scoping } as never)
        .returning();
      record.status = "created";
      record.id = (row as { id: number }).id;
    } catch (err) {
      record.status = "failed";
      record.message = err instanceof Error ? err.message : "Import failed";
      console.error(`[import] ${file.path} failed:`, err);
    }

    results.push(record);
  }

  return json({
    results,
    summary: {
      created: results.filter((r) => r.status === "created").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      failed: results.filter((r) => r.status === "failed").length,
    },
  });
});
