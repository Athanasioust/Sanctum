import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  characters,
  inventoryItems,
  magicItems,
  spellSlots,
  spells,
} from "@/db/schema";
import { ApiError, apiRoute, requireId } from "@/lib/api";
import { buildCharacterSheetPdf, sheetFileName } from "@/lib/pdf-character-sheet-export";

export const dynamic = "force-dynamic";

/**
 * Render a character to a printable PDF sheet. Everything the sheet shows is
 * gathered here so the renderer stays a pure function of its input.
 */
export const GET = apiRoute<{ id: string }>(async (_req, { params }) => {
  const id = requireId((await params).id);

  const [character] = await db.select().from(characters).where(eq(characters.id, id));
  if (!character) throw new ApiError("Character not found", 404);

  const [campaign, characterSpells, slots, inventory, items] = await Promise.all([
    db
      .select({ name: campaigns.name })
      .from(campaigns)
      .where(eq(campaigns.id, character.campaignId))
      .then((rows) => rows[0]),
    db
      .select()
      .from(spells)
      .where(and(eq(spells.ownerId, id), eq(spells.ownerType, "character")))
      .orderBy(asc(spells.level), asc(spells.name)),
    db
      .select()
      .from(spellSlots)
      .where(and(eq(spellSlots.ownerId, id), eq(spellSlots.ownerType, "character")))
      .orderBy(asc(spellSlots.slotLevel)),
    db
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.ownerId, id), eq(inventoryItems.ownerType, "character")))
      .orderBy(asc(inventoryItems.name)),
    db
      .select()
      .from(magicItems)
      .where(eq(magicItems.characterId, id))
      .orderBy(asc(magicItems.name)),
  ]);

  const pdf = await buildCharacterSheetPdf({
    character,
    spells: characterSpells,
    spellSlots: slots,
    inventory,
    magicItems: items,
    campaignName: campaign?.name,
  });

  return new Response(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${sheetFileName(character.name)}"`,
      "Content-Length": String(pdf.byteLength),
      "Cache-Control": "no-store",
    },
  });
});
