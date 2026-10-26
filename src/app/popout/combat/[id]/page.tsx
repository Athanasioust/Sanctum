import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Swords } from "lucide-react";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { CombatTracker } from "@/components/combat/combat-tracker";
import { CombatRefresher } from "@/components/combat/combat-refresher";
import { EmptyState } from "@/components/shared/empty-state";
import { PopoutShell } from "@/components/layout/popout-shell";
import { DiceRoller } from "@/components/dice/dice-roller";
import { loadCombatData } from "@/lib/combat-data";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/**
 * The combat tracker on its own, for a second window. It talks to the same
 * server as the main window, and the two keep each other current through
 * src/lib/combat-sync.ts.
 */
export default async function PopoutCombatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) notFound();

  const [locale, data] = await Promise.all([getLocale(), loadCombatData(id)]);

  return (
    <I18nProvider locale={locale}>
      <PopoutShell campaignName={campaign.name} title={data.active?.name ?? "Combat"}>
        {data.active ? (
          <CombatTracker
            encounter={{ ...data.active, participants: data.participants }}
            addableCharacters={data.addableCharacters}
            addableNpcs={data.addableNpcs}
            addableBestiary={data.addableBestiary}
            partyLevels={data.partyLevels}
            npcXp={data.npcXp}
            portraits={data.portraits}
          />
        ) : (
          <EmptyState
            icon={Swords}
            title="No active encounter"
            description="Start one in the main window — it will show up here."
          />
        )}
        <CombatRefresher />
        <div className="fixed bottom-4 right-4 z-40 rounded-lg border border-border bg-card/90 p-0.5 shadow-lg backdrop-blur">
          <DiceRoller campaignId={id} />
        </div>
      </PopoutShell>
    </I18nProvider>
  );
}
