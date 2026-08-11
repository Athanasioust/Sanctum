"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, BookOpen, Plus, Sparkles, Swords, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/shared/form";
import { EmptyState } from "@/components/shared/empty-state";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { ChipInput } from "@/components/shared/chip-input";
import { api } from "@/lib/client";
import { SPELL_SCHOOLS } from "@/lib/constants";
import type { HomebrewFeat, HomebrewSpell } from "@/db/schema";

const LEVELS = Array.from({ length: 10 }, (_, i) => i);
const levelLabel = (level: number) => (level === 0 ? "Cantrip" : `Level ${level}`);

export function HomebrewManager({
  campaignId,
  spells: initialSpells,
  feats: initialFeats,
  monsterCount,
  itemCount,
}: {
  campaignId: number;
  spells: HomebrewSpell[];
  feats: HomebrewFeat[];
  /** Homebrew-marked rows elsewhere, so this page can report the whole picture. */
  monsterCount: number;
  itemCount: number;
}) {
  const [spells, setSpells] = useState(initialSpells);
  const [feats, setFeats] = useState(initialFeats);

  return (
    <Tabs defaultValue="spells">
      <TabsList className="mb-4">
        <TabsTrigger value="spells">
          <Wand2 className="size-4" /> Spells
          {spells.length > 0 && <Badge variant="secondary" className="ml-1.5">{spells.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="feats">
          <Award className="size-4" /> Feats
          {feats.length > 0 && <Badge variant="secondary" className="ml-1.5">{feats.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="elsewhere">
          <BookOpen className="size-4" /> Monsters &amp; Items
        </TabsTrigger>
      </TabsList>

      {/* Spells */}
      <TabsContent value="spells" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Custom spells appear alongside the SRD list whenever you add a spell to a
            character or NPC.
          </p>
          <SpellDialog
            campaignId={campaignId}
            onSaved={(spell) =>
              setSpells((prev) =>
                [...prev.filter((s) => s.id !== spell.id), spell].sort((a, b) =>
                  a.name.localeCompare(b.name),
                ),
              )
            }
          />
        </div>

        {spells.length === 0 ? (
          <EmptyState
            icon={Wand2}
            title="No homebrew spells"
            description="Write a spell once and it becomes pickable on every character sheet in this campaign."
          />
        ) : (
          <ul className="space-y-2">
            {spells.map((spell) => (
              <li
                key={spell.id}
                className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{spell.name}</p>
                    <Badge variant="secondary">{levelLabel(spell.level)}</Badge>
                    {spell.school && <Badge variant="secondary">{spell.school}</Badge>}
                    {spell.isConcentration && (
                      <Badge className="bg-blue-500/15 text-blue-300">Concentration</Badge>
                    )}
                  </div>
                  {spell.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {spell.description}
                    </p>
                  )}
                  {spell.classes.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {spell.classes.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <SpellDialog
                    campaignId={campaignId}
                    existing={spell}
                    onSaved={(updated) =>
                      setSpells((prev) =>
                        prev.map((s) => (s.id === updated.id ? updated : s)),
                      )
                    }
                  />
                  <DeleteIconButton
                    label="spell"
                    title={`Delete "${spell.name}"?`}
                    description="Copies already added to characters are left alone."
                    onConfirm={async () => {
                      await api.delete(`/api/homebrew-spells/${spell.id}`);
                      setSpells((prev) => prev.filter((s) => s.id !== spell.id));
                      toast.success("Spell deleted");
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      {/* Feats */}
      <TabsContent value="feats" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Custom feats become pickable in the character sheet&apos;s Feats section.
          </p>
          <FeatDialog
            campaignId={campaignId}
            onSaved={(feat) =>
              setFeats((prev) =>
                [...prev.filter((f) => f.id !== feat.id), feat].sort((a, b) =>
                  a.name.localeCompare(b.name),
                ),
              )
            }
          />
        </div>

        {feats.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No homebrew feats"
            description="Write the feats your table uses so nobody has to retype them onto every sheet."
          />
        ) : (
          <ul className="space-y-2">
            {feats.map((feat) => (
              <li
                key={feat.id}
                className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{feat.name}</p>
                  {feat.prerequisite && (
                    <p className="text-xs text-muted-foreground">
                      Prerequisite: {feat.prerequisite}
                    </p>
                  )}
                  {feat.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {feat.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <FeatDialog
                    campaignId={campaignId}
                    existing={feat}
                    onSaved={(updated) =>
                      setFeats((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
                    }
                  />
                  <DeleteIconButton
                    label="feat"
                    title={`Delete "${feat.name}"?`}
                    onConfirm={async () => {
                      await api.delete(`/api/homebrew-feats/${feat.id}`);
                      setFeats((prev) => prev.filter((f) => f.id !== feat.id));
                      toast.success("Feat deleted");
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      {/* Pointers to where monsters and items already live */}
      <TabsContent value="elsewhere" className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Monsters and magic items already have their own homes. Anything you create
          there is tagged <Badge variant="secondary">Homebrew</Badge> so you can tell
          it apart from the SRD content Sanctum ships with.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ElsewhereCard
            icon={Swords}
            title="Monsters"
            count={monsterCount}
            description="Stat-block templates in your bestiary, ready to drop into an encounter."
            href={`/campaign/${campaignId}/bestiary/new`}
            browseHref={`/campaign/${campaignId}/npcs?tab=bestiary`}
          />
          <ElsewhereCard
            icon={Sparkles}
            title="Magic items"
            count={itemCount}
            description="Custom items you can assign to a character and track attunement on."
            href={`/campaign/${campaignId}/magic-items`}
            browseHref={`/campaign/${campaignId}/magic-items`}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function ElsewhereCard({
  icon: Icon,
  title,
  count,
  description,
  href,
  browseHref,
}: {
  icon: typeof Swords;
  title: string;
  count: number;
  description: string;
  href: string;
  browseHref: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-1 flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h3 className="font-medium">{title}</h3>
        <Badge variant="secondary" className="ml-auto">{count} homebrew</Badge>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{description}</p>
      <div className="flex gap-2">
        <Button size="sm" asChild>
          <Link href={href}><Plus className="size-3.5" /> Create</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href={browseHref}>Browse</Link>
        </Button>
      </div>
    </div>
  );
}

function SpellDialog({
  campaignId,
  existing,
  onSaved,
}: {
  campaignId: number;
  existing?: HomebrewSpell;
  onSaved: (spell: HomebrewSpell) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    level: existing?.level ?? 0,
    school: existing?.school ?? "",
    castingTime: existing?.castingTime ?? "1 action",
    range: existing?.range ?? "",
    components: existing?.components ?? "",
    duration: existing?.duration ?? "Instantaneous",
    description: existing?.description ?? "",
    isConcentration: existing?.isConcentration ?? false,
    classes: existing?.classes ?? ([] as string[]),
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name the spell first");
      return;
    }
    setPending(true);
    try {
      const saved = existing
        ? await api.patch<HomebrewSpell>(`/api/homebrew-spells/${existing.id}`, form)
        : await api.post<HomebrewSpell>("/api/homebrew-spells", { campaignId, ...form });
      onSaved(saved);
      setOpen(false);
      toast.success(existing ? "Spell saved" : "Spell created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {existing ? (
          <Button size="icon-sm" variant="ghost" aria-label={`Edit ${existing.name}`}>
            <Wand2 className="size-3.5" />
          </Button>
        ) : (
          <Button><Plus className="size-4" /> New spell</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit spell" : "New homebrew spell"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Level">
              <Select value={String(form.level)} onValueChange={(v) => set("level", Number(v))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={String(l)}>{levelLabel(l)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="School">
              <Select
                value={form.school || "none"}
                onValueChange={(v) => set("school", v === "none" ? "" : v)}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {SPELL_SCHOOLS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Casting time">
              <Input value={form.castingTime} onChange={(e) => set("castingTime", e.target.value)} />
            </Field>
            <Field label="Range">
              <Input value={form.range} onChange={(e) => set("range", e.target.value)} placeholder="60 feet" />
            </Field>
            <Field label="Components">
              <Input value={form.components} onChange={(e) => set("components", e.target.value)} placeholder="V, S, M" />
            </Field>
            <Field label="Duration">
              <Input value={form.duration} onChange={(e) => set("duration", e.target.value)} />
            </Field>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm">
            <Checkbox
              checked={form.isConcentration}
              onCheckedChange={(c) => set("isConcentration", c === true)}
            />
            <span className="select-none">Requires concentration</span>
          </label>

          <Field label="Classes" hint="Who can learn it. Optional.">
            <ChipInput
              value={form.classes}
              onChange={(v) => set("classes", v)}
              placeholder="Wizard"
            />
          </Field>

          <Field label="Description">
            <Textarea
              rows={6}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What the spell does…"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save spell"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FeatDialog({
  campaignId,
  existing,
  onSaved,
}: {
  campaignId: number;
  existing?: HomebrewFeat;
  onSaved: (feat: HomebrewFeat) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [prerequisite, setPrerequisite] = useState(existing?.prerequisite ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");

  async function save() {
    if (!name.trim()) {
      toast.error("Name the feat first");
      return;
    }
    setPending(true);
    try {
      const body = { name, prerequisite, description };
      const saved = existing
        ? await api.patch<HomebrewFeat>(`/api/homebrew-feats/${existing.id}`, body)
        : await api.post<HomebrewFeat>("/api/homebrew-feats", { campaignId, ...body });
      onSaved(saved);
      setOpen(false);
      toast.success(existing ? "Feat saved" : "Feat created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {existing ? (
          <Button size="icon-sm" variant="ghost" aria-label={`Edit ${existing.name}`}>
            <Award className="size-3.5" />
          </Button>
        ) : (
          <Button><Plus className="size-4" /> New feat</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit feat" : "New homebrew feat"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="Prerequisite" hint="Optional.">
            <Input
              value={prerequisite}
              onChange={(e) => setPrerequisite(e.target.value)}
              placeholder="Strength 13 or higher"
            />
          </Field>
          <Field label="Description">
            <Textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save feat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
