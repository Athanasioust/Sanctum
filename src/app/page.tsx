import { desc } from "drizzle-orm";
import { Swords, Sparkles } from "lucide-react";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog";
import { ImportCampaignButton } from "@/components/campaigns/import-campaign-button";
import { SampleCampaignButton } from "@/components/campaigns/sample-campaign-button";
import { EmptyState } from "@/components/shared/empty-state";
import { SupportLink } from "@/components/shared/support-link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allCampaigns = await db
    .select()
    .from(campaigns)
    .orderBy(desc(campaigns.updatedAt));

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Swords className="size-6" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Sanctum
            </h1>
            <p className="text-sm text-muted-foreground">
              Your campaigns, characters and worlds — all in one place.
            </p>
          </div>
        </div>
        {allCampaigns.length > 0 ? (
          <div className="flex items-center gap-2">
            <ImportCampaignButton />
            <CreateCampaignDialog />
          </div>
        ) : null}
      </header>

      {allCampaigns.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No campaigns yet"
          description="Create your first campaign to start tracking characters, combat, your world and story — or load a ready-made sample to look around first. It's a normal campaign you can change or delete."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <SampleCampaignButton variant="default" />
              <CreateCampaignDialog />
              <ImportCampaignButton />
            </div>
          }
        />
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {allCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </section>
      )}

      <footer className="mt-12 flex justify-center border-t border-border pt-6">
        <SupportLink />
      </footer>
    </main>
  );
}
