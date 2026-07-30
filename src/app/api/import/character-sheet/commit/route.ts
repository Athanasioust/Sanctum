import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, characters, inventoryItems, spellSlots, spells } from "@/db/schema";
import { ApiError, apiRoute, json, parseBody, readJson } from "@/lib/api";
import { characterSheetImportSchema } from "@/lib/validators";

/**
 * Create a character (plus the spells, slots and equipment read off the sheet)
 * from a reviewed PDF import. Written in one transaction so a half-imported
 * character can never be left behind.
 */
export const POST = apiRoute(async (req) => {
  const body = parseBody(characterSheetImportSchema, await readJson(req));

  const [campaign] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(eq(campaigns.id, body.campaignId));
  if (!campaign) throw new ApiError("Campaign not found", 404);

  const created = db.transaction((tx) => {
    const [character] = tx
      .insert(characters)
      .values({ ...body.character, campaignId: campaign.id })
      .returning()
      .all();

    const owner = { ownerId: character.id, ownerType: "character" as const };

    if (body.spells.length) {
      for (let i = 0; i < body.spells.length; i += 40) {
        tx.insert(spells)
          .values(body.spells.slice(i, i + 40).map((s) => ({ ...s, ...owner })))
          .run();
      }
    }
    if (body.spellSlots.length) {
      tx.insert(spellSlots)
        .values(body.spellSlots.map((s) => ({ ...s, ...owner })))
        .run();
    }
    if (body.inventory.length) {
      for (let i = 0; i < body.inventory.length; i += 40) {
        tx.insert(inventoryItems)
          .values(body.inventory.slice(i, i + 40).map((item) => ({ ...item, ...owner })))
          .run();
      }
    }

    return character;
  });

  return json(
    {
      character: created,
      counts: {
        spells: body.spells.length,
        spellSlots: body.spellSlots.length,
        inventory: body.inventory.length,
      },
    },
    201,
  );
});
