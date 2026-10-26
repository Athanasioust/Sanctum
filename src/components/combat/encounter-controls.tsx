"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Swords, RotateCcw, Bookmark, BookmarkCheck } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

/** Start a fresh live fight from a saved encounter. */
export function StartSavedEncounterButton({ saved }: { saved: Encounter[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  if (saved.length === 0) return null;

  async function start(id: number) {
    setPending(true);
    try {
      await api.post(`/api/encounters/${id}/clone`, { template: false });
      toast.success("Encounter started from your saved fight");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start encounter");
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={pending}>
          <BookmarkCheck className="size-4" /> Start from saved
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-64 overflow-y-auto">
        <DropdownMenuLabel>Saved encounters</DropdownMenuLabel>
        {saved.map((e) => (
          <DropdownMenuItem key={e.id} onSelect={() => start(e.id)}>
            {e.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Keep a copy of this fight (combatants, stats, groups) to run again later. */
export function SaveEncounterButton({ encounterId, name }: { encounterId: number; name: string }) {
  const [pending, setPending] = useState(false);
  async function save() {
    setPending(true);
    try {
      await api.post(`/api/encounters/${encounterId}/clone`, { template: true, name });
      toast.success(`Saved "${name}" — start a fresh copy any time from the combat page`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }
  return (
    <Button variant="outline" onClick={save} disabled={pending} title="Save this fight to run again later">
      <Bookmark className="size-4" /> Save for reuse
    </Button>
  );
}

/** The saved-encounter library, with start and delete. */
export function SavedEncounters({
  campaignId,
  saved,
  fightInProgress,
}: {
  campaignId: number;
  saved: (Encounter & { combatants: number })[];
  /** Only one fight runs at a time; starting another waits for it to end. */
  fightInProgress: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);
  if (saved.length === 0) return null;

  async function start(id: number) {
    setPending(id);
    try {
      await api.post(`/api/encounters/${id}/clone`, { template: false });
      toast.success("Encounter started");
      router.push(`/campaign/${campaignId}/combat`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start encounter");
      setPending(null);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Bookmark className="size-4" /> Saved encounters
      </h2>
      <div className="space-y-2">
        {saved.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{e.name}</p>
              <p className="text-xs text-muted-foreground">
                {e.combatants} combatant{e.combatants === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => start(e.id)}
                disabled={pending !== null || fightInProgress}
                title={fightInProgress ? "End the fight in progress first" : undefined}
              >
                <Swords className="size-4" /> {pending === e.id ? "Starting…" : "Start"}
              </Button>
              <EntityActions deleteEndpoint={`/api/encounters/${e.id}`} entityLabel="Saved encounter" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
