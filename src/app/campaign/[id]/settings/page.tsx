import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Settings, Download, Upload } from "lucide-react";
import { db } from "@/db";
import { campaigns, backups } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { CampaignSettingsForm } from "@/components/settings/campaign-settings-form";
import { BackupsManager } from "@/components/settings/backups-manager";
import { DangerZone } from "@/components/settings/danger-zone";
import { PlayerViewSharing } from "@/components/settings/player-view-sharing";
import { LanguageSwitcher } from "@/components/settings/language-switcher";
import { UpdateCheckSetting } from "@/components/settings/update-check-setting";
import { WhatsNewButton } from "@/components/shared/whats-new";
import { APP_VERSION } from "@/lib/changelog";
import { getLocale } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const locale = await getLocale();
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
  if (!campaign) notFound();

  const backupList = await db.select().from(backups).orderBy(desc(backups.createdAt));

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Manage this campaign, exports and backups." icon={Settings} />

      <div className="space-y-10">
        <section>
          <CampaignSettingsForm campaign={campaign} />
        </section>

        <section>
          <PlayerViewSharing campaignId={campaignId} />
        </section>

        <section>
          <LanguageSwitcher current={locale} />
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
          <div>
            <h2 className="font-heading text-lg font-semibold">Sanctum {APP_VERSION}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              See what changed in this release and the ones before it.
            </p>
          </div>
          <WhatsNewButton />
        </section>

        <section>
          <UpdateCheckSetting />
        </section>

        {/* Import lives here rather than in the sidebar — it's a one-off setup
            step, not somewhere you navigate to mid-session. */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Upload className="size-4 text-primary" /> Import
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bring in a markdown vault or a filled-in character sheet PDF.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href={`/campaign/${campaignId}/import`}>
              <Upload className="size-4" /> Open the importer
            </Link>
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Export</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Download this entire campaign as a single JSON file — characters, NPCs, world,
            story, factions, shops, sessions and notes included.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <a href={`/api/campaigns/${campaignId}/export`} download>
              <Download className="size-4" /> Export campaign
            </a>
          </Button>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold">Backups</h2>
          <BackupsManager initialBackups={backupList} />
        </section>

        <section>
          <DangerZone campaignId={campaignId} campaignName={campaign.name} />
        </section>
      </div>
    </PageContainer>
  );
}
