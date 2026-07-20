import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import {
  DesktopSidebar,
  MobileNavBar,
} from "@/components/layout/campaign-nav";
import { CommandPalette } from "@/components/search/command-palette";
import { RulesReference } from "@/components/shared/rules-reference";

export const dynamic = "force-dynamic";

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
  });
  if (!campaign) notFound();

  const allCampaigns = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      setting: campaigns.setting,
    })
    .from(campaigns)
    .orderBy(asc(campaigns.name));

  return (
    <div className="flex min-h-screen">
      <DesktopSidebar campaign={campaign} campaigns={allCampaigns} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNavBar campaign={campaign} campaigns={allCampaigns} />
        <main className="flex-1">{children}</main>
      </div>
      <CommandPalette campaignId={campaign.id} />
      <div className="fixed bottom-4 right-4 z-40">
        <RulesReference />
      </div>
    </div>
  );
}
