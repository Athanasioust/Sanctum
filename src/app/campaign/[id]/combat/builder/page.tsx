import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, Swords } from "lucide-react";
import { db } from "@/db";
import { characters, npcs } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import {
  EncounterBuilder,
  type BuilderChar,
  type BuilderMonster,
} from "@/components/combat/encounter-builder";
import { abilityModifier } from "@/lib/dnd";
import { CR_XP } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function EncounterBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);

  const [chars, monsters] = await Promise.all([
    db.select().from(characters).where(eq(characters.campaignId, campaignId)).orderBy(asc(characters.name)),
    db.select().from(npcs).where(eq(npcs.campaignId, campaignId)).orderBy(asc(npcs.name)),
  ]);

  const party: BuilderChar[] = chars.map((c) => ({
    id: c.id,
    name: c.name,
    level: c.level,
    hpMax: c.hpMax,
    armorClass: c.armorClass,
  }));

  const pool: BuilderMonster[] = monsters
    .filter((n) => n.type === "monster" || n.isTemplate)
    .map((n) => ({
      id: n.id,
      name: n.name,
      cr: n.challengeRating,
      xp: n.experiencePoints || CR_XP[n.challengeRating] || 0,
      hpMax: n.hpMax,
      armorClass: n.armorClass,
      initiativeMod: abilityModifier(n.dex),
      isTemplate: n.isTemplate,
    }));

  return (
    <PageContainer>
      <Link
        href={`/campaign/${campaignId}/combat`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Combat
      </Link>
      <PageHeader
        title="Encounter Builder"
        description="Pick your party and some monsters to see how hard the fight will be — before the session."
        icon={Swords}
      />
      <EncounterBuilder campaignId={campaignId} party={party} monsters={pool} />
    </PageContainer>
  );
}
