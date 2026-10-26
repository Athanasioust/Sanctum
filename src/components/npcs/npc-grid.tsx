"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, UserPlus, Swords } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HpBar } from "@/components/shared/hp-bar";
import { EntityActions } from "@/components/shared/entity-actions";
import { api } from "@/lib/client";
import {
  BulkToolbar,
  SelectOverlay,
  useBulkDelete,
  useBulkSelection,
} from "@/components/shared/bulk-select";
import { cn } from "@/lib/utils";
import type { Encounter, Npc } from "@/db/schema";

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
  const selection = useBulkSelection(filtered.map((n) => n.id));
  const deleteMany = useBulkDelete({ entity: "npcs", campaignId });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
        <BulkToolbar selection={selection} total={filtered.length} onDelete={deleteMany} />
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
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={n.type === "monster" ? "destructive" : "secondary"}>
                      {n.type === "monster" ? "Monster" : "NPC"}
                    </Badge>
                    {n.source === "homebrew" ? (
                      <Badge variant="secondary" className="text-[10px]">Homebrew</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <HpBar current={n.hpCurrent} max={n.hpMax} />
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Shield className="size-4 text-primary" /> AC {n.armorClass}</span>
                    {n.challengeRating ? <span>CR {n.challengeRating}</span> : null}
                  </div>
                </div>
              </Link>
              {basePath === "bestiary" ? (
                <BestiaryCardActions npc={n} campaignId={campaignId} />
              ) : null}
              {selection.selecting ? null : (
                <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <EntityActions
                    editHref={`/campaign/${campaignId}/${basePath}/${n.id}/edit`}
                    deleteEndpoint={`/api/npcs/${n.id}`}
                    entityLabel={entityLabel}
                  />
                </div>
              )}
              <SelectOverlay selection={selection} id={n.id} label={n.name} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Quick "pull from the library" actions shown on Bestiary cards, so the
 * Bestiary reads as a source of reusable templates rather than a second copy
 * of the NPC roster. Cloning a template creates a live instance (isTemplate:
 * false) or drops it straight into the active encounter.
 */
function BestiaryCardActions({ npc, campaignId }: { npc: Npc; campaignId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function addToCampaign() {
    setPending(true);
    try {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = npc;
      void _id; void _c; void _u;
      const created = await api.post<Npc>("/api/npcs", {
        ...rest,
        isTemplate: false,
        hpCurrent: npc.hpMax,
      });
      toast.success(`Added "${npc.name}" to the campaign`);
      router.push(`/campaign/${campaignId}/npcs/${created.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add NPC");
      setPending(false);
    }
  }

  async function addToEncounter() {
    setPending(true);
    try {
      const encounters = await api.get<Encounter[]>(`/api/encounters?campaignId=${campaignId}`);
      const active = encounters.find((e) => e.status === "active");
      if (!active) {
        toast.error("No active encounter. Start one in Combat first.");
        return;
      }
      await api.post("/api/participants", {
        encounterId: active.id,
        entityId: npc.id,
        entityType: "npc",
        name: npc.name,
        hpCurrent: npc.hpMax,
        hpMax: npc.hpMax,
        armorClass: npc.armorClass,
      });
      toast.success(`Added "${npc.name}" to ${active.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add to encounter");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-border px-5 py-3">
      <Button size="sm" variant="outline" className="flex-1" onClick={addToCampaign} disabled={pending}>
        <UserPlus className="size-3.5" /> Add to campaign
      </Button>
      <Button size="sm" variant="outline" className="flex-1" onClick={addToEncounter} disabled={pending}>
        <Swords className="size-3.5" /> To encounter
      </Button>
    </div>
  );
}
