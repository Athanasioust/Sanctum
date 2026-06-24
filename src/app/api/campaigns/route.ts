import { desc } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { apiRoute, json, readJson, parseBody } from "@/lib/api";
import { campaignCreateSchema } from "@/lib/validators";

export const GET = apiRoute(async () => {
  const rows = await db
    .select()
    .from(campaigns)
    .orderBy(desc(campaigns.updatedAt));
  return json(rows);
});

export const POST = apiRoute(async (req) => {
  const body = parseBody(campaignCreateSchema, await readJson(req));
  const [row] = await db.insert(campaigns).values(body).returning();
  return json(row, 201);
});
