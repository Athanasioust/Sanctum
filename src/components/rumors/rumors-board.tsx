"use client";

import { useState } from "react";
import { Plus, MessageCircleQuestion, Check, Pencil, Trash2 } from "lucide-react";
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
import type { Rumor, Npc, Location } from "@/db/schema";

type FormState = {
  text: string;
  source: string;
  sourceNpcId: string;
  sourceLocationId: string;
};

const BLANK: FormState = { text: "", source: "", sourceNpcId: "", sourceLocationId: "" };

function RumorDialog({
  campaignId,
  npcs,
  locations,
  initial,
  rumorId,
  onSaved,
  trigger,
}: {
  campaignId: number;
  npcs: Pick<Npc, "id" | "name">[];
  locations: Pick<Location, "id" | "name">[];
  initial?: FormState;
  rumorId?: number;
  onSaved: (r: Rumor) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initial ?? BLANK);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!form.text.trim()) { toast.error("Rumor text is required"); return; }
    setSaving(true);
    try {
      const payload = {
        campaignId,
        text: form.text.trim(),
        source: form.source,
        sourceNpcId: form.sourceNpcId ? parseInt(form.sourceNpcId, 10) : null,
        sourceLocationId: form.sourceLocationId ? parseInt(form.sourceLocationId, 10) : null,
      };
      const saved: Rumor = rumorId
        ? await api.patch(`/api/rumors/${rumorId}`, payload)
        : await api.post("/api/rumors", payload);
      onSaved(saved);
      toast.success(rumorId ? "Rumor updated" : "Rumor added");
      setOpen(false);
      if (!rumorId) setForm(BLANK);
    } catch {
      toast.error("Failed to save rumor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{rumorId ? "Edit Rumor" : "New Rumor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Rumor" required>
            <Textarea
              value={form.text}
              onChange={(e) => set("text", e.target.value)}
              rows={3}
              placeholder="They say the mayor disappears every full moon…"
            />
          </Field>
          <Field label="Source (free text)">
            <Input value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="Overheard at the tavern" />
          </Field>
          {npcs.length > 0 && (
            <Field label="Source NPC">
              <Select value={form.sourceNpcId} onValueChange={(v) => set("sourceNpcId", v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {npcs.map((n) => <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
          {locations.length > 0 && (
            <Field label="Source Location">
              <Select value={form.sourceLocationId} onValueChange={(v) => set("sourceLocationId", v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RumorsBoard({
  campaignId,
  initialRumors,
  npcs,
  locations,
}: {
  campaignId: number;
  initialRumors: Rumor[];
  npcs: Pick<Npc, "id" | "name">[];
  locations: Pick<Location, "id" | "name">[];
}) {
  const [rumors, setRumors] = useState<Rumor[]>(initialRumors);
  const [hideFollowedUp, setHideFollowedUp] = useState(false);

  function upsert(r: Rumor) {
    setRumors((prev) => {
      const exists = prev.some((x) => x.id === r.id);
      return exists ? prev.map((x) => (x.id === r.id ? r : x)) : [r, ...prev];
    });
  }

  async function toggleFollowedUp(rumor: Rumor) {
    try {
      const saved: Rumor = await api.patch(`/api/rumors/${rumor.id}`, {
        isFollowedUp: !rumor.isFollowedUp,
      });
      upsert(saved);
    } catch {
      toast.error("Failed to update rumor");
    }
  }

  async function remove(rumor: Rumor) {
    if (!confirm("Delete this rumor?")) return;
    try {
      await api.delete(`/api/rumors/${rumor.id}`);
      setRumors((prev) => prev.filter((x) => x.id !== rumor.id));
      toast.success("Rumor deleted");
    } catch {
      toast.error("Failed to delete rumor");
    }
  }

  const visible = rumors.filter((r) => !hideFollowedUp || !r.isFollowedUp);

  const npcMap = Object.fromEntries(npcs.map((n) => [n.id, n.name]));
  const locationMap = Object.fromEntries(locations.map((l) => [l.id, l.name]));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={hideFollowedUp}
            onChange={(e) => setHideFollowedUp(e.target.checked)}
            className="rounded"
          />
          Hide followed-up
        </label>
        <RumorDialog
          campaignId={campaignId}
          npcs={npcs}
          locations={locations}
          onSaved={upsert}
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> Add Rumor
            </Button>
          }
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={MessageCircleQuestion}
          title="No rumors yet"
          description="Track rumors and gossip the party hears — mark them as followed up once investigated."
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((rumor) => {
            const sourceNpc = rumor.sourceNpcId ? npcMap[rumor.sourceNpcId] : null;
            const sourceLoc = rumor.sourceLocationId ? locationMap[rumor.sourceLocationId] : null;
            return (
              <li
                key={rumor.id}
                className={`rounded-xl border bg-card p-4 transition-colors ${
                  rumor.isFollowedUp ? "border-border opacity-60" : "border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleFollowedUp(rumor)}
                    title={rumor.isFollowedUp ? "Mark as open" : "Mark as followed up"}
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      rumor.isFollowedUp
                        ? "border-green-500 bg-green-500/20 text-green-400"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {rumor.isFollowedUp && <Check className="size-3" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${rumor.isFollowedUp ? "line-through text-muted-foreground" : ""}`}>
                      {rumor.text}
                    </p>
                    {(rumor.source || sourceNpc || sourceLoc) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Source:{" "}
                        {[rumor.source, sourceNpc && `NPC: ${sourceNpc}`, sourceLoc && `Location: ${sourceLoc}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {rumor.isFollowedUp && (
                      <Badge className="mt-1 bg-green-500/15 text-green-400 border-green-500/20 text-xs">
                        Followed up
                      </Badge>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <RumorDialog
                      campaignId={campaignId}
                      npcs={npcs}
                      locations={locations}
                      initial={{
                        text: rumor.text,
                        source: rumor.source,
                        sourceNpcId: rumor.sourceNpcId ? String(rumor.sourceNpcId) : "",
                        sourceLocationId: rumor.sourceLocationId ? String(rumor.sourceLocationId) : "",
                      }}
                      rumorId={rumor.id}
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
                      onClick={() => remove(rumor)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
