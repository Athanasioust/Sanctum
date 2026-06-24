import "server-only";
import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  characters,
  spells,
  spellSlots,
  inventoryItems,
  npcs,
  encounters,
  combatParticipants,
  locations,
  storyEvents,
  factions,
  calendarEvents,
  shops,
  shopItems,
  rollTables,
  sessionPreps,
  notes,
} from "@/db/schema";
import { ApiError } from "@/lib/api";
import {
  campaignCreateSchema,
  characterCreateSchema,
  npcCreateSchema,
  locationCreateSchema,
  spellCreateSchema,
  spellSlotCreateSchema,
  inventoryItemCreateSchema,
  participantCreateSchema,
  encounterCreateSchema,
  storyEventCreateSchema,
  factionCreateSchema,
  calendarEventCreateSchema,
  shopCreateSchema,
  shopItemCreateSchema,
  rollTableCreateSchema,
  sessionPrepCreateSchema,
  noteCreateSchema,
} from "@/lib/validators";

export const EXPORT_VERSION = 1;

/** Drop identity/timestamp columns so re-inserts regenerate them. */
function strip<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const rest = { ...row };
  delete rest.id;
  delete rest.createdAt;
  delete rest.updatedAt;
  delete rest.completedAt;
  return rest;
}

/* -------------------------------------------------------------------------- */
/*  Export                                                                     */
/* -------------------------------------------------------------------------- */

export async function exportCampaign(campaignId: number) {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
  if (!campaign) throw new ApiError("Campaign not found", 404);

  const [
    characterRows,
    npcRows,
    locationRows,
    storyRows,
    factionRows,
    calendarRows,
    shopRows,
    rollTableRows,
    sessionRows,
    noteRows,
    encounterRows,
  ] = await Promise.all([
    db.select().from(characters).where(eq(characters.campaignId, campaignId)),
    db.select().from(npcs).where(eq(npcs.campaignId, campaignId)),
    db.select().from(locations).where(eq(locations.campaignId, campaignId)),
    db.select().from(storyEvents).where(eq(storyEvents.campaignId, campaignId)),
    db.select().from(factions).where(eq(factions.campaignId, campaignId)),
    db.select().from(calendarEvents).where(eq(calendarEvents.campaignId, campaignId)),
    db.select().from(shops).where(eq(shops.campaignId, campaignId)),
    db.select().from(rollTables).where(eq(rollTables.campaignId, campaignId)),
    db.select().from(sessionPreps).where(eq(sessionPreps.campaignId, campaignId)),
    db.select().from(notes).where(eq(notes.campaignId, campaignId)),
    db.select().from(encounters).where(eq(encounters.campaignId, campaignId)),
  ]);

  const charIds = characterRows.map((c) => c.id);
  const npcIds = npcRows.map((n) => n.id);
  const ownerIds = [...charIds, ...npcIds];
  const charSet = new Set(charIds);
  const npcSet = new Set(npcIds);
  const shopIds = shopRows.map((s) => s.id);
  const encounterIds = encounterRows.map((e) => e.id);

  const [spellRows, slotRows, inventoryRows, shopItemRows, participantRows] = await Promise.all([
    ownerIds.length ? db.select().from(spells).where(inArray(spells.ownerId, ownerIds)) : [],
    ownerIds.length ? db.select().from(spellSlots).where(inArray(spellSlots.ownerId, ownerIds)) : [],
    ownerIds.length ? db.select().from(inventoryItems).where(inArray(inventoryItems.ownerId, ownerIds)) : [],
    shopIds.length ? db.select().from(shopItems).where(inArray(shopItems.shopId, shopIds)) : [],
    encounterIds.length ? db.select().from(combatParticipants).where(inArray(combatParticipants.encounterId, encounterIds)) : [],
  ]);

  const ownerMatch = <T extends { ownerId: number; ownerType: string }>(rows: T[]) =>
    rows.filter((r) => (r.ownerType === "character" ? charSet.has(r.ownerId) : npcSet.has(r.ownerId)));

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    campaign,
    characters: characterRows,
    npcs: npcRows,
    spells: ownerMatch(spellRows),
    spellSlots: ownerMatch(slotRows),
    inventoryItems: ownerMatch(inventoryRows),
    encounters: encounterRows,
    combatParticipants: participantRows,
    locations: locationRows,
    storyEvents: storyRows,
    factions: factionRows,
    calendarEvents: calendarRows,
    shops: shopRows,
    shopItems: shopItemRows,
    rollTables: rollTableRows,
    sessionPreps: sessionRows,
    notes: noteRows,
  };
}

export type CampaignBundle = Awaited<ReturnType<typeof exportCampaign>>;

/* -------------------------------------------------------------------------- */
/*  Import                                                                     */
/* -------------------------------------------------------------------------- */

type AnyRow = Record<string, unknown>;

function mapIds(ids: unknown, map: Map<number, number>): number[] {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((i) => map.get(Number(i)))
    .filter((x): x is number => typeof x === "number");
}

/**
 * Per-entity import schemas, derived from the create schemas with the columns
 * that the importer re-derives (foreign keys, id-array links) omitted. Every
 * imported row is validated against one of these before it is inserted: unknown
 * fields are stripped, enums/lengths/numeric ranges are enforced, and anything
 * that fails validation is skipped rather than written. This guarantees a
 * malicious or corrupt export file can never inject unexpected data.
 */
const ImportSchemas = {
  campaign: campaignCreateSchema,
  character: characterCreateSchema.omit({ campaignId: true }),
  npc: npcCreateSchema.omit({ campaignId: true }),
  location: locationCreateSchema.omit({ campaignId: true, parentLocationId: true }),
  spell: spellCreateSchema.omit({ ownerId: true }),
  spellSlot: spellSlotCreateSchema.omit({ ownerId: true }),
  inventory: inventoryItemCreateSchema.omit({ ownerId: true }),
  encounter: encounterCreateSchema.omit({ campaignId: true }).extend({
    roundNumber: z.number().int().min(1).max(100000).optional().default(1),
    currentTurnIndex: z.number().int().min(0).max(100000).optional().default(0),
  }),
  participant: participantCreateSchema.omit({ encounterId: true, entityId: true }),
  story: storyEventCreateSchema.omit({
    campaignId: true,
    linkedNpcIds: true,
    linkedLocationIds: true,
  }),
  faction: factionCreateSchema.omit({ campaignId: true, keyNpcIds: true }),
  calendar: calendarEventCreateSchema.omit({ campaignId: true }),
  shop: shopCreateSchema.omit({ campaignId: true, locationId: true, ownerNpcId: true }),
  shopItem: shopItemCreateSchema.omit({ shopId: true }),
  rollTable: rollTableCreateSchema.omit({ campaignId: true }),
  session: sessionPrepCreateSchema.omit({
    campaignId: true,
    plannedEncounters: true,
    plannedNpcs: true,
  }),
  note: noteCreateSchema.omit({ campaignId: true }),
};

/** Validate a bundle array, returning {raw, data} pairs for rows that pass. */
function validateRows<S extends z.ZodTypeAny>(
  schema: S,
  rows: unknown,
): { raw: AnyRow; data: z.infer<S> }[] {
  if (!Array.isArray(rows)) return [];
  const out: { raw: AnyRow; data: z.infer<S> }[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const raw = r as AnyRow;
    const parsed = schema.safeParse(strip(raw));
    if (parsed.success) out.push({ raw, data: parsed.data });
  }
  return out;
}

const rowId = (raw: AnyRow): number | null => {
  const n = Number(raw.id);
  return Number.isInteger(n) ? n : null;
};

/**
 * Create a fresh campaign from an exported bundle. The bundle is fully
 * validated, foreign keys are remapped to the new ids, and the whole thing runs
 * inside a single transaction so a failure rolls everything back (no orphaned
 * half-imported campaign is ever left behind).
 */
export async function importCampaign(raw: unknown): Promise<number> {
  if (!raw || typeof raw !== "object") throw new ApiError("Invalid import file", 422);
  const bundle = raw as Record<string, unknown>;

  const campParsed = ImportSchemas.campaign.safeParse(bundle.campaign);
  if (!campParsed.success) {
    throw new ApiError("Import file is missing or has invalid campaign data", 422);
  }

  return db.transaction((tx) => {
    const newCampaign = tx.insert(campaigns).values(campParsed.data).returning().all()[0];
    const campaignId = newCampaign.id;

    const charMap = new Map<number, number>();
    const npcMap = new Map<number, number>();
    const locMap = new Map<number, number>();
    const encMap = new Map<number, number>();
    const shopMap = new Map<number, number>();

    // Characters & NPCs
    for (const { raw: r, data } of validateRows(ImportSchemas.character, bundle.characters)) {
      const id = rowId(r);
      const created = tx.insert(characters).values({ ...data, campaignId } as never).returning().all()[0] as { id: number };
      if (id !== null) charMap.set(id, created.id);
    }
    for (const { raw: r, data } of validateRows(ImportSchemas.npc, bundle.npcs)) {
      const id = rowId(r);
      const created = tx.insert(npcs).values({ ...data, campaignId } as never).returning().all()[0] as { id: number };
      if (id !== null) npcMap.set(id, created.id);
    }

    // Locations (two passes for self-referencing parent)
    const locRows = validateRows(ImportSchemas.location, bundle.locations);
    for (const { raw: r, data } of locRows) {
      const id = rowId(r);
      const created = tx.insert(locations).values({ ...data, campaignId, parentLocationId: null } as never).returning().all()[0] as { id: number };
      if (id !== null) locMap.set(id, created.id);
    }
    for (const { raw: r } of locRows) {
      const id = rowId(r);
      const parent = Number(r.parentLocationId);
      if (id !== null && locMap.has(parent)) {
        tx.update(locations)
          .set({ parentLocationId: locMap.get(parent)! })
          .where(eq(locations.id, locMap.get(id)!))
          .run();
      }
    }

    // Owner-scoped: spells, slots, inventory
    const remapOwner = (r: AnyRow) =>
      (r.ownerType === "npc" ? npcMap : charMap).get(Number(r.ownerId));
    for (const { raw: r, data } of validateRows(ImportSchemas.spell, bundle.spells)) {
      const ownerId = remapOwner(r);
      if (ownerId) tx.insert(spells).values({ ...data, ownerId } as never).run();
    }
    for (const { raw: r, data } of validateRows(ImportSchemas.spellSlot, bundle.spellSlots)) {
      const ownerId = remapOwner(r);
      if (ownerId) tx.insert(spellSlots).values({ ...data, ownerId } as never).run();
    }
    for (const { raw: r, data } of validateRows(ImportSchemas.inventory, bundle.inventoryItems)) {
      const ownerId = remapOwner(r);
      if (ownerId) tx.insert(inventoryItems).values({ ...data, ownerId } as never).run();
    }

    // Encounters & participants
    for (const { raw: r, data } of validateRows(ImportSchemas.encounter, bundle.encounters)) {
      const id = rowId(r);
      const created = tx.insert(encounters).values({ ...data, campaignId } as never).returning().all()[0] as { id: number };
      if (id !== null) encMap.set(id, created.id);
    }
    for (const { raw: r, data } of validateRows(ImportSchemas.participant, bundle.combatParticipants)) {
      const encounterId = encMap.get(Number(r.encounterId));
      if (!encounterId) continue;
      const entityId =
        data.entityType === "npc"
          ? npcMap.get(Number(r.entityId)) ?? null
          : data.entityType === "character"
            ? charMap.get(Number(r.entityId)) ?? null
            : null;
      tx.insert(combatParticipants).values({ ...data, encounterId, entityId } as never).run();
    }

    // Shops & items
    for (const { raw: r, data } of validateRows(ImportSchemas.shop, bundle.shops)) {
      const id = rowId(r);
      const created = tx
        .insert(shops)
        .values({
          ...data,
          campaignId,
          locationId: locMap.get(Number(r.locationId)) ?? null,
          ownerNpcId: npcMap.get(Number(r.ownerNpcId)) ?? null,
        } as never)
        .returning()
        .all()[0] as { id: number };
      if (id !== null) shopMap.set(id, created.id);
    }
    for (const { raw: r, data } of validateRows(ImportSchemas.shopItem, bundle.shopItems)) {
      const shopId = shopMap.get(Number(r.shopId));
      if (shopId) tx.insert(shopItems).values({ ...data, shopId } as never).run();
    }

    // Story, factions, calendar, roll tables, sessions, notes
    for (const { raw: r, data } of validateRows(ImportSchemas.story, bundle.storyEvents)) {
      tx.insert(storyEvents).values({
        ...data,
        campaignId,
        linkedNpcIds: mapIds(r.linkedNpcIds, npcMap),
        linkedLocationIds: mapIds(r.linkedLocationIds, locMap),
      } as never).run();
    }
    for (const { raw: r, data } of validateRows(ImportSchemas.faction, bundle.factions)) {
      tx.insert(factions).values({
        ...data,
        campaignId,
        keyNpcIds: mapIds(r.keyNpcIds, npcMap),
      } as never).run();
    }
    for (const { data } of validateRows(ImportSchemas.calendar, bundle.calendarEvents)) {
      tx.insert(calendarEvents).values({ ...data, campaignId } as never).run();
    }
    for (const { data } of validateRows(ImportSchemas.rollTable, bundle.rollTables)) {
      tx.insert(rollTables).values({ ...data, campaignId } as never).run();
    }
    for (const { raw: r, data } of validateRows(ImportSchemas.session, bundle.sessionPreps)) {
      tx.insert(sessionPreps).values({
        ...data,
        campaignId,
        plannedEncounters: mapIds(r.plannedEncounters, encMap),
        plannedNpcs: mapIds(r.plannedNpcs, npcMap),
      } as never).run();
    }
    for (const { data } of validateRows(ImportSchemas.note, bundle.notes)) {
      tx.insert(notes).values({ ...data, campaignId } as never).run();
    }

    return campaignId;
  });
}
