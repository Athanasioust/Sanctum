import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { PlayerScreen, type ScreenState } from "@/components/screen/player-screen";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { getLocale } from "@/lib/i18n/server";
import { loadPlayerAtlas } from "@/lib/atlas/server";
import { loadPlayerScreenState } from "@/lib/screen/state";

export const dynamic = "force-dynamic";

/**
 * Read-only "second screen" for players — initiative order and party health,
 * auto-refreshing. Lives outside the campaign layout so it fills the display
 * with no DM navigation. Open it on a TV or share the Network URL to phones.
 *
 * The whole view is rendered on the server, so the screen is readable the
 * moment the HTML lands; the client polling on top of it is only an
 * enhancement. Both read the same player-safe payload
 * (`loadPlayerScreenState`), so the HTML never carries anything the player
 * view isn't allowed to see either.
 */
async function loadScreenState(campaignId: number): Promise<ScreenState> {
  const [screen, atlas] = await Promise.all([
    loadPlayerScreenState(campaignId),
    loadPlayerAtlas(campaignId),
  ]);
  return { ...screen, atlas };
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
