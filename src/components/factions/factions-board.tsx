"use client";

import { useState } from "react";
import { Plus, Flag, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/shared/form";
import { CheckboxGroup } from "@/components/shared/checkbox-group";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityActions } from "@/components/shared/entity-actions";
import { api } from "@/lib/client";
import { FACTION_RELATIONSHIPS } from "@/lib/constants";
import { relationshipClasses } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { Faction } from "@/db/schema";

type NpcOption = { id: number; name: string };

export function FactionsBoard({
  campaignId,
  initialFactions,
  npcs,
}: {
  campaignId: number;
  initialFactions: Faction[];
  npcs: NpcOption[];
}) {
  const [factions, setFactions] = useState<Faction[]>(initialFactions);
  const npcName = (id: number) => npcs.find((n) => n.id === id)?.name ?? `NPC #${id}`;

  function upsert(f: Faction) {
    setFactions((prev) =>
      prev.some((x) => x.id === f.id) ? prev.map((x) => (x.id === f.id ? f : x)) : [...prev, f],
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FactionDialog campaignId={campaignId} npcs={npcs} onSaved={upsert} />
      </div>

      {factions.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No factions yet"
          description="Track the organisations, guilds and powers at play — and where they stand with your party."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {factions.map((f) => (
            <div key={f.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-lg font-semibold">{f.name}</h3>
                  <Badge className={cn("mt-1 capitalize", relationshipClasses(f.relationshipWithPlayers))}>
                    {f.relationshipWithPlayers}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <FactionDialog
                    campaignId={campaignId}
                    npcs={npcs}
                    faction={f}
                    onSaved={upsert}
                    trigger={<Button size="sm" variant="outline">Edit</Button>}
                  />
                  <EntityActions
                    deleteEndpoint={`/api/factions/${f.id}`}
                    entityLabel="Faction"
                  />
                </div>
              </div>

              {f.description ? (
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{f.description}</p>
              ) : null}

              <div className="mt-3 space-y-2 text-sm">
                {f.goals ? <Detail label="Goals" value={f.goals} /> : null}
                {f.resources ? <Detail label="Resources" value={f.resources} /> : null}
                {f.secrets ? <Detail label="Secrets" value={f.secrets} /> : null}
              </div>

              {f.keyNpcIds.length > 0 ? (
                <div className="mt-3">
                  <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Users className="size-3.5" /> Key NPCs
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {f.keyNpcIds.map((id) => (
                      <Badge key={id} variant="secondary">{npcName(id)}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-medium text-foreground">{label}: </span>
      <span className="whitespace-pre-wrap text-muted-foreground">{value}</span>
    </div>
  );
}

function FactionDialog({
  campaignId,
  npcs,
  faction,
  onSaved,
  trigger,
}: {
  campaignId: number;
  npcs: NpcOption[];
  faction?: Faction;
  onSaved: (f: Faction) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: faction?.name ?? "",
    description: faction?.description ?? "",
    goals: faction?.goals ?? "",
    resources: faction?.resources ?? "",
    secrets: faction?.secrets ?? "",
    relationshipWithPlayers: faction?.relationshipWithPlayers ?? "unknown",
    keyNpcIds: (faction?.keyNpcIds ?? []).map(String),
    notes: faction?.notes ?? "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Faction name is required");
      return;
    }
    setPending(true);
    const payload = { ...form, keyNpcIds: form.keyNpcIds.map(Number), campaignId };
    try {
      const saved = faction
        ? await api.patch<Faction>(`/api/factions/${faction.id}`, payload)
        : await api.post<Faction>("/api/factions", payload);
      toast.success(faction ? "Faction saved" : "Faction created");
      onSaved(saved);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> New Faction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{faction ? "Edit faction" : "New faction"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Relationship with players">
              <Select value={form.relationshipWithPlayers} onValueChange={(v) => set("relationshipWithPlayers", v as typeof form.relationshipWithPlayers)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FACTION_RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
          </Field>
          <Field label="Goals">
            <Textarea value={form.goals} onChange={(e) => set("goals", e.target.value)} rows={2} />
          </Field>
          <Field label="Resources">
            <Textarea value={form.resources} onChange={(e) => set("resources", e.target.value)} rows={2} />
          </Field>
          <Field label="Secrets">
            <Textarea value={form.secrets} onChange={(e) => set("secrets", e.target.value)} rows={2} />
          </Field>
          {npcs.length > 0 ? (
            <Field label="Key NPCs">
              <CheckboxGroup
                columns={2}
                options={npcs.map((n) => ({ value: String(n.id), label: n.name }))}
                value={form.keyNpcIds}
                onChange={(v) => set("keyNpcIds", v)}
              />
            </Field>
          ) : null}
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
