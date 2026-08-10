import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, characters, npcs } from "@/db/schema";
import {
  DesktopSidebar,
  MobileNavBar,
} from "@/components/layout/campaign-nav";
import { CampaignOptionsProvider } from "@/components/campaigns/campaign-options-context";
import { CommandPalette } from "@/components/search/command-palette";
import { RulesReference } from "@/components/shared/rules-reference";
import { DiceRoller } from "@/components/dice/dice-roller";

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

  // Feeds the character/NPC pickers: whatever this campaign already uses stays
  // offerable even when no rulebook lists it (homebrew classes, monster kinds).
  const [charValues, npcValues] = await Promise.all([
    db
      .selectDistinct({
        race: characters.race,
        className: characters.class,
        subclass: characters.subclass,
        background: characters.background,
      })
      .from(characters)
      .where(eq(characters.campaignId, id)),
    db
      .selectDistinct({ race: npcs.race, className: npcs.class })
      .from(npcs)
      .where(eq(npcs.campaignId, id)),
  ]);

  const campaignOptions = {
    rulebooks: campaign.rulebooks ?? [],
    used: {
      classes: [...charValues, ...npcValues].map((r) => r.className),
      subclasses: charValues.map((r) => r.subclass),
      races: [...charValues, ...npcValues].map((r) => r.race),
      backgrounds: charValues.map((r) => r.background),
    },
  };

  return (
    <CampaignOptionsProvider value={campaignOptions}>
      <div className="flex min-h-screen">
        <DesktopSidebar campaign={campaign} campaigns={allCampaigns} />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNavBar campaign={campaign} campaigns={allCampaigns} />
          <main className="flex-1">{children}</main>
        </div>
        <CommandPalette campaignId={campaign.id} />
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1 rounded-lg border border-border bg-card/90 p-0.5 shadow-lg backdrop-blur">
          <DiceRoller campaignId={campaign.id} />
          <RulesReference />
        </div>
      </div>
    </CampaignOptionsProvider>
  );
}
