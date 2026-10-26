import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { combatParticipants, npcs } from "@/db/schema";
import { apiRoute, json, parseBody, readJson } from "@/lib/api";
import { legendaryDefaults } from "@/lib/combat-turns";
import { participantCreateSchema } from "@/lib/validators";

export const GET = apiRoute(async (req) => {
  const encounterId = new URL(req.url).searchParams.get("encounterId");
  let q = db.select().from(combatParticipants).$dynamic();
  if (encounterId)
    q = q.where(eq(combatParticipants.encounterId, Number(encounterId)));
  return json(await q.orderBy(asc(combatParticipants.turnOrder)));
});

type ParticipantInput = ReturnType<typeof participantCreateSchema.parse>;

/**
 * A monster joining a fight brings its legendary actions and lair with it, so
 * the DM doesn't have to set up the dragon by hand. Every page that adds
 * combatants posts here, which is why this lives in the route rather than in
 * each caller. Values the caller sent explicitly are left alone.
 */
async function withStatBlockDefaults(
  rows: ParticipantInput[],
  raws: unknown[],
): Promise<ParticipantInput[]> {
  const npcIds = [
    ...new Set(
      rows
        .filter((r) => r.entityType === "npc" && typeof r.entityId === "number")
        .map((r) => r.entityId as number),
    ),
  ];
  if (npcIds.length === 0) return rows;
  const blocks = await db
    .select({
      id: npcs.id,
      legendaryActions: npcs.legendaryActions,
      lairActions: npcs.lairActions,
    })
    .from(npcs)
    .where(inArray(npcs.id, npcIds));
  const byId = new Map(blocks.map((b) => [b.id, legendaryDefaults(b)]));

  return rows.map((row, i) => {
    const defaults = row.entityType === "npc" ? byId.get(row.entityId as number) : undefined;
    if (!defaults) return row;
    const sent = (raws[i] ?? {}) as Record<string, unknown>;
    return {
      ...row,
      legendaryActionsMax:
        "legendaryActionsMax" in sent ? row.legendaryActionsMax : defaults.legendaryActionsMax,
      hasLairAction: "hasLairAction" in sent ? row.hasLairAction : defaults.hasLairAction,
    };
  });
}

export const POST = apiRoute(async (req) => {
  const body = await readJson(req);

  // Accept an array to add a whole encounter's combatants in one request
  // (and one transaction) instead of a POST per participant.
  if (Array.isArray(body)) {
    const parsed = body.map((b) => parseBody(participantCreateSchema, b));
    if (parsed.length === 0) return json([], 201);
    const rows = await withStatBlockDefaults(parsed, body);
    const created = db.transaction((tx) =>
      rows.map((r) => tx.insert(combatParticipants).values(r).returning().all()[0]),
    );
    return json(created, 201);
  }

  const [data] = await withStatBlockDefaults(
    [parseBody(participantCreateSchema, body)],
    [body],
  );
  const [row] = await db.insert(combatParticipants).values(data).returning();
  return json(row, 201);
});
