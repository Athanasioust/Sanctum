"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, Dices, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/client";
import { generateNpc, npcToNotes, type GeneratedNpc } from "@/lib/generators";

/** One-tap random NPC for improv — regenerate until it clicks, then save it. */
export function GenerateNpcButton({
  campaignId,
  variant = "outline",
}: {
  campaignId: number;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [npc, setNpc] = useState<GeneratedNpc | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!npc) return;
    setSaving(true);
    try {
      await api.post("/api/npcs", {
        campaignId,
        name: npc.name,
        race: npc.race,
        type: "npc",
        notes: `Occupation: ${npc.occupation}\n${npcToNotes(npc)}`,
      });
      toast.success(`Saved ${npc.name} to NPCs`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save NPC");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && !npc) setNpc(generateNpc());
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Wand2 className="size-4" /> Generate NPC
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Random NPC</DialogTitle>
        </DialogHeader>
        {npc ? (
          <div className="space-y-3 py-1">
            <div>
              <p className="font-heading text-xl font-semibold">{npc.name}</p>
              <p className="text-sm text-muted-foreground">
                {npc.race} · {npc.occupation}
              </p>
            </div>
            <dl className="space-y-1.5 text-sm">
              <Row label="Appearance" value={`${npc.appearance}`} />
              <Row label="Trait" value={npc.trait} />
              <Row label="Mannerism" value={`They ${npc.mannerism}`} />
              <Row label="Ideal" value={npc.ideal} />
              <Row label="Bond" value={`They ${npc.bond}`} />
              <Row label="Flaw" value={`They ${npc.flaw}`} />
            </dl>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setNpc(generateNpc())}>
            <Dices className="size-4" /> Regenerate
          </Button>
          <Button onClick={save} disabled={saving}>
            <Save className="size-4" /> {saving ? "Saving…" : "Save as NPC"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="flex-1">{value}</dd>
    </div>
  );
}
