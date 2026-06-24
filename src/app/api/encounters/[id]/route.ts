import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { combatParticipants, encounters } from "@/db/schema";
import {
  ApiError,
  apiRoute,
  json,
  parseBody,
  readJson,
  requireId,
} from "@/lib/api";
import { encounterUpdateSchema } from "@/lib/validators";

type Params = { id: string };

export const GET = apiRoute<Params>(async (_req, { params }) => {
  const id = requireId((await params).id);
  const [encounter] = await db
    .select()
    .from(encounters)
    .where(eq(encounters.id, id));
  if (!encounter) throw new ApiError("Encounter not found", 404);

  const participants = await db
    .select()
    .from(combatParticipants)
    .where(eq(combatParticipants.encounterId, id))
    .orderBy(
      asc(combatParticipants.turnOrder),
      desc(combatParticipants.initiativeTotal),
    );

  return json({ ...encounter, participants });
});

export const PATCH = apiRoute<Params>(async (req, { params }) => {
  const id = requireId((await params).id);
  const data = parseBody(encounterUpdateSchema, await readJson(req));

  const patch: Record<string, unknown> = { ...data };
  if (data.status === "completed") patch.completedAt = new Date();
  if (data.status === "active") patch.completedAt = null;

  const [row] = await db
    .update(encounters)
    .set(patch)
    .where(eq(encounters.id, id))
    .returning();
  if (!row) throw new ApiError("Encounter not found", 404);
  return json(row);
});

export const DELETE = apiRoute<Params>(async (_req, { params }) => {
  const id = requireId((await params).id);
  const [row] = await db
    .delete(encounters)
    .where(eq(encounters.id, id))
    .returning();
  if (!row) throw new ApiError("Encounter not found", 404);
  return json({ success: true });
});
