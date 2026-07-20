"use client";

import Link from "next/link";
import { useState } from "react";
import { Network, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form";
import { api } from "@/lib/client";
import type { NpcRelationship, Npc } from "@/db/schema";

const RELATIONSHIP_TYPES = [
  "ally", "enemy", "rival", "mentor", "student", "family",
  "lover", "employer", "employee", "neutral", "informant", "other",
] as const;

const EDGE_COLORS: Record<string, string> = {
  ally: "#22c55e", enemy: "#ef4444", rival: "#f97316", family: "#a855f7",
  lover: "#ec4899", mentor: "#3b82f6", student: "#06b6d4", employer: "#eab308",
  employee: "#84cc16", informant: "#8b5cf6", neutral: "#6b7280", other: "#6b7280",
};

type FormState = {
  targetNpcId: string;
  relationshipType: string;
  description: string;
};

const BLANK: FormState = { targetNpcId: "", relationshipType: "ally", description: "" };

function AddRelationshipDialog({
  campaignId,
  sourceNpcId,
  npcs,
  onSaved,
}: {
  campaignId: number;
  sourceNpcId: number;
  npcs: Pick<Npc, "id" | "name">[];
  onSaved: (r: NpcRelationship) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!form.targetNpcId) { toast.error("Target NPC is required"); return; }
    if (Number(form.targetNpcId) === sourceNpcId) { toast.error("Source and target must differ"); return; }
    setSaving(true);
    try {
      const saved: NpcRelationship = await api.post("/api/npc-relationships", {
        campaignId,
        sourceNpcId,
        targetNpcId: parseInt(form.targetNpcId, 10),
        relationshipType: form.relationshipType,
        description: form.description,
      });
      onSaved(saved);
      toast.success("Relationship added");
      setOpen(false);
      setForm(BLANK);
    } catch {
      toast.error("Failed to save relationship");
    } finally {
      setSaving(false);
    }
  }

  const others = npcs.filter((n) => n.id !== sourceNpcId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="size-4" /> Add Relationship
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Relationship Type">
            <Select value={form.relationshipType} onValueChange={(v) => set("relationshipType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="With NPC" required>
            <Select value={form.targetNpcId} onValueChange={(v) => set("targetNpcId", v)}>
              <SelectTrigger><SelectValue placeholder="Select NPC" /></SelectTrigger>
              <SelectContent>
                {others.map((n) => <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief description" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NpcRelationshipsSection({
  npcId,
  campaignId,
  npcs,
  initialRelationships,
}: {
  npcId: number;
  campaignId: number;
  npcs: Pick<Npc, "id" | "name">[];
  initialRelationships: NpcRelationship[];
}) {
  const [relationships, setRelationships] = useState<NpcRelationship[]>(initialRelationships);

  const npcMap = Object.fromEntries(npcs.map((n) => [n.id, n.name]));

  async function remove(rel: NpcRelationship) {
    if (!confirm("Delete this relationship?")) return;
    try {
      await api.delete(`/api/npc-relationships/${rel.id}`);
      setRelationships((prev) => prev.filter((x) => x.id !== rel.id));
      toast.success("Relationship removed");
    } catch {
      toast.error("Failed to delete relationship");
    }
  }

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading font-semibold">
          <Network className="size-4 text-primary" /> Relationships
        </h2>
        <div className="flex items-center gap-2">
          <AddRelationshipDialog
            campaignId={campaignId}
            sourceNpcId={npcId}
            npcs={npcs}
            onSaved={(r) => setRelationships((prev) => [...prev, r])}
          />
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/campaign/${campaignId}/relations`}>View all →</Link>
          </Button>
        </div>
      </div>

      {relationships.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          No relationships recorded for this NPC.
        </p>
      ) : (
        <ul className="space-y-2">
          {relationships.map((rel) => {
            const isSource = rel.sourceNpcId === npcId;
            const otherId = isSource ? rel.targetNpcId : rel.sourceNpcId;
            const otherName = npcMap[otherId] ?? `NPC #${otherId}`;
            const color = EDGE_COLORS[rel.relationshipType] ?? EDGE_COLORS.other;
            return (
              <li key={rel.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold capitalize" style={{ color }}>{rel.relationshipType}</span>
                    {" of "}
                    <Link
                      href={`/campaign/${campaignId}/npcs/${otherId}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {otherName}
                    </Link>
                  </p>
                  {rel.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{rel.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                  onClick={() => remove(rel)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
