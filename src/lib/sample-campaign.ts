import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { atlasMaps, campaigns, characters } from "@/db/schema";
import { importCampaign } from "@/lib/campaign-data";
import { getSetting, setSetting } from "@/lib/app-settings";
import sample from "@/lib/sample-campaign.json";

/** app_settings key holding the id of the sample campaign this install seeded. */
const SAMPLE_KEY = "sampleCampaignId";

export type SampleCampaign = {
  id: number;
  /** True when this call created it; false when an existing copy was reused. */
  created: boolean;
  /** First character, for the tour's character-sheet stop. */
  characterId: number | null;
  /** First atlas map, for the tour's atlas stop. */
  atlasMapId: number | null;
};

/**
 * The sample campaign, seeded on first request and reused afterwards.
 *
 * Idempotency hangs off the id this function recorded, never off the campaign
 * name: a campaign is only ever reused if it is the exact one we created, so a
 * DM's own campaign (or an older "(Sample)" copy loaded before 0.9) is never
 * mistaken for it, renamed or touched. If the DM deleted the sample, the
 * recorded id no longer exists and a fresh copy is imported.
 *
 * Seeding goes through the ordinary import path into a brand-new campaign, so
 * nothing is ever written into an existing campaign.
 */
export async function ensureSampleCampaign(): Promise<SampleCampaign> {
  // One seed at a time, so a double click can't import two copies.
  pending ??= seed().finally(() => {
    pending = null;
  });
  return pending;
}

let pending: Promise<SampleCampaign> | null = null;

async function seed(): Promise<SampleCampaign> {
  const recorded = Number(safeGet(SAMPLE_KEY));
  let id: number | null = null;
  if (Number.isInteger(recorded) && recorded > 0) {
    const row = db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.id, recorded)).get();
    id = row?.id ?? null;
  }

  const created = id === null;
  if (id === null) {
    id = await importCampaign(sample);
    setSetting(SAMPLE_KEY, String(id));
  }

  const character = db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.campaignId, id))
    .orderBy(asc(characters.id))
    .get();
  const atlas = db
    .select({ id: atlasMaps.id })
    .from(atlasMaps)
    .where(eq(atlasMaps.campaignId, id))
    .orderBy(asc(atlasMaps.id))
    .get();

  return { id, created, characterId: character?.id ?? null, atlasMapId: atlas?.id ?? null };
}

function safeGet(key: string): string | null {
  try {
    return getSetting(key);
  } catch {
    return null;
  }
}
