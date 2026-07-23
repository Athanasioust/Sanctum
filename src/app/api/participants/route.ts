import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { combatParticipants } from "@/db/schema";
import { apiRoute, json, parseBody, readJson } from "@/lib/api";
import { participantCreateSchema } from "@/lib/validators";

export const GET = apiRoute(async (req) => {
  const encounterId = new URL(req.url).searchParams.get("encounterId");
  let q = db.select().from(combatParticipants).$dynamic();
  if (encounterId)
    q = q.where(eq(combatParticipants.encounterId, Number(encounterId)));
  return json(await q.orderBy(asc(combatParticipants.turnOrder)));
});

export const POST = apiRoute(async (req) => {
  const body = await readJson(req);

  // Accept an array to add a whole encounter's combatants in one request
  // (and one transaction) instead of a POST per participant.
  if (Array.isArray(body)) {
    const rows = body.map((b) => parseBody(participantCreateSchema, b));
    if (rows.length === 0) return json([], 201);
    const created = db.transaction((tx) =>
      rows.map((r) => tx.insert(combatParticipants).values(r).returning().all()[0]),
    );
    return json(created, 201);
  }

  const data = parseBody(participantCreateSchema, body);
  const [row] = await db.insert(combatParticipants).values(data).returning();
  return json(row, 201);
});
