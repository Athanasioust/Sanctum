import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { PlayerScreen } from "@/components/screen/player-screen";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/**
 * Read-only "second screen" for players — initiative order and party health,
 * auto-refreshing. Lives outside the campaign layout so it fills the display
 * with no DM navigation. Open it on a TV or share the Network URL to phones.
 */
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
  const locale = await getLocale();

  return (
    <I18nProvider locale={locale}>
      <PlayerScreen campaignId={id} campaignName={campaign.name} />
    </I18nProvider>
  );
}
