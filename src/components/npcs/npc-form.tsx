"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FormSection } from "@/components/shared/form";
import { AbilityScoresEditor } from "@/components/shared/ability-scores-editor";
import { CheckboxGroup } from "@/components/shared/checkbox-group";
import { ChipInput } from "@/components/shared/chip-input";
import { ObjectListEditor } from "@/components/shared/object-list-editor";
import { api } from "@/lib/client";
import {
  ABILITIES,
  SKILLS,
  DAMAGE_TYPES,
  CONDITIONS,
  LANGUAGES,
  ALIGNMENTS,
  SIZES,
  CHALLENGE_RATINGS,
  CR_XP,
  EXHAUSTION_EFFECTS,
} from "@/lib/constants";
import type { Npc, StatBlockAction } from "@/db/schema";

function defaults(campaignId: number, isTemplate: boolean) {
  return {
    campaignId,
    name: "",
    type: "npc" as "npc" | "monster",
    race: "",
    class: "",
    size: "Medium",
    alignment: "",
    challengeRating: "",
    experiencePoints: 0,
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    hpMax: 10,
    hpCurrent: 10,
    armorClass: 10,
    speed: "30 ft.",
    savingThrowProficiencies: [] as string[],
    skillProficiencies: [] as string[],
    resistances: [] as string[],
    immunities: [] as string[],
    vulnerabilities: [] as string[],
    senses: [] as string[],
    languages: [] as string[],
    traits: [] as StatBlockAction[],
    actions: [] as StatBlockAction[],
    reactions: [] as StatBlockAction[],
    legendaryActions: [] as StatBlockAction[],
    lairActions: [] as StatBlockAction[],
    conditions: [] as string[],
    exhaustionLevel: 0,
    isTemplate,
    notes: "",
  };
}

type NpcFormState = ReturnType<typeof defaults>;

export function NpcForm({
  campaignId,
  npc,
  isTemplate = false,
  redirectBase = "npcs",
}: {
  campaignId: number;
  npc?: Npc;
  isTemplate?: boolean;
  redirectBase?: "npcs" | "bestiary";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<NpcFormState>(() => {
    const base = defaults(campaignId, isTemplate);
    if (!npc) return base;
    const merged = { ...base };
    for (const key of Object.keys(base) as (keyof NpcFormState)[]) {
      const value = (npc as Record<string, unknown>)[key];
      if (value !== undefined && value !== null) (merged as Record<string, unknown>)[key] = value;
    }
    return merged;
  });

  function set<K extends keyof NpcFormState>(key: K, value: NpcFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Keep Current HP in step with Max HP while the creature is at full health
  // (or has no HP yet), so a freshly-entered Max HP is immediately combat-ready
  // without having to type the value twice.
  function setHpMax(next: number) {
    setForm((f) => ({
      ...f,
      hpMax: next,
      hpCurrent:
        f.hpCurrent === f.hpMax || f.hpCurrent === 0 ? next : f.hpCurrent,
    }));
  }

  function onCrChange(cr: string) {
    setForm((f) => ({
      ...f,
      challengeRating: cr,
      experiencePoints: CR_XP[cr] ?? f.experiencePoints,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setPending(true);
    setError(null);
    try {
      let savedId = npc?.id;
      if (npc) {
        await api.patch(`/api/npcs/${npc.id}`, form);
        toast.success("Saved");
      } else {
        const created = await api.post<Npc>("/api/npcs", form);
        savedId = created.id;
        toast.success("Created");
      }
      router.push(`/campaign/${campaignId}/${redirectBase}/${savedId}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</div>
      ) : null}

      <FormSection title="Identity">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name" required className="sm:col-span-2 lg:col-span-3">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Goblin Boss" />
          </Field>
          <Field label="Type">
            <Select value={form.type} onValueChange={(v) => set("type", v as "npc" | "monster")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="npc">NPC</SelectItem>
                <SelectItem value="monster">Monster</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Size">
            <Select value={form.size} onValueChange={(v) => set("size", v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Alignment">
            <Select value={form.alignment || "none"} onValueChange={(v) => set("alignment", v === "none" ? "" : v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {ALIGNMENTS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Race / Kind">
            <Input value={form.race} onChange={(e) => set("race", e.target.value)} placeholder="Goblinoid" />
          </Field>
          <Field label="Class (optional)">
            <Input value={form.class} onChange={(e) => set("class", e.target.value)} />
          </Field>
          <Field label="Challenge Rating">
            <Select value={form.challengeRating || "none"} onValueChange={(v) => onCrChange(v === "none" ? "" : v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {CHALLENGE_RATINGS.map((c) => <SelectItem key={c} value={c}>CR {c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Experience Points" hint="Auto-fills from CR">
            <Input type="number" min={0} value={form.experiencePoints} onChange={(e) => set("experiencePoints", Number(e.target.value || 0))} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Defense & Movement">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Armor Class">
            <Input type="number" value={form.armorClass} onChange={(e) => set("armorClass", Number(e.target.value || 0))} />
          </Field>
          <Field label="Max HP">
            <Input type="number" value={form.hpMax} onChange={(e) => setHpMax(Number(e.target.value || 0))} />
          </Field>
          <Field label="Current HP">
            <Input type="number" value={form.hpCurrent} onChange={(e) => set("hpCurrent", Number(e.target.value || 0))} />
          </Field>
          <Field label="Speed">
            <Input value={form.speed} onChange={(e) => set("speed", e.target.value)} placeholder="30 ft., fly 60 ft." />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Ability Scores">
        <AbilityScoresEditor scores={form} onChange={(key, value) => set(key, value)} />
      </FormSection>

      <FormSection title="Saving Throw Proficiencies">
        <CheckboxGroup columns={3} options={ABILITIES.map((a) => ({ value: a.key, label: a.label }))} value={form.savingThrowProficiencies} onChange={(v) => set("savingThrowProficiencies", v)} />
      </FormSection>
      <FormSection title="Skill Proficiencies">
        <CheckboxGroup columns={3} options={SKILLS.map((s) => ({ value: s.key, label: s.label }))} value={form.skillProficiencies} onChange={(v) => set("skillProficiencies", v)} />
      </FormSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FormSection title="Resistances"><CheckboxGroup columns={1} options={[...DAMAGE_TYPES]} value={form.resistances} onChange={(v) => set("resistances", v)} /></FormSection>
        <FormSection title="Immunities"><CheckboxGroup columns={1} options={[...DAMAGE_TYPES]} value={form.immunities} onChange={(v) => set("immunities", v)} /></FormSection>
        <FormSection title="Vulnerabilities"><CheckboxGroup columns={1} options={[...DAMAGE_TYPES]} value={form.vulnerabilities} onChange={(v) => set("vulnerabilities", v)} /></FormSection>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FormSection title="Senses"><ChipInput value={form.senses} onChange={(v) => set("senses", v)} placeholder="Darkvision 60 ft." /></FormSection>
        <FormSection title="Languages"><CheckboxGroup columns={2} options={[...LANGUAGES]} value={form.languages} onChange={(v) => set("languages", v)} /></FormSection>
      </div>

      <FormSection title="Traits"><ObjectListEditor value={form.traits} onChange={(v) => set("traits", v)} namePlaceholder="Trait name" addLabel="Add trait" /></FormSection>
      <FormSection title="Actions"><ObjectListEditor value={form.actions} onChange={(v) => set("actions", v)} namePlaceholder="Action name" addLabel="Add action" /></FormSection>
      <FormSection title="Reactions"><ObjectListEditor value={form.reactions} onChange={(v) => set("reactions", v)} namePlaceholder="Reaction name" addLabel="Add reaction" /></FormSection>
      <FormSection title="Legendary Actions"><ObjectListEditor value={form.legendaryActions} onChange={(v) => set("legendaryActions", v)} namePlaceholder="Legendary action" addLabel="Add legendary action" /></FormSection>
      <FormSection title="Lair Actions"><ObjectListEditor value={form.lairActions} onChange={(v) => set("lairActions", v)} namePlaceholder="Lair action" addLabel="Add lair action" /></FormSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FormSection title="Conditions">
          <CheckboxGroup columns={2} options={[...CONDITIONS]} value={form.conditions} onChange={(v) => set("conditions", v)} />
          <Field label="Exhaustion Level" className="mt-2">
            <Select value={String(form.exhaustionLevel)} onValueChange={(v) => set("exhaustionLevel", Number(v))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EXHAUSTION_EFFECTS).map(([lvl, eff]) => <SelectItem key={lvl} value={lvl}>{lvl} — {eff}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </FormSection>
        <FormSection title="Notes & Bestiary">
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={4} placeholder="DM notes, tactics, lore…" />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <Checkbox checked={form.isTemplate} onCheckedChange={(c) => set("isTemplate", c === true)} />
            Reusable Bestiary template
          </label>
        </FormSection>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-5 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
          <Button type="submit" disabled={pending}>
            <Save className="size-4" />
            {pending ? "Saving…" : npc ? "Save changes" : "Create"}
          </Button>
        </div>
      </div>
    </form>
  );
}
