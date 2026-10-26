import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { characters, npcs } from "@/db/schema";

/**
 * Portrait URLs for whichever characters and NPCs these combatants come from,
 * keyed by `portraitKey` (src/lib/portrait-key.ts). Only entities that actually have a portrait appear.
 */
export async function portraitsFor(
  parts: { entityType: string | null; entityId: number | null }[],
): Promise<Record<string, string>> {
  const charIds = new Set<number>();
  const npcIds = new Set<number>();
  for (const p of parts) {
    if (p.entityId == null) continue;
    if (p.entityType === "character") charIds.add(p.entityId);
    else if (p.entityType === "npc") npcIds.add(p.entityId);
  }

  const [charRows, npcRows] = await Promise.all([
    charIds.size
      ? db
          .select({ id: characters.id, url: characters.portraitUrl })
          .from(characters)
          .where(inArray(characters.id, [...charIds]))
      : [],
    npcIds.size
      ? db
          .select({ id: npcs.id, url: npcs.portraitUrl })
          .from(npcs)
          .where(inArray(npcs.id, [...npcIds]))
      : [],
  ]);

  const out: Record<string, string> = {};
  for (const r of charRows) if (r.url) out[`character:${r.id}`] = r.url;
  for (const r of npcRows) if (r.url) out[`npc:${r.id}`] = r.url;
  return out;
}
