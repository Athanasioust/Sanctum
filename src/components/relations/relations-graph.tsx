"use client";

import { useState, useMemo } from "react";
import { Plus, Network, Pencil, Trash2, X } from "lucide-react";
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
import { EmptyState } from "@/components/shared/empty-state";
import { api } from "@/lib/client";
import type { NpcRelationship, Npc } from "@/db/schema";

const RELATIONSHIP_TYPES = [
  "ally",
  "enemy",
  "rival",
  "mentor",
  "student",
  "family",
  "lover",
  "employer",
  "employee",
  "neutral",
  "informant",
  "other",
] as const;

const EDGE_COLORS: Record<string, string> = {
  ally: "#22c55e",
  enemy: "#ef4444",
  rival: "#f97316",
  family: "#a855f7",
  lover: "#ec4899",
  mentor: "#3b82f6",
  student: "#06b6d4",
  employer: "#eab308",
  employee: "#84cc16",
  informant: "#8b5cf6",
  neutral: "#6b7280",
  other: "#6b7280",
};

type FormState = {
  sourceNpcId: string;
  targetNpcId: string;
  relationshipType: string;
  description: string;
};

const BLANK: FormState = { sourceNpcId: "", targetNpcId: "", relationshipType: "ally", description: "" };

function RelationshipDialog({
  campaignId,
  npcs,
  initial,
  relId,
  onSaved,
  trigger,
}: {
  campaignId: number;
  npcs: Pick<Npc, "id" | "name">[];
  initial?: FormState;
  relId?: number;
  onSaved: (r: NpcRelationship) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initial ?? BLANK);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!form.sourceNpcId || !form.targetNpcId) { toast.error("Both NPCs are required"); return; }
    if (form.sourceNpcId === form.targetNpcId) { toast.error("Source and target must differ"); return; }
    setSaving(true);
    try {
      const payload = {
        campaignId,
        sourceNpcId: parseInt(form.sourceNpcId, 10),
        targetNpcId: parseInt(form.targetNpcId, 10),
        relationshipType: form.relationshipType,
        description: form.description,
      };
      const saved: NpcRelationship = relId
        ? await api.patch(`/api/npc-relationships/${relId}`, payload)
        : await api.post("/api/npc-relationships", payload);
      onSaved(saved);
      toast.success(relId ? "Relationship updated" : "Relationship added");
      setOpen(false);
      if (!relId) setForm(BLANK);
    } catch {
      toast.error("Failed to save relationship");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{relId ? "Edit Relationship" : "Add Relationship"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Source NPC" required>
            <Select value={form.sourceNpcId} onValueChange={(v) => set("sourceNpcId", v)}>
              <SelectTrigger><SelectValue placeholder="Select NPC" /></SelectTrigger>
              <SelectContent>
                {npcs.map((n) => <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Relationship Type">
            <Select value={form.relationshipType} onValueChange={(v) => set("relationshipType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Target NPC" required>
            <Select value={form.targetNpcId} onValueChange={(v) => set("targetNpcId", v)}>
              <SelectTrigger><SelectValue placeholder="Select NPC" /></SelectTrigger>
              <SelectContent>
                {npcs.map((n) => <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief description of the relationship" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type NodeData = {
  id: number;
  name: string;
  x: number;
  y: number;
};

function RelationGraph({
  npcs,
  relationships,
}: {
  npcs: Pick<Npc, "id" | "name">[];
  relationships: NpcRelationship[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const W = 700;
  const H = 500;
  const CX = W / 2;
  const CY = H / 2;
  const R = 180;

  // Only include NPCs that appear in at least one relationship
  const involvedIds = useMemo(() => {
    const ids = new Set<number>();
    for (const rel of relationships) {
      ids.add(rel.sourceNpcId);
      ids.add(rel.targetNpcId);
    }
    return ids;
  }, [relationships]);

  const nodes: NodeData[] = useMemo(() => {
    const visible = npcs.filter((n) => involvedIds.has(n.id));
    if (visible.length === 0) return [];
    return visible.map((npc, i) => {
      const angle = (2 * Math.PI * i) / visible.length - Math.PI / 2;
      return {
        id: npc.id,
        name: npc.name,
        x: CX + R * Math.cos(angle),
        y: CY + R * Math.sin(angle),
      };
    });
  }, [npcs, involvedIds]);

  const nodeMap = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  if (nodes.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        Add relationships to see the graph.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-2xl rounded-xl border border-border bg-card/50"
        style={{ minWidth: 320 }}
      >
        {/* Edges */}
        {relationships.map((rel) => {
          const src = nodeMap[rel.sourceNpcId];
          const tgt = nodeMap[rel.targetNpcId];
          if (!src || !tgt) return null;
          const color = EDGE_COLORS[rel.relationshipType] ?? EDGE_COLORS.other;
          const isHighlighted = hovered === rel.sourceNpcId || hovered === rel.targetNpcId;
          const mx = (src.x + tgt.x) / 2;
          const my = (src.y + tgt.y) / 2;
          return (
            <g key={rel.id}>
              <line
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={color}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
                strokeOpacity={isHighlighted ? 0.9 : 0.45}
              />
              <text
                x={mx}
                y={my - 4}
                textAnchor="middle"
                fontSize={9}
                fill={color}
                fillOpacity={isHighlighted ? 0.9 : 0.55}
                className="pointer-events-none capitalize"
              >
                {rel.relationshipType}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isHighlighted = hovered === node.id;
          return (
            <g
              key={node.id}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={isHighlighted ? 22 : 18}
                fill={isHighlighted ? "hsl(var(--primary))" : "hsl(var(--card))"}
                stroke={isHighlighted ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth={2}
                className="transition-all"
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fontSize={isHighlighted ? 11 : 10}
                fill="hsl(var(--foreground))"
                className="pointer-events-none select-none font-medium"
              >
                {node.name.length > 10 ? node.name.slice(0, 10) + "…" : node.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function RelationsGraph({
  campaignId,
  initialRelationships,
  npcs,
}: {
  campaignId: number;
  initialRelationships: NpcRelationship[];
  npcs: Pick<Npc, "id" | "name">[];
}) {
  const [relationships, setRelationships] = useState<NpcRelationship[]>(initialRelationships);
  const [view, setView] = useState<"graph" | "list">("graph");

  function upsert(r: NpcRelationship) {
    setRelationships((prev) => {
      const exists = prev.some((x) => x.id === r.id);
      return exists ? prev.map((x) => (x.id === r.id ? r : x)) : [r, ...prev];
    });
  }

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

  const npcMap = Object.fromEntries(npcs.map((n) => [n.id, n.name]));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setView("graph")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              view === "graph"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            }`}
          >
            Graph
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              view === "list"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            }`}
          >
            List
          </button>
        </div>
        <RelationshipDialog
          campaignId={campaignId}
          npcs={npcs}
          onSaved={upsert}
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> Add Relationship
            </Button>
          }
        />
      </div>

      {relationships.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No relationships yet"
          description="Map the connections between NPCs — allies, enemies, family, informants."
        />
      ) : view === "graph" ? (
        <RelationGraph npcs={npcs} relationships={relationships} />
      ) : (
        <ul className="space-y-2">
          {relationships.map((rel) => (
            <li key={rel.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  <span className="text-foreground">{npcMap[rel.sourceNpcId] ?? `NPC #${rel.sourceNpcId}`}</span>
                  <span className="mx-2 text-muted-foreground">→</span>
                  <span
                    className="capitalize font-semibold"
                    style={{ color: EDGE_COLORS[rel.relationshipType] ?? EDGE_COLORS.other }}
                  >
                    {rel.relationshipType}
                  </span>
                  <span className="mx-2 text-muted-foreground">→</span>
                  <span className="text-foreground">{npcMap[rel.targetNpcId] ?? `NPC #${rel.targetNpcId}`}</span>
                </p>
                {rel.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{rel.description}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <RelationshipDialog
                  campaignId={campaignId}
                  npcs={npcs}
                  initial={{
                    sourceNpcId: String(rel.sourceNpcId),
                    targetNpcId: String(rel.targetNpcId),
                    relationshipType: rel.relationshipType,
                    description: rel.description,
                  }}
                  relId={rel.id}
                  onSaved={upsert}
                  trigger={
                    <Button variant="ghost" size="icon" className="size-7">
                      <Pencil className="size-3.5" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                  onClick={() => remove(rel)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
