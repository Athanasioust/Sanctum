"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Sparkles, Minus, Pencil, BookOpen, Search } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/shared/form";
import { EmptyState } from "@/components/shared/empty-state";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { api } from "@/lib/client";
import { SPELL_SCHOOLS } from "@/lib/constants";
import { SRD_SPELLS, type SeedSpell } from "@/lib/srd-spells";
import type { Spell, SpellSlot } from "@/db/schema";

type OwnerType = "character" | "npc";

const LEVEL_LABEL = (lvl: number) => (lvl === 0 ? "Cantrips" : `Level ${lvl}`);

export function SpellsTab({
  ownerId,
  ownerType,
}: {
  ownerId: number;
  ownerType: OwnerType;
}) {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [slots, setSlots] = useState<SpellSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const q = `ownerId=${ownerId}&ownerType=${ownerType}`;
    const [s, sl] = await Promise.all([
      api.get<Spell[]>(`/api/spells?${q}`),
      api.get<SpellSlot[]>(`/api/spell-slots?${q}`),
    ]);
    setSpells(s);
    setSlots(sl);
    setLoading(false);
  }, [ownerId, ownerType]);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  async function adjustSlot(slot: SpellSlot, delta: number) {
    const used = Math.max(0, Math.min(slot.total, slot.used + delta));
    setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, used } : s)));
    try {
      await api.patch(`/api/spell-slots/${slot.id}`, { used });
    } catch {
      toast.error("Failed to update slot");
      load();
    }
  }

  async function togglePrepared(spell: Spell) {
    const isPrepared = !spell.isPrepared;
    setSpells((prev) =>
      prev.map((s) => (s.id === spell.id ? { ...s, isPrepared } : s)),
    );
    try {
      await api.patch(`/api/spells/${spell.id}`, { isPrepared });
    } catch {
      toast.error("Failed to update spell");
      load();
    }
  }

  async function deleteSpell(id: number) {
    try {
      await api.delete(`/api/spells/${id}`);
      setSpells((prev) => prev.filter((s) => s.id !== id));
      toast.success("Spell removed");
    } catch {
      toast.error("Failed to remove spell");
    }
  }

  const byLevel = new Map<number, Spell[]>();
  for (const s of spells) {
    if (!byLevel.has(s.level)) byLevel.set(s.level, []);
    byLevel.get(s.level)!.push(s);
  }
  const levels = [...byLevel.keys()].sort((a, b) => a - b);

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading spells…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Spell slots */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">Spell Slots</h3>
          <SlotDialog ownerId={ownerId} ownerType={ownerType} existing={slots} onSaved={load} />
        </div>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No spell slots configured.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {slots
              .slice()
              .sort((a, b) => a.slotLevel - b.slotLevel)
              .map((slot) => (
                <div key={slot.id} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Level {slot.slotLevel}</p>
                  <p className="my-1 text-lg font-semibold tabular-nums">
                    {slot.total - slot.used}
                    <span className="text-sm text-muted-foreground">/{slot.total}</span>
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <Button size="icon" variant="outline" className="size-7" onClick={() => adjustSlot(slot, 1)} aria-label="Use slot">
                      <Minus className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="outline" className="size-7" onClick={() => adjustSlot(slot, -1)} aria-label="Recover slot">
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Spell list */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">Spells</h3>
        <div className="flex items-center gap-2">
          <SpellCompendium
            ownerId={ownerId}
            ownerType={ownerType}
            existingNames={new Set(spells.map((s) => s.name.toLowerCase()))}
            onSaved={load}
          />
          <SpellDialog ownerId={ownerId} ownerType={ownerType} onSaved={load} />
        </div>
      </div>

      {spells.length === 0 ? (
        <EmptyState icon={Sparkles} title="No spells" description="Add spells this character knows or can prepare." />
      ) : (
        <div className="space-y-5">
          {levels.map((level) => (
            <div key={level}>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {LEVEL_LABEL(level)}
              </h4>
              <div className="space-y-2">
                {byLevel.get(level)!.map((spell) => (
                  <div key={spell.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{spell.name}</span>
                          {spell.school ? <Badge variant="secondary">{spell.school}</Badge> : null}
                          {spell.isConcentration ? <Badge variant="outline">Concentration</Badge> : null}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[spell.castingTime, spell.range, spell.components, spell.duration].filter(Boolean).join(" · ")}
                        </p>
                        {spell.description ? (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{spell.description}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {level > 0 ? (
                          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                            <Checkbox checked={spell.isPrepared} onCheckedChange={() => togglePrepared(spell)} />
                            Prepared
                          </label>
                        ) : null}
                        <SpellDialog ownerId={ownerId} ownerType={ownerType} onSaved={load} spell={spell} trigger={
                          <Button size="icon" variant="ghost" className="size-8" aria-label="Edit spell"><Pencil className="size-4" /></Button>
                        } />
                        <DeleteIconButton label="spell" onConfirm={() => deleteSpell(spell.id)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SpellDialog({
  ownerId,
  ownerType,
  onSaved,
  spell,
  trigger,
}: {
  ownerId: number;
  ownerType: OwnerType;
  onSaved: () => void;
  spell?: Spell;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: spell?.name ?? "",
    level: spell?.level ?? 0,
    school: spell?.school ?? "",
    castingTime: spell?.castingTime ?? "",
    range: spell?.range ?? "",
    components: spell?.components ?? "",
    duration: spell?.duration ?? "",
    description: spell?.description ?? "",
    isConcentration: spell?.isConcentration ?? false,
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Spell name is required");
      return;
    }
    setPending(true);
    try {
      if (spell) {
        await api.patch(`/api/spells/${spell.id}`, form);
      } else {
        await api.post("/api/spells", { ...form, ownerId, ownerType });
      }
      toast.success("Spell saved");
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
            <Plus className="size-4" /> Add Spell
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{spell ? "Edit spell" : "Add spell"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Level">
              <Select value={String(form.level)} onValueChange={(v) => set("level", Number(v))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Cantrip</SelectItem>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((l) => (
                    <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="School">
              <Select value={form.school || "none"} onValueChange={(v) => set("school", v === "none" ? "" : v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {SPELL_SCHOOLS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Casting Time">
              <Input value={form.castingTime} onChange={(e) => set("castingTime", e.target.value)} placeholder="1 action" />
            </Field>
            <Field label="Range">
              <Input value={form.range} onChange={(e) => set("range", e.target.value)} placeholder="60 ft" />
            </Field>
            <Field label="Components">
              <Input value={form.components} onChange={(e) => set("components", e.target.value)} placeholder="V, S, M" />
            </Field>
            <Field label="Duration">
              <Input value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="Instantaneous" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.isConcentration} onCheckedChange={(c) => set("isConcentration", c === true)} />
            Requires concentration
          </label>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} />
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

/**
 * Searchable SRD spell compendium. Pick a spell to drop a full, editable copy
 * onto this character/NPC — no retyping. Stays open so you can add several.
 */
function SpellCompendium({
  ownerId,
  ownerType,
  existingNames,
  onSaved,
}: {
  ownerId: number;
  ownerType: OwnerType;
  existingNames: Set<string>;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const q = search.trim().toLowerCase();
  const filtered = SRD_SPELLS.filter((s) => {
    if (level !== "all" && String(s.level) !== level) return false;
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.school.toLowerCase().includes(q) ||
      s.classes.some((c) => c.toLowerCase().includes(q))
    );
  });

  async function add(spell: SeedSpell) {
    setBusy(spell.name);
    try {
      await api.post("/api/spells", {
        ownerId,
        ownerType,
        name: spell.name,
        level: spell.level,
        school: spell.school,
        castingTime: spell.castingTime,
        range: spell.range,
        components: spell.components,
        duration: spell.duration,
        description: spell.description,
        isConcentration: spell.isConcentration,
      });
      toast.success(`Added ${spell.name}`);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add spell");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <BookOpen className="size-4" /> Add from SRD
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col">
        <DialogHeader>
          <DialogTitle>SRD Spell Compendium</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, school or class…"
              className="pl-8"
              autoFocus
            />
          </div>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="0">Cantrips</SelectItem>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((l) => (
                <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="-mt-1 text-xs text-muted-foreground">
          Tap a spell to add an editable copy — add as many as you need.
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No spells match.</p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((s) => {
                const added = existingNames.has(s.name.toLowerCase());
                return (
                  <button
                    key={s.name}
                    type="button"
                    disabled={added || busy === s.name}
                    onClick={() => add(s)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">{s.name}</span>
                      {s.isConcentration ? (
                        <span className="ml-1.5 text-xs text-muted-foreground">(C)</span>
                      ) : null}
                      <span className="block truncate text-xs text-muted-foreground">
                        {s.school}
                        {s.classes.length ? ` · ${s.classes.join(", ")}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {added ? "Added" : s.level === 0 ? "Cantrip" : `Lvl ${s.level}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SlotDialog({
  ownerId,
  ownerType,
  existing,
  onSaved,
}: {
  ownerId: number;
  ownerType: OwnerType;
  existing: SpellSlot[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  // totals[level] = total slots
  const [totals, setTotals] = useState<Record<number, number>>(() => {
    const t: Record<number, number> = {};
    for (let i = 1; i <= 9; i++) t[i] = existing.find((s) => s.slotLevel === i)?.total ?? 0;
    return t;
  });

  async function save() {
    setPending(true);
    try {
      for (let level = 1; level <= 9; level++) {
        const total = totals[level] ?? 0;
        const current = existing.find((s) => s.slotLevel === level);
        if (current) {
          if (total !== current.total) {
            await api.patch(`/api/spell-slots/${current.id}`, {
              total,
              used: Math.min(current.used, total),
            });
          }
        } else if (total > 0) {
          await api.post("/api/spell-slots", { ownerId, ownerType, slotLevel: level, total, used: 0 });
        }
      }
      toast.success("Spell slots updated");
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save slots");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Configure slots</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Spell slots per level</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 py-2">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((level) => (
            <Field key={level} label={`Level ${level}`}>
              <Input
                type="number"
                min={0}
                value={totals[level] ?? 0}
                onChange={(e) => setTotals((t) => ({ ...t, [level]: Number(e.target.value || 0) }))}
              />
            </Field>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
