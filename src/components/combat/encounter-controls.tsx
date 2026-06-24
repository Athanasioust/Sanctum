"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Swords, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form";
import { EntityActions } from "@/components/shared/entity-actions";
import { api } from "@/lib/client";
import type { Encounter } from "@/db/schema";

export function NewEncounterButton({
  campaignId,
  variant = "default",
}: {
  campaignId: number;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  async function create() {
    if (!name.trim()) {
      toast.error("Encounter name is required");
      return;
    }
    setPending(true);
    try {
      await api.post("/api/encounters", { campaignId, name: name.trim() });
      toast.success("Encounter started");
      setOpen(false);
      setName("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start encounter");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Plus className="size-4" /> New Encounter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Start a new encounter</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Field label="Encounter name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ambush at the bridge"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={create} disabled={pending}>
            <Swords className="size-4" /> {pending ? "Starting…" : "Start"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReopenEncounterButton({ encounterId }: { encounterId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function reopen() {
    setPending(true);
    try {
      await api.patch(`/api/encounters/${encounterId}`, { status: "active" });
      toast.success("Encounter reopened");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reopen");
    } finally {
      setPending(false);
    }
  }
  return (
    <Button size="sm" variant="outline" onClick={reopen} disabled={pending}>
      <RotateCcw className="size-4" /> Reopen
    </Button>
  );
}

export function PastEncounters({ encounters }: { encounters: Encounter[] }) {
  if (encounters.length === 0) return null;
  return (
    <div className="mt-10">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Past encounters</h2>
      <div className="space-y-2">
        {encounters.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div>
              <p className="font-medium">{e.name}</p>
              <p className="text-xs text-muted-foreground">
                {e.roundNumber} rounds · {e.status}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ReopenEncounterButton encounterId={e.id} />
              <EntityActions deleteEndpoint={`/api/encounters/${e.id}`} entityLabel="Encounter" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
