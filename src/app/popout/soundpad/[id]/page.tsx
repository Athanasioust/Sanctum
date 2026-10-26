import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { campaigns, soundAssets, soundscapes } from "@/db/schema";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { SoundpadProvider } from "@/components/soundpad/soundpad-context";
import { Soundpad } from "@/components/soundpad/soundpad";
import { PopoutShell } from "@/components/layout/popout-shell";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/**
 * The soundpad in its own window. It carries its own audio engine, so music
 * plays from this window; the main window stops its playback as it pops out.
 */
export default async function PopoutSoundpadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) notFound();

  const [locale, assets, scapes] = await Promise.all([
    getLocale(),
    db.select().from(soundAssets).where(eq(soundAssets.campaignId, id)).orderBy(asc(soundAssets.name)),
    db.select().from(soundscapes).where(eq(soundscapes.campaignId, id)).orderBy(asc(soundscapes.name)),
  ]);

  return (
    <I18nProvider locale={locale}>
      <SoundpadProvider campaignId={id}>
        <PopoutShell campaignName={campaign.name} title="Soundpad">
          <Soundpad campaignId={id} assets={assets} soundscapes={scapes} />
        </PopoutShell>
      </SoundpadProvider>
    </I18nProvider>
  );
}
