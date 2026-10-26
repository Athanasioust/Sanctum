import { and, asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  battleMaps,
  campaigns,
  characters,
  combatParticipants,
  encounters,
  handouts,
} from "@/db/schema";
import { PlayerScreen, type ScreenState } from "@/components/screen/player-screen";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { getLocale } from "@/lib/i18n/server";
import { keepGroupsTogether } from "@/lib/combat-turns";

export const dynamic = "force-dynamic";

/**
 * Read-only "second screen" for players — initiative order and party health,
 * auto-refreshing. Lives outside the campaign layout so it fills the display
 * with no DM navigation. Open it on a TV or share the Network URL to phones.
 *
 * The whole view is rendered on the server. It used to ship a "Loading…"
 * placeholder and fetch everything from the client, which meant any device that
 * couldn't run the JavaScript — an old phone browser, a blocked script, a
 * request that hung — sat on that placeholder forever with nothing to show and
 * no way to tell why. Rendering the real state up front means the screen is
 * readable the moment the HTML lands; the client polling on top of it is now
 * only an enhancement.
 */
async function loadScreenState(campaignId: number): Promise<ScreenState> {
  const [party, revealedHandouts, revealedMaps, active] = await Promise.all([
    db
      .select()
      .from(characters)
      .where(eq(characters.campaignId, campaignId))
      .orderBy(asc(characters.name)),
    db
      .select()
      .from(handouts)
      .where(and(eq(handouts.campaignId, campaignId), eq(handouts.isRevealed, true)))
      .orderBy(asc(handouts.sortOrder)),
    db
      .select()
      .from(battleMaps)
      .where(
        and(eq(battleMaps.campaignId, campaignId), eq(battleMaps.revealToPlayers, true)),
      )
      // Most recently touched map wins if the DM left more than one flagged.
      .orderBy(desc(battleMaps.updatedAt))
      .limit(1),
    db
      .select()
      .from(encounters)
      .where(and(eq(encounters.campaignId, campaignId), eq(encounters.status, "active")))
      .orderBy(desc(encounters.createdAt))
      .limit(1),
  ]);

  const encounter = active[0] ?? null;
  const participants = encounter
    ? await db
        .select()
        .from(combatParticipants)
        .where(eq(combatParticipants.encounterId, encounter.id))
        .orderBy(asc(combatParticipants.turnOrder))
    : [];

  return {
    active: encounter !== null,
    encounterName: encounter?.name ?? "",
    round: encounter?.roundNumber ?? 1,
    turnIndex: encounter?.currentTurnIndex ?? 0,
    lairActive: encounter?.lairTurnActive ?? false,
    participants: keepGroupsTogether(participants),
    party,
    handouts: revealedHandouts,
    battleMap: revealedMaps[0] ?? null,
  };
}

export default async function ScreenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) notFound();

  // This route is outside the campaign layout, so it carries its own provider.
  const [locale, initialState] = await Promise.all([getLocale(), loadScreenState(id)]);

  return (
    <I18nProvider locale={locale}>
      <PlayerScreen
        campaignId={id}
        campaignName={campaign.name}
        initialState={initialState}
      />
    </I18nProvider>
  );
}
