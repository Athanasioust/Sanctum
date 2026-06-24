import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { encounters } from "@/db/schema";
import { apiRoute, json, parseBody, readJson } from "@/lib/api";
import { encounterCreateSchema } from "@/lib/validators";

export const GET = apiRoute(async (req) => {
  const campaignId = new URL(req.url).searchParams.get("campaignId");
  let q = db.select().from(encounters).$dynamic();
  if (campaignId) q = q.where(eq(encounters.campaignId, Number(campaignId)));
  return json(await q.orderBy(desc(encounters.createdAt)));
});

export const POST = apiRoute(async (req) => {
  const data = parseBody(encounterCreateSchema, await readJson(req));
  const [row] = await db.insert(encounters).values(data).returning();
  return json(row, 201);
});
