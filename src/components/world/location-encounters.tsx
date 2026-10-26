"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dices, Link2, Swords, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";
import { weightedPick } from "@/lib/dnd";
import { findCreatures, type FoundCreature } from "@/lib/random-encounter";
import type { CombatParticipant, RollTable } from "@/db/schema";

export type EncounterCreature = {
  id: number;
  name: string;
  hpMax: number;
  armorClass: number;
  initiativeMod: number;
};

export type EncounterPartyMember = EncounterCreature & { hpCurrent: number };

type Rolled = {
  tableName: string;
  result: string;
  found: FoundCreature<EncounterCreature>[];
};

/**
 * Random encounters for a location: roll the tables linked to it and, when
 * the result names creatures from the campaign, turn it straight into a fight.
 */
export function LocationEncounters({
  campaignId,
  locationId,
  locationName,
  tables,
  otherTables,
  creatures,
  party,
  activeEncounterId,
}: {
  campaignId: number;
  locationId: number;
  locationName: string;
  /** Tables linked to this location. */
  tables: RollTable[];
  /** Every other roll table in the campaign, offered for linking. */
  otherTables: { id: number; name: string }[];
  creatures: EncounterCreature[];
  party: EncounterPartyMember[];
  /** The fight in progress, if any — results are added to it rather than starting another. */
  activeEncounterId: number | null;
}) {
  const t = useT();
  const router = useRouter();
  const [rolled, setRolled] = useState<Rolled | null>(null);
  const [busy, setBusy] = useState(false);

  async function link(tableId: number | null, id: number) {
    try {
      await api.patch(`/api/roll-tables/${id}`, { locationId: tableId === null ? null : locationId });
      router.refresh();
    } catch {
      toast.error(t("randomEnc.failed"));
    }
  }

  function rollTable(table: RollTable) {
    if (table.entries.length === 0) {
      toast.error(t("randomEnc.empty"));
      return;
    }
    const entry = table.entries[weightedPick(table.entries.map((e) => e.weight))];
    setRolled({
      tableName: table.name,
      result: entry.result,
      found: findCreatures(entry.result, creatures),
    });
  }

  async function startFight() {
    if (!rolled || rolled.found.length === 0) return;
    setBusy(true);
    try {
      let encounterId = activeEncounterId;
      let turnOrder = 0;
      const payloads: Record<string, unknown>[] = [];

      if (encounterId) {
        const existing = await api.get<CombatParticipant[]>(`/api/participants?encounterId=${encounterId}`);
        turnOrder = existing.length;
      } else {
        const encounter = await api.post<{ id: number }>("/api/encounters", {
          campaignId,
          name: `${locationName}: ${rolled.result}`.slice(0, 120),
        });
        encounterId = encounter.id;
        for (const c of party) {
          payloads.push({
            encounterId,
            entityId: c.id,
            entityType: "character",
            name: c.name,
            hpMax: c.hpMax,
            hpCurrent: c.hpCurrent > 0 ? c.hpCurrent : c.hpMax,
            armorClass: c.armorClass,
            initiativeMod: c.initiativeMod,
            turnOrder: turnOrder++,
          });
        }
      }

      for (const { creature, count } of rolled.found) {
        const groupId = count > 1 ? crypto.randomUUID() : null;
        for (let i = 0; i < count; i++) {
          payloads.push({
            encounterId,
            entityId: creature.id,
            entityType: "npc",
            name: count > 1 ? `${creature.name} ${i + 1}` : creature.name,
            hpMax: creature.hpMax,
            hpCurrent: creature.hpMax,
            armorClass: creature.armorClass,
            initiativeMod: creature.initiativeMod,
            turnOrder: turnOrder++,
            groupId,
            groupLabel: groupId ? creature.name : null,
          });
        }
      }

      await api.post("/api/participants", payloads);
      toast.success(activeEncounterId ? t("randomEnc.added") : t("randomEnc.started"));
      router.push(`/campaign/${campaignId}/combat`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("randomEnc.failed"));
      setBusy(false);
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Dices className="size-4 text-primary" /> {t("randomEnc.title")}
        </h2>
        {otherTables.length > 0 ? (
          <Select value="" onValueChange={(v) => link(locationId, Number(v))}>
            <SelectTrigger className="h-8 w-56" aria-label={t("randomEnc.link")}>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Link2 className="size-3.5" /> {t("randomEnc.link")}
              </span>
            </SelectTrigger>
            <SelectContent>
              {otherTables.map((tbl) => (
                <SelectItem key={tbl.id} value={String(tbl.id)}>
                  {tbl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {tables.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("randomEnc.none")}</p>
      ) : (
        <ul className="space-y-2">
          {tables.map((table) => (
            <li key={table.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-medium">{table.name}</span>
              <Button size="sm" onClick={() => rollTable(table)}>
                <Dices className="size-4" /> {t("randomEnc.roll")}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground"
                onClick={() => link(null, table.id)}
                aria-label={t("randomEnc.unlink")}
                title={t("randomEnc.unlink")}
              >
                <Unlink className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {rolled ? (
        <div className="mt-3 rounded-lg border border-primary/40 bg-primary/10 p-3">
          <p className="text-xs text-muted-foreground">{rolled.tableName}</p>
          <p className="font-medium">{rolled.result}</p>
          {rolled.found.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {rolled.found
                  .map((f) => `${f.count}× ${f.creature.name}${f.countText && /d/i.test(f.countText) ? ` (${f.countText})` : ""}`)
                  .join(", ")}
              </span>
              <Button size="sm" onClick={startFight} disabled={busy}>
                <Swords className="size-4" />
                {activeEncounterId ? t("randomEnc.addToFight") : t("randomEnc.startFight")}
              </Button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">{t("randomEnc.noCreatures")}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
