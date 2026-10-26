import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { combatParticipants, encounters } from "@/db/schema";
import { ApiError, apiRoute, json, parseBody, readJson, requireId } from "@/lib/api";

const cloneSchema = z.object({
  /** True saves a reusable copy; false starts a live fight from this one. */
  template: z.boolean(),
  name: z.string().trim().min(1).max(120).optional(),
});

/**
 * Copy an encounter and its combatants — either into the saved-encounter
 * library ("save for reuse") or out of it into a fresh live fight ("start
 * from saved"). The copy starts clean: full HP, no conditions, no initiative,
 * round one. Who's in the fight, their stats and their groups carry over.
 */
export const POST = apiRoute<{ id: string }>(async (req, { params }) => {
  const id = requireId((await params).id);
  const { template, name } = parseBody(cloneSchema, await readJson(req));

  const [source] = await db.select().from(encounters).where(eq(encounters.id, id));
  if (!source) throw new ApiError("Encounter not found", 404);
  const parts = await db
    .select()
    .from(combatParticipants)
    .where(eq(combatParticipants.encounterId, id))
    .orderBy(asc(combatParticipants.turnOrder));

  const created = db.transaction((tx) => {
    const [encounter] = tx
      .insert(encounters)
      .values({
        campaignId: source.campaignId,
        name: name ?? source.name,
        isTemplate: template,
        // A saved encounter is never "the fight in progress".
        status: template ? "completed" : "active",
      })
      .returning()
      .all();

    // Each copy gets its own group ids, so two fights from one template never
    // share a minion group.
    const groupIds = new Map<string, string>();
    parts.forEach((p, i) => {
      let groupId: string | null = null;
      if (p.groupId) {
        groupId = groupIds.get(p.groupId) ?? randomUUID();
        groupIds.set(p.groupId, groupId);
      }
      tx.insert(combatParticipants)
        .values({
          encounterId: encounter.id,
          entityId: p.entityId,
          entityType: p.entityType,
          name: p.name,
          initiativeRoll: null,
          initiativeTotal: 0,
          initiativeMod: p.initiativeMod,
          hpCurrent: p.hpMax,
          hpMax: p.hpMax,
          hpTemp: 0,
          armorClass: p.armorClass,
          conditions: [],
          exhaustionLevel: 0,
          turnOrder: i,
          legendaryActionsMax: p.legendaryActionsMax,
          hasLairAction: p.hasLairAction,
          groupId,
          groupLabel: groupId ? p.groupLabel : null,
        })
        .run();
    });
    return encounter;
  });

  return json(created, 201);
});
