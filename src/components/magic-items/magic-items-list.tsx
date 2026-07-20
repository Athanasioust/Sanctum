"use client";

import { useState } from "react";
import { Plus, Sparkles, Pencil, Trash2, Zap } from "lucide-react";
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
import { rarityClasses } from "@/lib/ui";
import type { MagicItem, Character } from "@/db/schema";

const RARITIES = ["common", "uncommon", "rare", "very rare", "legendary", "artifact"] as const;
const ITEM_TYPES = [
  "armor", "potion", "ring", "rod", "scroll", "staff", "wand", "weapon", "wondrous",
] as const;

type FormState = {
  name: string;
  itemType: string;
  rarity: string;
  description: string;
  requiresAttunement: boolean;
  isAttuned: boolean;
  charges: string;
  chargesMax: string;
  rechargeCondition: string;
  isCursed: boolean;
  characterId: string;
  notes: string;
};

const BLANK: FormState = {
  name: "",
  itemType: "wondrous",
  rarity: "common",
  description: "",
  requiresAttunement: false,
  isAttuned: false,
  charges: "",
  chargesMax: "",
  rechargeCondition: "",
  isCursed: false,
  characterId: "",
  notes: "",
};

function MagicItemDialog({
  campaignId,
  characters,
  initial,
  itemId,
  onSaved,
  trigger,
}: {
  campaignId: number;
  characters: Pick<Character, "id" | "name">[];
  initial?: FormState;
  itemId?: number;
  onSaved: (item: MagicItem) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initial ?? BLANK);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        campaignId,
        name: form.name.trim(),
        itemType: form.itemType,
        rarity: form.rarity,
        description: form.description,
        requiresAttunement: form.requiresAttunement,
        isAttuned: form.isAttuned,
        charges: form.charges !== "" ? parseInt(form.charges, 10) : null,
        chargesMax: form.chargesMax !== "" ? parseInt(form.chargesMax, 10) : null,
        rechargeCondition: form.rechargeCondition,
        isCursed: form.isCursed,
        characterId: form.characterId ? parseInt(form.characterId, 10) : null,
        notes: form.notes,
      };
      const saved: MagicItem = itemId
        ? await api.patch(`/api/magic-items/${itemId}`, payload)
        : await api.post("/api/magic-items", payload);
      onSaved(saved);
      toast.success(itemId ? "Item updated" : "Item created");
      setOpen(false);
      if (!itemId) setForm(BLANK);
    } catch {
      toast.error("Failed to save item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{itemId ? "Edit Magic Item" : "New Magic Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Staff of Fire" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={form.itemType} onValueChange={(v) => set("itemType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Rarity">
              <Select value={form.rarity} onValueChange={(v) => set("rarity", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RARITIES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="What does it do?" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Charges">
              <Input type="number" min={0} value={form.charges} onChange={(e) => set("charges", e.target.value)} placeholder="Current" />
            </Field>
            <Field label="Max Charges">
              <Input type="number" min={0} value={form.chargesMax} onChange={(e) => set("chargesMax", e.target.value)} placeholder="Maximum" />
            </Field>
          </div>
          <Field label="Recharge Condition">
            <Input value={form.rechargeCondition} onChange={(e) => set("rechargeCondition", e.target.value)} placeholder="Regains 1d6+1 charges at dawn" />
          </Field>
          {characters.length > 0 && (
            <Field label="Held By">
              <Select value={form.characterId} onValueChange={(v) => set("characterId", v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {characters.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={form.requiresAttunement} onChange={(e) => set("requiresAttunement", e.target.checked)} className="rounded" />
              Requires Attunement
            </label>
            {form.requiresAttunement && (
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={form.isAttuned} onChange={(e) => set("isAttuned", e.target.checked)} className="rounded" />
                Attuned
              </label>
            )}
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={form.isCursed} onChange={(e) => set("isCursed", e.target.checked)} className="rounded" />
              Cursed
            </label>
          </div>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="DM notes…" />
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

export function MagicItemsList({
  campaignId,
  initialItems,
  characters,
}: {
  campaignId: number;
  initialItems: MagicItem[];
  characters: Pick<Character, "id" | "name">[];
}) {
  const [items, setItems] = useState<MagicItem[]>(initialItems);
  const [search, setSearch] = useState("");

  function upsert(item: MagicItem) {
    setItems((prev) => {
      const exists = prev.some((x) => x.id === item.id);
      return exists ? prev.map((x) => (x.id === item.id ? item : x)) : [item, ...prev];
    });
  }

  async function remove(item: MagicItem) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await api.delete(`/api/magic-items/${item.id}`);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  }

  async function adjustCharge(item: MagicItem, delta: number) {
    if (item.charges === null) return;
    const next = Math.max(0, Math.min(item.charges + delta, item.chargesMax ?? Infinity));
    try {
      const saved: MagicItem = await api.patch(`/api/magic-items/${item.id}`, { charges: next });
      upsert(saved);
    } catch {
      toast.error("Failed to update charges");
    }
  }

  const visible = items.filter(
    (i) => !search || i.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          className="sm:max-w-xs"
        />
        <MagicItemDialog
          campaignId={campaignId}
          characters={characters}
          onSaved={upsert}
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> New Item
            </Button>
          }
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No magic items yet"
          description="Track magic items, charges, and attunement slots."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => {
            const holder = characters.find((c) => c.id === item.characterId);
            return (
              <div key={item.id} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{item.name}</h3>
                    <p className={`text-xs capitalize font-medium ${rarityClasses(item.rarity)}`}>
                      {item.rarity} · {item.itemType}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <MagicItemDialog
                      campaignId={campaignId}
                      characters={characters}
                      initial={{
                        name: item.name,
                        itemType: item.itemType,
                        rarity: item.rarity,
                        description: item.description,
                        requiresAttunement: item.requiresAttunement,
                        isAttuned: item.isAttuned,
                        charges: item.charges !== null ? String(item.charges) : "",
                        chargesMax: item.chargesMax !== null ? String(item.chargesMax) : "",
                        rechargeCondition: item.rechargeCondition,
                        isCursed: item.isCursed,
                        characterId: item.characterId ? String(item.characterId) : "",
                        notes: item.notes,
                      }}
                      itemId={item.id}
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
                      onClick={() => remove(item)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {item.description && (
                  <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {item.requiresAttunement && (
                    <Badge variant="secondary" className={item.isAttuned ? "bg-primary/15 text-primary" : ""}>
                      {item.isAttuned ? "Attuned" : "Needs Attunement"}
                    </Badge>
                  )}
                  {item.isCursed && <Badge variant="destructive">Cursed</Badge>}
                  {holder && <Badge variant="outline">{holder.name}</Badge>}
                </div>

                {item.charges !== null && (
                  <div className="mt-3 flex items-center gap-2">
                    <Zap className="size-3.5 text-amber-400" />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => adjustCharge(item, -1)}
                        className="flex size-6 items-center justify-center rounded border border-border text-sm hover:bg-muted disabled:opacity-40"
                        disabled={item.charges <= 0}
                      >
                        −
                      </button>
                      <span className="min-w-[3ch] text-center text-sm font-medium">
                        {item.charges}{item.chargesMax !== null ? `/${item.chargesMax}` : ""}
                      </span>
                      <button
                        onClick={() => adjustCharge(item, 1)}
                        className="flex size-6 items-center justify-center rounded border border-border text-sm hover:bg-muted disabled:opacity-40"
                        disabled={item.chargesMax !== null && item.charges >= item.chargesMax}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">charges</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
