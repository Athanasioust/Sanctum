import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { npcs } from "@/db/schema";
import { apiRoute, json, requireId } from "@/lib/api";
import { SRD_MONSTERS } from "@/lib/srd-monsters";

type Params = { id: string };

/**
 * Bulk-import the curated SRD monster templates into a campaign's Bestiary.
 * Idempotent: monsters already present (matched by name) are skipped, so the
 * DM can run it repeatedly without creating duplicates.
 */
export const POST = apiRoute<Params>(async (_req, { params }) => {
  const campaignId = requireId((await params).id);

  const existing = await db
    .select({ name: npcs.name })
    .from(npcs)
    .where(and(eq(npcs.campaignId, campaignId), eq(npcs.isTemplate, true)));
  const have = new Set(existing.map((e) => e.name.toLowerCase()));

  const rows = SRD_MONSTERS.filter((m) => !have.has(m.name.toLowerCase())).map(
    (m) => ({ ...m, campaignId, isTemplate: true, hpCurrent: m.hpMax }),
  );

  // Insert in chunks to stay well under SQLite's bound-variable limit.
  for (let i = 0; i < rows.length; i += 40) {
    await db.insert(npcs).values(rows.slice(i, i + 40));
  }

  return json({ added: rows.length, skipped: SRD_MONSTERS.length - rows.length });
});
