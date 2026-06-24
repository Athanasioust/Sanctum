"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api } from "@/lib/client";
import { ITEM_RARITIES } from "@/lib/constants";
import { rarityClasses } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { ShopItem } from "@/db/schema";

export function ShopItemsManager({
  shopId,
  initialItems,
}: {
  shopId: number;
  initialItems: ShopItem[];
}) {
  const [items, setItems] = useState(initialItems);

  function upsert(item: ShopItem) {
    setItems((prev) =>
      prev.some((i) => i.id === item.id) ? prev.map((i) => (i.id === item.id ? item : i)) : [...prev, item],
    );
  }

  async function remove(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await api.delete(`/api/shop-items/${id}`);
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Inventory</h2>
        <ItemDialog shopId={shopId} onSaved={upsert} />
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Package} title="No items" description="Add wares for this shop with prices, quantities and rarity." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rarity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    {item.description ? <p className="text-xs text-muted-foreground">{item.description}</p> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.itemType || "—"}</TableCell>
                  <TableCell className={cn("capitalize", rarityClasses(item.rarity))}>{item.rarity}</TableCell>
                  <TableCell className="text-right">{item.price || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <ItemDialog shopId={shopId} item={item} onSaved={upsert} trigger={
                        <Button size="icon" variant="ghost" className="size-8"><Pencil className="size-4" /></Button>
                      } />
                      <DeleteItem onConfirm={() => remove(item.id)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function DeleteItem({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" />
      </Button>
      <ConfirmDialog open={open} onOpenChange={setOpen} title="Remove this item?" onConfirm={onConfirm} />
    </>
  );
}

function ItemDialog({
  shopId,
  item,
  onSaved,
  trigger,
}: {
  shopId: number;
  item?: ShopItem;
  onSaved: (i: ShopItem) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    price: item?.price ?? "",
    quantity: item?.quantity ?? 1,
    itemType: item?.itemType ?? "",
    rarity: item?.rarity ?? "common",
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
      const saved = item
        ? await api.patch<ShopItem>(`/api/shop-items/${item.id}`, form)
        : await api.post<ShopItem>("/api/shop-items", { ...form, shopId });
      toast.success("Item saved");
      onSaved(saved);
      setOpen(false);
      if (!item) setForm({ name: "", description: "", price: "", quantity: 1, itemType: "", rarity: "common" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="size-4" /> Add Item</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Input value={form.itemType} onChange={(e) => set("itemType", e.target.value)} placeholder="Weapon, potion…" />
            </Field>
            <Field label="Rarity">
              <Select value={form.rarity} onValueChange={(v) => set("rarity", v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ITEM_RARITIES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Price">
              <Input value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="50 gp" />
            </Field>
            <Field label="Quantity">
              <Input type="number" min={0} value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value || 0))} />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
