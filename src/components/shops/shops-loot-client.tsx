"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Store, Dices, Trash2, User, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { EntityActions } from "@/components/shared/entity-actions";
import { api } from "@/lib/client";
import { weightedPick } from "@/lib/dnd";
import type { Shop, RollTable, RollTableEntry } from "@/db/schema";

type Option = { id: number; name: string };

export function ShopsLootClient({
  campaignId,
  initialShops,
  initialRollTables,
  locations,
  npcs,
}: {
  campaignId: number;
  initialShops: Shop[];
  initialRollTables: RollTable[];
  locations: Option[];
  npcs: Option[];
}) {
  const [shops, setShops] = useState(initialShops);
  const [tables, setTables] = useState(initialRollTables);

  return (
    <Tabs defaultValue="shops">
      <TabsList className="mb-5">
        <TabsTrigger value="shops">
          <Store className="size-4" /> Shops
        </TabsTrigger>
        <TabsTrigger value="tables">
          <Dices className="size-4" /> Roll Tables
        </TabsTrigger>
      </TabsList>

      <TabsContent value="shops">
        <div className="mb-4 flex justify-end">
          <ShopDialog campaignId={campaignId} locations={locations} npcs={npcs} onSaved={(s) => setShops((p) => [...p, s])} />
        </div>
        {shops.length === 0 ? (
          <EmptyState icon={Store} title="No shops yet" description="Create shops and stock them with goods, loot and curiosities." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <div key={shop.id} className="group relative rounded-xl border border-border bg-card transition-colors hover:border-primary/50">
                <Link href={`/campaign/${campaignId}/shops/${shop.id}`} className="block p-5">
                  <h3 className="font-heading text-lg font-semibold">{shop.name}</h3>
                  {shop.description ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{shop.description}</p> : null}
                  <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
                    {shop.ownerNpcId ? (
                      <span className="flex items-center gap-1"><User className="size-3.5" /> {npcs.find((n) => n.id === shop.ownerNpcId)?.name ?? "Owner"}</span>
                    ) : null}
                    {shop.locationId ? (
                      <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {locations.find((l) => l.id === shop.locationId)?.name ?? "Location"}</span>
                    ) : null}
                  </div>
                </Link>
                <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <EntityActions deleteEndpoint={`/api/shops/${shop.id}`} entityLabel="Shop" />
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="tables">
        <div className="mb-4 flex justify-end">
          <RollTableDialog campaignId={campaignId} onSaved={(t) => setTables((p) => [...p, t])} />
        </div>
        {tables.length === 0 ? (
          <EmptyState icon={Dices} title="No roll tables" description="Build weighted random tables for loot, encounters, rumours and more." />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {tables.map((table) => (
              <RollTableCard
                key={table.id}
                table={table}
                campaignId={campaignId}
                onUpdated={(t) => setTables((p) => p.map((x) => (x.id === t.id ? t : x)))}
                onDeleted={(id) => setTables((p) => p.filter((x) => x.id !== id))}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function RollTableCard({
  table,
  campaignId,
  onUpdated,
  onDeleted,
}: {
  table: RollTable;
  campaignId: number;
  onUpdated: (t: RollTable) => void;
  onDeleted: (id: number) => void;
}) {
  const [result, setResult] = useState<string | null>(null);

  function roll() {
    if (table.entries.length === 0) {
      toast.error("Add entries first");
      return;
    }
    const idx = weightedPick(table.entries.map((e) => e.weight));
    setResult(table.entries[idx].result);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold">{table.name}</h3>
          {table.description ? <p className="text-sm text-muted-foreground">{table.description}</p> : null}
        </div>
        <div className="flex items-center gap-1">
          <RollTableDialog campaignId={campaignId} table={table} onSaved={onUpdated} trigger={<Button size="sm" variant="outline">Edit</Button>} />
          <EntityActions deleteEndpoint={`/api/roll-tables/${table.id}`} entityLabel="Roll table" redirectTo={undefined} />
        </div>
      </div>

      <div className="mt-3">
        <Button onClick={roll} className="w-full">
          <Dices className="size-4" /> Roll
        </Button>
        {result ? (
          <div className="mt-3 rounded-lg border border-primary/40 bg-primary/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Result</p>
            <p className="font-medium">{result}</p>
          </div>
        ) : null}
      </div>

      {table.entries.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {table.entries.map((e, i) => (
            <li key={i} className="flex items-center justify-between">
              <span>{e.result}</span>
              <span className="text-xs">w{e.weight}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ShopDialog({
  campaignId,
  locations,
  npcs,
  onSaved,
}: {
  campaignId: number;
  locations: Option[];
  npcs: Option[];
  onSaved: (s: Shop) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", locationId: "none", ownerNpcId: "none", notes: "" });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Shop name is required");
      return;
    }
    setPending(true);
    try {
      const saved = await api.post<Shop>("/api/shops", {
        campaignId,
        name: form.name,
        description: form.description,
        notes: form.notes,
        locationId: form.locationId === "none" ? null : Number(form.locationId),
        ownerNpcId: form.ownerNpcId === "none" ? null : Number(form.ownerNpcId),
      });
      toast.success("Shop created");
      onSaved(saved);
      setOpen(false);
      setForm({ name: "", description: "", locationId: "none", ownerNpcId: "none", notes: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" /> New Shop</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New shop</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <Select value={form.locationId} onValueChange={(v) => set("locationId", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Owner NPC">
              <Select value={form.ownerNpcId} onValueChange={(v) => set("ownerNpcId", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {npcs.map((n) => <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
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

function RollTableDialog({
  campaignId,
  table,
  onSaved,
  trigger,
}: {
  campaignId: number;
  table?: RollTable;
  onSaved: (t: RollTable) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(table?.name ?? "");
  const [description, setDescription] = useState(table?.description ?? "");
  const [entries, setEntries] = useState<RollTableEntry[]>(table?.entries ?? []);

  function updateEntry(i: number, patch: Partial<RollTableEntry>) {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Table name is required");
      return;
    }
    setPending(true);
    const payload = { campaignId, name, description, entries: entries.filter((e) => e.result.trim()) };
    try {
      const saved = table
        ? await api.patch<RollTable>(`/api/roll-tables/${table.id}`, payload)
        : await api.post<RollTable>("/api/roll-tables", payload);
      toast.success(table ? "Table saved" : "Table created");
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
        {trigger ?? <Button><Plus className="size-4" /> New Table</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{table ? "Edit roll table" : "New roll table"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Description">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium">Entries</p>
            <div className="space-y-2">
              {entries.map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={e.weight}
                    onChange={(ev) => updateEntry(i, { weight: Number(ev.target.value || 0) })}
                    className="w-20"
                    aria-label="Weight"
                  />
                  <Input
                    value={e.result}
                    onChange={(ev) => updateEntry(i, { result: ev.target.value })}
                    placeholder="Result"
                  />
                  <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setEntries((p) => p.filter((_, idx) => idx !== i))}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setEntries((p) => [...p, { weight: 1, result: "" }])}>
                <Plus className="size-4" /> Add entry
              </Button>
            </div>
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
