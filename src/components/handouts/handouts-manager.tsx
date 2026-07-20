"use client";

import { useState } from "react";
import { Plus, Eye, EyeOff, Pencil, Trash2, Image, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { renderMarkdown } from "@/lib/markdown";
import type { Handout } from "@/db/schema";

type FormState = {
  title: string;
  content: string;
  imageUrl: string;
  isRevealed: boolean;
};

const BLANK: FormState = { title: "", content: "", imageUrl: "", isRevealed: false };

function HandoutDialog({
  campaignId,
  initial,
  handoutId,
  onSaved,
  trigger,
}: {
  campaignId: number;
  initial?: FormState;
  handoutId?: number;
  onSaved: (h: Handout) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initial ?? BLANK);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        campaignId,
        title: form.title.trim(),
        content: form.content,
        imageUrl: form.imageUrl || null,
        isRevealed: form.isRevealed,
      };
      const saved: Handout = handoutId
        ? await api.patch(`/api/handouts/${handoutId}`, payload)
        : await api.post("/api/handouts", payload);
      onSaved(saved);
      toast.success(handoutId ? "Handout updated" : "Handout created");
      setOpen(false);
      if (!handoutId) setForm(BLANK);
    } catch {
      toast.error("Failed to save handout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{handoutId ? "Edit Handout" : "New Handout"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Letter from the King" />
          </Field>
          <Field label="Image URL">
            <Input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Content (Markdown supported)">
            <div className="flex justify-end mb-1">
              <button
                type="button"
                onClick={() => setPreview((v) => !v)}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                {preview ? "Edit" : "Preview"}
              </button>
            </div>
            {preview ? (
              <div
                className="prose prose-invert prose-sm min-h-[150px] rounded-md border border-border bg-muted/30 p-3 text-sm"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }}
              />
            ) : (
              <Textarea
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                rows={8}
                placeholder="You unfurl the scroll and read…"
                className="font-mono text-sm"
              />
            )}
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isRevealed} onChange={(e) => set("isRevealed", e.target.checked)} className="rounded" />
            Revealed to players
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HandoutCard({
  handout,
  campaignId,
  onUpdated,
  onDeleted,
}: {
  handout: Handout;
  campaignId: number;
  onUpdated: (h: Handout) => void;
  onDeleted: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  async function toggleReveal() {
    try {
      const saved: Handout = await api.patch(`/api/handouts/${handout.id}`, {
        isRevealed: !handout.isRevealed,
      });
      onUpdated(saved);
      toast.success(saved.isRevealed ? "Revealed to players" : "Hidden from players");
    } catch {
      toast.error("Failed to update handout");
    }
  }

  async function remove() {
    if (!confirm(`Delete "${handout.title}"?`)) return;
    try {
      await api.delete(`/api/handouts/${handout.id}`);
      onDeleted(handout.id);
      toast.success("Handout deleted");
    } catch {
      toast.error("Failed to delete handout");
    }
  }

  return (
    <div className={`rounded-xl border bg-card transition-colors ${handout.isRevealed ? "border-primary/30" : "border-border"}`}>
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{handout.title}</h3>
            {handout.isRevealed ? (
              <Badge className="bg-primary/15 text-primary border-primary/20">Revealed</Badge>
            ) : (
              <Badge variant="secondary">Hidden</Badge>
            )}
          </div>
          {handout.imageUrl && (
            <p className="mt-1 text-xs text-muted-foreground truncate">Image attached</p>
          )}
          {handout.content && !expanded && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{handout.content.slice(0, 200)}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={toggleReveal}
            title={handout.isRevealed ? "Hide from players" : "Reveal to players"}
          >
            {handout.isRevealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
          <HandoutDialog
            campaignId={campaignId}
            initial={{ title: handout.title, content: handout.content, imageUrl: handout.imageUrl ?? "", isRevealed: handout.isRevealed }}
            handoutId={handout.id}
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
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-4">
          {handout.imageUrl && (
            <img
              src={handout.imageUrl}
              alt={handout.title}
              className="mb-4 max-h-80 w-full rounded-lg object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          )}
          {handout.content && (
            <div
              className="prose prose-invert prose-sm text-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(handout.content) }}
            />
          )}
        </div>
      )}

      {(handout.content || handout.imageUrl) && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full rounded-b-xl border-t border-border py-2 text-center text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      )}
    </div>
  );
}

export function HandoutsManager({
  campaignId,
  initialHandouts,
}: {
  campaignId: number;
  initialHandouts: Handout[];
}) {
  const [handouts, setHandouts] = useState<Handout[]>(initialHandouts);
  const [showRevealedOnly, setShowRevealedOnly] = useState(false);

  function upsert(h: Handout) {
    setHandouts((prev) => {
      const exists = prev.some((x) => x.id === h.id);
      return exists ? prev.map((x) => (x.id === h.id ? h : x)) : [h, ...prev];
    });
  }

  const visible = handouts.filter((h) => !showRevealedOnly || h.isRevealed);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showRevealedOnly}
            onChange={(e) => setShowRevealedOnly(e.target.checked)}
            className="rounded"
          />
          Show revealed only
        </label>
        <HandoutDialog
          campaignId={campaignId}
          onSaved={upsert}
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> New Handout
            </Button>
          }
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Image}
          title="No handouts yet"
          description="Create player-facing handouts — notes, letters, maps, lore excerpts."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((h) => (
            <HandoutCard
              key={h.id}
              handout={h}
              campaignId={campaignId}
              onUpdated={upsert}
              onDeleted={(id) => setHandouts((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
