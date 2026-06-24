"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HpBar } from "@/components/shared/hp-bar";
import { EntityActions } from "@/components/shared/entity-actions";
import { cn } from "@/lib/utils";
import type { Npc } from "@/db/schema";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "npc", label: "NPCs" },
  { key: "monster", label: "Monsters" },
] as const;

export function NpcGrid({
  campaignId,
  npcs,
  basePath = "npcs",
  entityLabel = "NPC",
}: {
  campaignId: number;
  npcs: Npc[];
  basePath?: "npcs" | "bestiary";
  entityLabel?: string;
}) {
  const [filter, setFilter] = useState<"all" | "npc" | "monster">("all");
  const filtered = filter === "all" ? npcs : npcs.filter((n) => n.type === filter);

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No {filter === "all" ? "" : filter === "npc" ? "NPCs" : "monsters"} match this filter.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => (
            <div key={n.id} className="group relative rounded-xl border border-border bg-card transition-colors hover:border-primary/50">
              <Link href={`/campaign/${campaignId}/${basePath}/${n.id}`} className="block p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-heading text-lg font-semibold">{n.name}</h3>
                    <p className="truncate text-sm text-muted-foreground">
                      {[n.size, n.race].filter(Boolean).join(" ") || (n.type === "monster" ? "Monster" : "NPC")}
                    </p>
                  </div>
                  <Badge variant={n.type === "monster" ? "destructive" : "secondary"}>
                    {n.type === "monster" ? "Monster" : "NPC"}
                  </Badge>
                </div>
                <div className="mt-4 space-y-3">
                  <HpBar current={n.hpCurrent} max={n.hpMax} />
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Shield className="size-4 text-primary" /> AC {n.armorClass}</span>
                    {n.challengeRating ? <span>CR {n.challengeRating}</span> : null}
                  </div>
                </div>
              </Link>
              <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                <EntityActions
                  editHref={`/campaign/${campaignId}/${basePath}/${n.id}/edit`}
                  deleteEndpoint={`/api/npcs/${n.id}`}
                  entityLabel={entityLabel}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
