import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import {
  characterResources,
  characters,
  inventoryItems,
  magicItems,
  notes,
  npcRelationships,
  npcs,
  quests,
  rumors,
  shops,
  spellSlots,
  spells,
} from "@/db/schema";
import { ApiError } from "@/lib/api";

/**
 * Bulk delete with undo.
 *
 * A delete snapshots everything it is about to remove — the rows, the child
 * rows that go with them (a character's spells, inventory and abilities; an
 * NPC's relationships) and the links elsewhere that the delete will null out
 * (a magic item's owner, a shop's keeper) — then deletes in one transaction.
 * Undo puts it all back with the original ids, so anything else that pointed
 * at those rows (a combatant's stat block, a map pin) lines up again.
 *
 * Snapshots live in memory for a few minutes: undo is for "oops", not an
 * archive. Nothing is kept across a restart.
 */

export const BULK_ENTITIES = ["characters", "npcs", "magicItems", "quests", "rumors", "notes"] as const;
export type BulkEntity = (typeof BULK_ENTITIES)[number];

type Child = { table: SQLiteTable; column: SQLiteColumn; idColumn: SQLiteColumn };
type Nulled = { table: SQLiteTable; column: SQLiteColumn; idColumn: SQLiteColumn; key: string };

type EntityConfig = {
  table: SQLiteTable;
  idColumn: SQLiteColumn;
  campaignColumn: SQLiteColumn;
  /** Polymorphic owner type for spells / slots / inventory, if any. */
  ownerType?: "character" | "npc";
  /** Rows removed with the entity by a foreign-key cascade. */
  children: Child[];
  /** Columns elsewhere set to null by the delete, restored on undo. */
  nulled: Nulled[];
};

const CONFIG: Record<BulkEntity, EntityConfig> = {
  characters: {
    table: characters,
    idColumn: characters.id,
    campaignColumn: characters.campaignId,
    ownerType: "character",
    children: [{ table: characterResources, column: characterResources.characterId, idColumn: characterResources.id }],
    nulled: [{ table: magicItems, column: magicItems.characterId, idColumn: magicItems.id, key: "characterId" }],
  },
  npcs: {
    table: npcs,
    idColumn: npcs.id,
    campaignColumn: npcs.campaignId,
    ownerType: "npc",
    children: [
      { table: npcRelationships, column: npcRelationships.sourceNpcId, idColumn: npcRelationships.id },
      { table: npcRelationships, column: npcRelationships.targetNpcId, idColumn: npcRelationships.id },
    ],
    nulled: [
      { table: shops, column: shops.ownerNpcId, idColumn: shops.id, key: "ownerNpcId" },
      { table: rumors, column: rumors.sourceNpcId, idColumn: rumors.id, key: "sourceNpcId" },
    ],
  },
  magicItems: { table: magicItems, idColumn: magicItems.id, campaignColumn: magicItems.campaignId, children: [], nulled: [] },
  quests: { table: quests, idColumn: quests.id, campaignColumn: quests.campaignId, children: [], nulled: [] },
  rumors: { table: rumors, idColumn: rumors.id, campaignColumn: rumors.campaignId, children: [], nulled: [] },
  notes: { table: notes, idColumn: notes.id, campaignColumn: notes.campaignId, children: [], nulled: [] },
};

type Row = Record<string, unknown> & { id: number };

type Snapshot = {
  entity: BulkEntity;
  campaignId: number;
  rows: Row[];
  /** Child rows by table, in the order they must be re-inserted. */
  children: { table: SQLiteTable; rows: Row[] }[];
  /** Links to put back: which table/column, and row id → original value. */
  nulled: {
    table: SQLiteTable;
    column: SQLiteColumn;
    key: string;
    idColumn: SQLiteColumn;
    values: [number, number][];
  }[];
  expires: number;
};

const UNDO_MS = 10 * 60 * 1000;
const snapshots = new Map<string, Snapshot>();

function prune() {
  const now = Date.now();
  for (const [token, snap] of snapshots) if (snap.expires < now) snapshots.delete(token);
}

/** Delete `ids` of `entity` within one campaign; returns an undo token. */
export function bulkDelete(entity: BulkEntity, campaignId: number, ids: number[]) {
  prune();
  const cfg = CONFIG[entity];
  return db.transaction((tx) => {
    const rows = tx
      .select()
      .from(cfg.table)
      .where(and(inArray(cfg.idColumn, ids), eq(cfg.campaignColumn, campaignId)))
      .all() as Row[];
    if (rows.length === 0) throw new ApiError("Nothing to delete", 404);
    const found = rows.map((r) => r.id);

    const children: Snapshot["children"] = [];
    if (cfg.ownerType) {
      for (const table of [spells, spellSlots, inventoryItems]) {
        const owned = tx
          .select()
          .from(table)
          .where(and(inArray(table.ownerId, found), eq(table.ownerType, cfg.ownerType)))
          .all() as Row[];
        if (owned.length) children.push({ table, rows: owned });
      }
    }
    // Relationship rows can match on both ends; collect each once.
    const seen = new Map<SQLiteTable, Set<number>>();
    for (const child of cfg.children) {
      const rowsForChild = (tx.select().from(child.table).where(inArray(child.column, found)).all() as Row[])
        .filter((r) => {
          const set = seen.get(child.table) ?? new Set<number>();
          seen.set(child.table, set);
          if (set.has(r.id)) return false;
          set.add(r.id);
          return true;
        });
      if (rowsForChild.length) children.push({ table: child.table, rows: rowsForChild });
    }

    const nulled: Snapshot["nulled"] = [];
    for (const link of cfg.nulled) {
      const linked = tx.select().from(link.table).where(inArray(link.column, found)).all() as Row[];
      if (linked.length) {
        nulled.push({
          table: link.table,
          column: link.column,
          key: link.key,
          idColumn: link.idColumn,
          values: linked.map((r) => [r.id, r[link.key] as number]),
        });
      }
    }

    // Polymorphic children have no foreign key, so they go by hand; the rest
    // cascade or are nulled by the database.
    if (cfg.ownerType) {
      for (const table of [spells, spellSlots, inventoryItems]) {
        tx.delete(table)
          .where(and(inArray(table.ownerId, found), eq(table.ownerType, cfg.ownerType)))
          .run();
      }
    }
    tx.delete(cfg.table).where(inArray(cfg.idColumn, found)).run();

    const token = randomUUID();
    snapshots.set(token, {
      entity,
      campaignId,
      rows,
      children,
      nulled,
      expires: Date.now() + UNDO_MS,
    });
    return { token, deleted: found };
  });
}

/** Put a bulk delete back exactly as it was. Returns the restored rows. */
export function bulkRestore(token: string) {
  prune();
  const snap = snapshots.get(token);
  if (!snap) throw new ApiError("That undo has expired", 410);
  const cfg = CONFIG[snap.entity];
  const restored = db.transaction((tx) => {
    for (const row of snap.rows) tx.insert(cfg.table).values(row as never).run();
    for (const group of snap.children) {
      for (const row of group.rows) tx.insert(group.table).values(row as never).run();
    }
    // Re-link only what is still unlinked: if the DM gave the item to
    // someone else in the meantime, that choice stands.
    for (const link of snap.nulled) {
      for (const [id, value] of link.values) {
        tx.update(link.table)
          .set({ [link.key]: value } as never)
          .where(and(eq(link.idColumn, id), isNull(link.column)))
          .run();
      }
    }
    return snap.rows;
  });
  snapshots.delete(token);
  return restored;
}
