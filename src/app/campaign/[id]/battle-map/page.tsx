import { and, desc, eq } from "drizzle-orm";
import { Grid3x3, Monitor } from "lucide-react";
import { db } from "@/db";
import { battleMaps, encounters } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { BattleMap } from "@/components/combat/battle-map";

export const dynamic = "force-dynamic";

export default async function BattleMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);

  const [maps, allEncounters] = await Promise.all([
    db
      .select()
      .from(battleMaps)
      .where(eq(battleMaps.campaignId, campaignId))
      .orderBy(desc(battleMaps.updatedAt)),
    db
      .select()
      .from(encounters)
      .where(and(eq(encounters.campaignId, campaignId), eq(encounters.isTemplate, false)))
      .orderBy(desc(encounters.createdAt)),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Battle Map"
        description="A gridded map with tokens that follow the combat tracker."
        icon={Grid3x3}
        actions={
          <Button variant="outline" asChild>
            <a href={`/screen/${campaignId}`} target="_blank" rel="noopener noreferrer">
              <Monitor className="size-4" /> Player view
            </a>
          </Button>
        }
      />
      <BattleMap
        campaignId={campaignId}
        maps={maps}
        encounters={allEncounters}
      />
    </PageContainer>
  );
}
