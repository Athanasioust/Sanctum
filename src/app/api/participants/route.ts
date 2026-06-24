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
  const data = parseBody(participantCreateSchema, await readJson(req));
  const [row] = await db.insert(combatParticipants).values(data).returning();
  return json(row, 201);
});
