"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Backpack, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { api } from "@/lib/client";
import type { InventoryItem } from "@/db/schema";

type OwnerType = "character" | "npc";

export function InventoryTab({
  ownerId,
  ownerType,
}: {
  ownerId: number;
  ownerType: OwnerType;
}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await api.get<InventoryItem[]>(
      `/api/inventory?ownerId=${ownerId}&ownerType=${ownerType}`,
    );
    setItems(data);
    setLoading(false);
  }, [ownerId, ownerType]);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  async function toggleEquipped(item: InventoryItem) {
    const isEquipped = !item.isEquipped;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isEquipped } : i)));
    try {
      await api.patch(`/api/inventory/${item.id}`, { isEquipped });
    } catch {
      toast.error("Failed to update item");
      load();
    }
  }

  async function remove(id: number) {
    try {
      await api.delete(`/api/inventory/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    }
  }

  const totalWeight = items.reduce((sum, i) => sum + i.weight * i.quantity, 0);

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading inventory…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total weight:{" "}
          <span className="font-medium text-foreground">{totalWeight.toFixed(1)} lb</span>
        </p>
        <ItemDialog ownerId={ownerId} ownerType={ownerType} onSaved={load} />
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Backpack} title="No items" description="Track equipment, treasure and consumables here." />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    {item.quantity !== 1 ? <Badge variant="secondary">×{item.quantity}</Badge> : null}
                    {item.isEquipped ? <Badge className="bg-primary/20 text-primary">Equipped</Badge> : null}
                  </div>
                  {item.description ? (
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                  {item.weight > 0 ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.weight} lb each</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                    <Checkbox checked={item.isEquipped} onCheckedChange={() => toggleEquipped(item)} />
                    Equip
                  </label>
                  <ItemDialog ownerId={ownerId} ownerType={ownerType} onSaved={load} item={item} trigger={
                    <Button size="icon" variant="ghost" className="size-8" aria-label="Edit item"><Pencil className="size-4" /></Button>
                  } />
                  <DeleteIconButton label="item" onConfirm={() => remove(item.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemDialog({
  ownerId,
  ownerType,
  onSaved,
  item,
  trigger,
}: {
  ownerId: number;
  ownerType: OwnerType;
  onSaved: () => void;
  item?: InventoryItem;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: item?.name ?? "",
    quantity: item?.quantity ?? 1,
    weight: item?.weight ?? 0,
    description: item?.description ?? "",
    isEquipped: item?.isEquipped ?? false,
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    setPending(true);
    try {
      if (item) await api.patch(`/api/inventory/${item.id}`, form);
      else await api.post("/api/inventory", { ...form, ownerId, ownerType });
      toast.success("Item saved");
      setOpen(false);
      onSaved();
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
          <Button size="sm">
            <Plus className="size-4" /> Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <Input type="number" min={0} value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value || 0))} />
            </Field>
            <Field label="Weight (lb each)">
              <Input type="number" min={0} step="0.1" value={form.weight} onChange={(e) => set("weight", Number(e.target.value || 0))} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.isEquipped} onCheckedChange={(c) => set("isEquipped", c === true)} />
            Equipped
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
