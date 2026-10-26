import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { encounters } from "@/db/schema";
import { apiRoute, json, parseBody, readJson } from "@/lib/api";
import { encounterCreateSchema } from "@/lib/validators";

/**
 * Encounters for a campaign. Saved encounters (templates) are prepared fights,
 * not ones that happened, so they are left out unless `?templates=1` asks for
 * them instead — every existing caller keeps seeing only real encounters.
 */
export const GET = apiRoute(async (req) => {
  const params = new URL(req.url).searchParams;
  const campaignId = params.get("campaignId");
  const filters: SQL[] = [eq(encounters.isTemplate, params.get("templates") === "1")];
  if (campaignId) filters.push(eq(encounters.campaignId, Number(campaignId)));
  return json(
    await db
      .select()
      .from(encounters)
      .where(and(...filters))
      .orderBy(desc(encounters.createdAt)),
  );
});

export const POST = apiRoute(async (req) => {
  const data = parseBody(encounterCreateSchema, await readJson(req));
  const [row] = await db.insert(encounters).values(data).returning();
  return json(row, 201);
});
