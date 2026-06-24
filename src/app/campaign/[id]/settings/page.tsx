import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Settings, Download } from "lucide-react";
import { db } from "@/db";
import { campaigns, backups } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { CampaignSettingsForm } from "@/components/settings/campaign-settings-form";
import { BackupsManager } from "@/components/settings/backups-manager";
import { DangerZone } from "@/components/settings/danger-zone";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
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
