"use client";

import { useState } from "react";
import { Plus, CheckCircle2, Clock, XCircle, PauseCircle, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ListTodo } from "lucide-react";
import type { Quest } from "@/db/schema";
import type { SubObjective } from "@/db/schema";

const STATUS_CONFIG = {
  active: { label: "Active", icon: Clock, class: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  "on-hold": { label: "On Hold", icon: PauseCircle, class: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  completed: { label: "Completed", icon: CheckCircle2, class: "bg-green-500/15 text-green-400 border-green-500/20" },
  failed: { label: "Failed", icon: XCircle, class: "bg-red-500/15 text-red-400 border-red-500/20" },
} as const;

type QuestStatus = keyof typeof STATUS_CONFIG;

function StatusBadge({ status }: { status: QuestStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.class}`}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

type QuestFormState = {
  title: string;
  description: string;
  status: QuestStatus;
  reward: string;
  notes: string;
};

const BLANK: QuestFormState = {
  title: "",
  description: "",
  status: "active",
  reward: "",
  notes: "",
};

function QuestDialog({
  campaignId,
  initial,
  questId,
  onSaved,
  trigger,
}: {
  campaignId: number;
  initial?: QuestFormState;
  questId?: number;
  onSaved: (q: Quest) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<QuestFormState>(initial ?? BLANK);
  const [saving, setSaving] = useState(false);

  function set(key: keyof QuestFormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        campaignId,
        title: form.title.trim(),
        description: form.description,
        status: form.status,
        reward: form.reward,
        notes: form.notes,
        subObjectives: [],
        linkedNpcIds: [],
        linkedLocationIds: [],
      };
      const saved: Quest = questId
        ? await api.patch(`/api/quests/${questId}`, payload)
        : await api.post("/api/quests", payload);
      onSaved(saved);
      toast.success(questId ? "Quest updated" : "Quest created");
      setOpen(false);
      if (!questId) setForm(BLANK);
    } catch {
      toast.error("Failed to save quest");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{questId ? "Edit Quest" : "New Quest"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Retrieve the stolen artifact" />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Quest details…" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v as QuestStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Reward">
            <Input value={form.reward} onChange={(e) => set("reward", e.target.value)} placeholder="500 gp, magic ring…" />
          </Field>
          <Field label="DM Notes">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Private notes…" />
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

function QuestCard({
  quest,
  campaignId,
  onUpdated,
  onDeleted,
}: {
  quest: Quest;
  campaignId: number;
  onUpdated: (q: Quest) => void;
  onDeleted: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const subObjectives = (quest.subObjectives ?? []) as SubObjective[];

  async function toggleSubObjective(index: number) {
    const updated = subObjectives.map((s, i) =>
      i === index ? { ...s, checked: !s.checked } : s,
    );
    try {
      const saved: Quest = await api.patch(`/api/quests/${quest.id}`, { subObjectives: updated });
      onUpdated(saved);
    } catch {
      toast.error("Failed to update objective");
    }
  }

  async function remove() {
    if (!confirm(`Delete quest "${quest.title}"?`)) return;
    try {
      await api.delete(`/api/quests/${quest.id}`);
      onDeleted(quest.id);
      toast.success("Quest deleted");
    } catch {
      toast.error("Failed to delete quest");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{quest.title}</h3>
            <StatusBadge status={quest.status as QuestStatus} />
          </div>
          {quest.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{quest.description}</p>
          )}
          {quest.reward && (
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Reward:</span> {quest.reward}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <QuestDialog
            campaignId={campaignId}
            initial={{ title: quest.title, description: quest.description, status: quest.status as QuestStatus, reward: quest.reward, notes: quest.notes }}
            questId={quest.id}
            onSaved={onUpdated}
            trigger={
              <Button variant="ghost" size="icon" className="size-8">
                <Pencil className="size-3.5" />
              </Button>
            }
          />
          <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={remove}>
            <Trash2 className="size-3.5" />
          </Button>
          {subObjectives.length > 0 && (
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setExpanded((v) => !v)}>
              {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          )}
        </div>
      </div>
      {expanded && subObjectives.length > 0 && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Objectives</p>
          <ul className="space-y-1.5">
            {subObjectives.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <button
                  onClick={() => toggleSubObjective(i)}
                  className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    s.checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  {s.checked && <CheckCircle2 className="size-3" />}
                </button>
                <span className={`text-sm ${s.checked ? "line-through text-muted-foreground" : ""}`}>
                  {s.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const STATUS_ORDER: QuestStatus[] = ["active", "on-hold", "completed", "failed"];

export function QuestsBoard({
  campaignId,
  initialQuests,
}: {
  campaignId: number;
  initialQuests: Quest[];
}) {
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [filter, setFilter] = useState<QuestStatus | "all">("all");

  function upsert(q: Quest) {
    setQuests((prev) => {
      const exists = prev.some((x) => x.id === q.id);
      return exists ? prev.map((x) => (x.id === q.id ? q : x)) : [q, ...prev];
    });
  }

  const visible = quests
    .filter((q) => filter === "all" || q.status === filter)
    .sort((a, b) => STATUS_ORDER.indexOf(a.status as QuestStatus) - STATUS_ORDER.indexOf(b.status as QuestStatus));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUS_ORDER] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <QuestDialog
          campaignId={campaignId}
          onSaved={upsert}
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> New Quest
            </Button>
          }
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No quests yet"
          description="Track your party's quests and objectives here."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              campaignId={campaignId}
              onUpdated={upsert}
              onDeleted={(id) => setQuests((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
