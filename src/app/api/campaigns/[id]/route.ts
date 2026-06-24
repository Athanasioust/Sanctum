import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { ApiError, apiRoute, json, readJson, parseBody, requireId } from "@/lib/api";
import { campaignUpdateSchema } from "@/lib/validators";

type Params = { id: string };

export const GET = apiRoute<Params>(async (_req, { params }) => {
  const id = requireId((await params).id);
  const row = await db.query.campaigns.findFirst({ where: eq(campaigns.id, id) });
  if (!row) throw new ApiError("Campaign not found", 404);
  return json(row);
});

export const PATCH = apiRoute<Params>(async (req, { params }) => {
  const id = requireId((await params).id);
  const body = parseBody(campaignUpdateSchema, await readJson(req));
  const [row] = await db
    .update(campaigns)
    .set(body)
    .where(eq(campaigns.id, id))
    .returning();
  if (!row) throw new ApiError("Campaign not found", 404);
  return json(row);
});

export const DELETE = apiRoute<Params>(async (_req, { params }) => {
  const id = requireId((await params).id);
  const [row] = await db.delete(campaigns).where(eq(campaigns.id, id)).returning();
  if (!row) throw new ApiError("Campaign not found", 404);
  return json({ success: true });
});
