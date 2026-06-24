import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, Pencil } from "lucide-react";
import { db } from "@/db";
import { npcs } from "@/db/schema";
import { PageContainer } from "@/components/shared/page-header";
import { StatBlock } from "@/components/npcs/stat-block";
import { EntityActions } from "@/components/shared/entity-actions";
import {
  SaveToBestiaryButton,
  AddToEncounterButton,
} from "@/components/npcs/npc-clone-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function NpcDetailPage({
  params,
}: {
  params: Promise<{ id: string; npcId: string }>;
}) {
  const { id, npcId } = await params;
  const campaignId = Number(id);
  const [npc] = await db.select().from(npcs).where(eq(npcs.id, Number(npcId)));
  if (!npc || npc.campaignId !== campaignId) notFound();

  return (
    <PageContainer>
      <Link
        href={`/campaign/${campaignId}/npcs`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to NPCs
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">{npc.name}</h1>
            <Badge variant={npc.type === "monster" ? "destructive" : "secondary"}>
              {npc.type === "monster" ? "Monster" : "NPC"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddToEncounterButton npc={npc} campaignId={campaignId} />
          <SaveToBestiaryButton npc={npc} />
          <Button asChild variant="outline">
            <Link href={`/campaign/${campaignId}/npcs/${npc.id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </Button>
          <EntityActions
            deleteEndpoint={`/api/npcs/${npc.id}`}
            entityLabel="NPC"
            redirectTo={`/campaign/${campaignId}/npcs`}
          />
        </div>
      </div>

      <StatBlock npc={npc} />
    </PageContainer>
  );
}
