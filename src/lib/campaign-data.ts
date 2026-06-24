import "server-only";
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

type AnyRow = Record<string, unknown> & { id: number };

function mapIds(ids: unknown, map: Map<number, number>): number[] {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((i) => map.get(Number(i)))
    .filter((x): x is number => typeof x === "number");
}

export async function importCampaign(raw: unknown): Promise<number> {
  if (!raw || typeof raw !== "object") throw new ApiError("Invalid import file", 422);
  const bundle = raw as Partial<CampaignBundle>;
  const camp = bundle.campaign as Record<string, unknown> | undefined;
  if (!camp || typeof camp.name !== "string" || !camp.name.trim()) {
    throw new ApiError("Import file is missing campaign data", 422);
  }

  // Campaign
  const [newCampaign] = await db
    .insert(campaigns)
    .values({
      name: String(camp.name),
      description: String(camp.description ?? ""),
      setting: String(camp.setting ?? ""),
      inWorldCalendarType: (camp.inWorldCalendarType === "custom" ? "custom" : "real"),
      customCalendarConfig: (camp.customCalendarConfig as never) ?? null,
      currentInWorldDate: (camp.currentInWorldDate as string | null) ?? null,
    })
    .returning();
  const campaignId = newCampaign.id;

  const charMap = new Map<number, number>();
  const npcMap = new Map<number, number>();
  const locMap = new Map<number, number>();
  const encMap = new Map<number, number>();
  const shopMap = new Map<number, number>();

  // Characters & NPCs
  for (const row of (bundle.characters ?? []) as AnyRow[]) {
    const [created] = await db.insert(characters).values({ ...strip(row), campaignId } as never).returning();
    charMap.set(row.id, created.id);
  }
  for (const row of (bundle.npcs ?? []) as AnyRow[]) {
    const [created] = await db.insert(npcs).values({ ...strip(row), campaignId } as never).returning();
    npcMap.set(row.id, created.id);
  }

  // Locations (two passes for self-referencing parent)
  for (const row of (bundle.locations ?? []) as AnyRow[]) {
    const [created] = await db
      .insert(locations)
      .values({ ...strip(row), campaignId, parentLocationId: null } as never)
      .returning();
    locMap.set(row.id, created.id);
  }
  for (const row of (bundle.locations ?? []) as AnyRow[]) {
    const parent = row.parentLocationId as number | null;
    if (parent && locMap.has(parent)) {
      await db
        .update(locations)
        .set({ parentLocationId: locMap.get(parent) })
        .where(eq(locations.id, locMap.get(row.id)!));
    }
  }

  // Owner-scoped: spells, slots, inventory
  const remapOwner = (row: AnyRow) => {
    const type = row.ownerType === "npc" ? npcMap : charMap;
    return type.get(Number(row.ownerId));
  };
  for (const row of (bundle.spells ?? []) as AnyRow[]) {
    const ownerId = remapOwner(row);
    if (ownerId) await db.insert(spells).values({ ...strip(row), ownerId } as never);
  }
  for (const row of (bundle.spellSlots ?? []) as AnyRow[]) {
    const ownerId = remapOwner(row);
    if (ownerId) await db.insert(spellSlots).values({ ...strip(row), ownerId } as never);
  }
  for (const row of (bundle.inventoryItems ?? []) as AnyRow[]) {
    const ownerId = remapOwner(row);
    if (ownerId) await db.insert(inventoryItems).values({ ...strip(row), ownerId } as never);
  }

  // Encounters & participants
  for (const row of (bundle.encounters ?? []) as AnyRow[]) {
    const [created] = await db.insert(encounters).values({ ...strip(row), campaignId } as never).returning();
    encMap.set(row.id, created.id);
  }
  for (const row of (bundle.combatParticipants ?? []) as AnyRow[]) {
    const encounterId = encMap.get(Number(row.encounterId));
    if (!encounterId) continue;
    const entityType = row.entityType as string | null;
    const entityId = entityType
      ? (entityType === "npc" ? npcMap : charMap).get(Number(row.entityId)) ?? null
      : null;
    await db.insert(combatParticipants).values({ ...strip(row), encounterId, entityId } as never);
  }

  // Shops & items
  for (const row of (bundle.shops ?? []) as AnyRow[]) {
    const [created] = await db
      .insert(shops)
      .values({
        ...strip(row),
        campaignId,
        locationId: locMap.get(Number(row.locationId)) ?? null,
        ownerNpcId: npcMap.get(Number(row.ownerNpcId)) ?? null,
      } as never)
      .returning();
    shopMap.set(row.id, created.id);
  }
  for (const row of (bundle.shopItems ?? []) as AnyRow[]) {
    const shopId = shopMap.get(Number(row.shopId));
    if (shopId) await db.insert(shopItems).values({ ...strip(row), shopId } as never);
  }

  // Story, factions, calendar, roll tables, sessions, notes
  for (const row of (bundle.storyEvents ?? []) as AnyRow[]) {
    await db.insert(storyEvents).values({
      ...strip(row),
      campaignId,
      linkedNpcIds: mapIds(row.linkedNpcIds, npcMap),
      linkedLocationIds: mapIds(row.linkedLocationIds, locMap),
    } as never);
  }
  for (const row of (bundle.factions ?? []) as AnyRow[]) {
    await db.insert(factions).values({
      ...strip(row),
      campaignId,
      keyNpcIds: mapIds(row.keyNpcIds, npcMap),
    } as never);
  }
  for (const row of (bundle.calendarEvents ?? []) as AnyRow[]) {
    await db.insert(calendarEvents).values({ ...strip(row), campaignId } as never);
  }
  for (const row of (bundle.rollTables ?? []) as AnyRow[]) {
    await db.insert(rollTables).values({ ...strip(row), campaignId } as never);
  }
  for (const row of (bundle.sessionPreps ?? []) as AnyRow[]) {
    await db.insert(sessionPreps).values({
      ...strip(row),
      campaignId,
      plannedEncounters: mapIds(row.plannedEncounters, npcMap),
      plannedNpcs: mapIds(row.plannedNpcs, npcMap),
    } as never);
  }
  for (const row of (bundle.notes ?? []) as AnyRow[]) {
    await db.insert(notes).values({ ...strip(row), campaignId } as never);
  }

  return campaignId;
}
