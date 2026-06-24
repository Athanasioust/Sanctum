import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Users, Plus, Shield, Heart } from "lucide-react";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { HpBar } from "@/components/shared/hp-bar";
import { EntityActions } from "@/components/shared/entity-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const list = await db
    .select()
    .from(characters)
    .where(eq(characters.campaignId, campaignId))
    .orderBy(asc(characters.name));

  return (
    <PageContainer>
      <PageHeader
        title="Characters"
        description="Your players' heroes and their full stat blocks."
        icon={Users}
        actions={
          list.length > 0 ? (
            <Button asChild>
              <Link href={`/campaign/${campaignId}/characters/new`}>
                <Plus className="size-4" />
                New Character
              </Link>
            </Button>
          ) : null
        }
      />

      {list.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No characters yet"
          description="Add your players' characters to track their stats, spells, inventory and more."
          action={
            <Button asChild>
              <Link href={`/campaign/${campaignId}/characters/new`}>
                <Plus className="size-4" />
                New Character
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const classLine = [c.race, c.class && `${c.class}${c.subclass ? ` (${c.subclass})` : ""}`]
              .filter(Boolean)
              .join(" · ");
            return (
              <div
                key={c.id}
                className="group relative rounded-xl border border-border bg-card transition-colors hover:border-primary/50"
              >
                <Link href={`/campaign/${campaignId}/characters/${c.id}`} className="block p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-heading text-lg font-semibold">{c.name}</h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {classLine || "Adventurer"}
                      </p>
                    </div>
                    <Badge variant="secondary">Lv {c.level}</Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    <HpBar current={c.hpCurrent} max={c.hpMax} temp={c.hpTemp} />
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Shield className="size-4 text-primary" /> AC {c.armorClass}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="size-4 text-destructive" /> {c.hpMax} HP
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <EntityActions
                    editHref={`/campaign/${campaignId}/characters/${c.id}/edit`}
                    deleteEndpoint={`/api/characters/${c.id}`}
                    entityLabel="Character"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
