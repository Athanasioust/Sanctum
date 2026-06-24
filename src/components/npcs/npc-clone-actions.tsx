"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookPlus, UserPlus, Swords } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import type { Encounter, Npc } from "@/db/schema";

/** Build a create payload from an existing npc/template, stripping identity columns. */
function npcCreatePayload(npc: Npc, overrides: Partial<Npc>) {
  const {
    id: _id,
    createdAt: _c,
    updatedAt: _u,
    ...rest
  } = npc;
  void _id;
  void _c;
  void _u;
  return { ...rest, ...overrides };
}

export function SaveToBestiaryButton({ npc }: { npc: Npc }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function run() {
    setPending(true);
    try {
      await api.post(
        "/api/npcs",
        npcCreatePayload(npc, { isTemplate: true, hpCurrent: npc.hpMax }),
      );
      toast.success(`"${npc.name}" saved to Bestiary`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setPending(false);
    }
  }
  return (
    <Button variant="outline" onClick={run} disabled={pending}>
      <BookPlus className="size-4" /> Save to Bestiary
    </Button>
  );
}

export function AddAsNpcButton({
  npc,
  campaignId,
}: {
  npc: Npc;
  campaignId: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function run() {
    setPending(true);
    try {
      const created = await api.post<Npc>(
        "/api/npcs",
        npcCreatePayload(npc, { isTemplate: false, hpCurrent: npc.hpMax }),
      );
      toast.success(`Added "${npc.name}" to the campaign`);
      router.push(`/campaign/${campaignId}/npcs/${created.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add NPC");
    } finally {
      setPending(false);
    }
  }
  return (
    <Button variant="outline" onClick={run} disabled={pending}>
      <UserPlus className="size-4" /> Add to campaign as NPC
    </Button>
  );
}

export function AddToEncounterButton({
  npc,
  campaignId,
}: {
  npc: Npc;
  campaignId: number;
}) {
  const [pending, setPending] = useState(false);
  async function run() {
    setPending(true);
    try {
      const encounters = await api.get<Encounter[]>(
        `/api/encounters?campaignId=${campaignId}`,
      );
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
    <Button onClick={run} disabled={pending}>
      <Swords className="size-4" /> Add to encounter
    </Button>
  );
}
