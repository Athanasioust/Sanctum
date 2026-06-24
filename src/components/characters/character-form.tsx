"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ObjectListEditor } from "@/components/shared/object-list-editor";
import { api } from "@/lib/client";
import {
  ABILITIES,
  SKILLS,
  DAMAGE_TYPES,
  CONDITIONS,
  LANGUAGES,
  ALIGNMENTS,
  EXHAUSTION_EFFECTS,
} from "@/lib/constants";
import { abilityModifier, proficiencyBonusForLevel, formatModifier } from "@/lib/dnd";
import type { Character, MulticlassEntry } from "@/db/schema";

type Props = { campaignId: number; character?: Character };

function defaults(campaignId: number) {
  return {
    campaignId,
    name: "",
    race: "",
    class: "",
    subclass: "",
    level: 1,
    background: "",
    alignment: "",
    experiencePoints: 0,
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    hpMax: 0,
    hpCurrent: 0,
    hpTemp: 0,
    armorClass: 10,
    speed: 30,
    initiativeBonus: 0,
    initiative: 0,
    savingThrowProficiencies: [] as string[],
    skillProficiencies: [] as string[],
    resistances: [] as string[],
    immunities: [] as string[],
    vulnerabilities: [] as string[],
    languages: [] as string[],
    featuresAndTraits: [] as { name: string; description: string }[],
    ideals: "",
    bonds: "",
    flaws: "",
    personalityTraits: "",
    feats: [] as { name: string; description: string }[],
    multiclassInfo: [] as MulticlassEntry[],
    conditions: [] as string[],
    exhaustionLevel: 0,
    notes: "",
  };
}

type CharacterFormState = ReturnType<typeof defaults>;

export function CharacterForm({ campaignId, character }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CharacterFormState>(() => {
    const base = defaults(campaignId);
    if (!character) return base;
    const merged = { ...base };
    for (const key of Object.keys(base) as (keyof CharacterFormState)[]) {
      const value = (character as Record<string, unknown>)[key];
      if (value !== undefined && value !== null) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
    return merged;
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const proficiencyBonus = useMemo(
    () => proficiencyBonusForLevel(form.level),
    [form.level],
  );
  const perceptionProficient = form.skillProficiencies.includes("perception");
  const passivePerception =
    10 +
    abilityModifier(form.wis) +
    (perceptionProficient ? proficiencyBonus : 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setPending(true);
    setError(null);
    const payload = {
      ...form,
      proficiencyBonus,
      passivePerception,
    };
    try {
      if (character) {
        await api.patch(`/api/characters/${character.id}`, payload);
        toast.success("Character saved");
        router.push(`/campaign/${campaignId}/characters/${character.id}`);
      } else {
        const created = await api.post<Character>("/api/characters", payload);
        toast.success("Character created");
        router.push(`/campaign/${campaignId}/characters/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save character";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Identity */}
      <FormSection title="Identity">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" required className="sm:col-span-2">
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Character name"
            />
          </Field>
          <Field label="Race" htmlFor="race">
            <Input id="race" value={form.race} onChange={(e) => set("race", e.target.value)} />
          </Field>
          <Field label="Class" htmlFor="class">
            <Input id="class" value={form.class} onChange={(e) => set("class", e.target.value)} />
          </Field>
          <Field label="Subclass" htmlFor="subclass">
            <Input id="subclass" value={form.subclass} onChange={(e) => set("subclass", e.target.value)} />
          </Field>
          <Field label="Background" htmlFor="background">
            <Input id="background" value={form.background} onChange={(e) => set("background", e.target.value)} />
          </Field>
          <Field label="Level">
            <Select value={String(form.level)} onValueChange={(v) => set("level", Number(v))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((l) => (
                  <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Alignment">
            <Select value={form.alignment || "none"} onValueChange={(v) => set("alignment", v === "none" ? "" : v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {ALIGNMENTS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Experience Points" htmlFor="xp">
            <Input id="xp" type="number" min={0} value={form.experiencePoints} onChange={(e) => set("experiencePoints", Number(e.target.value || 0))} />
          </Field>
          <Field label="Proficiency Bonus" hint="Auto-calculated from level">
            <Input value={formatModifier(proficiencyBonus)} readOnly className="bg-muted/50" />
          </Field>
        </div>
      </FormSection>

      {/* Combat */}
      <FormSection title="Combat">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="Armor Class">
            <Input type="number" value={form.armorClass} onChange={(e) => set("armorClass", Number(e.target.value || 0))} />
          </Field>
          <Field label="Max HP">
            <Input type="number" value={form.hpMax} onChange={(e) => set("hpMax", Number(e.target.value || 0))} />
          </Field>
          <Field label="Current HP">
            <Input type="number" value={form.hpCurrent} onChange={(e) => set("hpCurrent", Number(e.target.value || 0))} />
          </Field>
          <Field label="Temp HP">
            <Input type="number" value={form.hpTemp} onChange={(e) => set("hpTemp", Number(e.target.value || 0))} />
          </Field>
          <Field label="Speed">
            <Input type="number" value={form.speed} onChange={(e) => set("speed", Number(e.target.value || 0))} />
          </Field>
          <Field label="Initiative Bonus" hint={`DEX ${formatModifier(abilityModifier(form.dex))}`}>
            <Input type="number" value={form.initiativeBonus} onChange={(e) => set("initiativeBonus", Number(e.target.value || 0))} />
          </Field>
          <Field label="Initiative" hint="Current/last rolled">
            <Input type="number" value={form.initiative} onChange={(e) => set("initiative", Number(e.target.value || 0))} />
          </Field>
        </div>
        <p className="text-sm text-muted-foreground">
          Passive Perception: <span className="font-medium text-foreground">{passivePerception}</span> (auto-calculated)
        </p>
      </FormSection>

      {/* Ability Scores */}
      <FormSection title="Ability Scores" description="Modifiers are calculated automatically.">
        <AbilityScoresEditor
          scores={form}
          onChange={(key, value) => set(key, value)}
        />
      </FormSection>

      {/* Proficiencies */}
      <FormSection title="Saving Throw Proficiencies">
        <CheckboxGroup
          columns={3}
          options={ABILITIES.map((a) => ({ value: a.key, label: a.label }))}
          value={form.savingThrowProficiencies}
          onChange={(v) => set("savingThrowProficiencies", v)}
        />
      </FormSection>

      <FormSection title="Skill Proficiencies">
        <CheckboxGroup
          columns={3}
          options={SKILLS.map((s) => ({ value: s.key, label: s.label }))}
          value={form.skillProficiencies}
          onChange={(v) => set("skillProficiencies", v)}
        />
      </FormSection>

      {/* Defenses */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FormSection title="Resistances">
          <CheckboxGroup columns={1} options={[...DAMAGE_TYPES]} value={form.resistances} onChange={(v) => set("resistances", v)} />
        </FormSection>
        <FormSection title="Immunities">
          <CheckboxGroup columns={1} options={[...DAMAGE_TYPES]} value={form.immunities} onChange={(v) => set("immunities", v)} />
        </FormSection>
        <FormSection title="Vulnerabilities">
          <CheckboxGroup columns={1} options={[...DAMAGE_TYPES]} value={form.vulnerabilities} onChange={(v) => set("vulnerabilities", v)} />
        </FormSection>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FormSection title="Conditions">
          <CheckboxGroup columns={2} options={[...CONDITIONS]} value={form.conditions} onChange={(v) => set("conditions", v)} />
          <Field label="Exhaustion Level" className="mt-2">
            <Select value={String(form.exhaustionLevel)} onValueChange={(v) => set("exhaustionLevel", Number(v))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EXHAUSTION_EFFECTS).map(([lvl, eff]) => (
                  <SelectItem key={lvl} value={lvl}>{lvl} — {eff}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FormSection>
        <FormSection title="Languages">
          <CheckboxGroup columns={2} options={[...LANGUAGES]} value={form.languages} onChange={(v) => set("languages", v)} />
        </FormSection>
      </div>

      {/* Personality */}
      <FormSection title="Personality & Background">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Personality Traits">
            <Textarea value={form.personalityTraits} onChange={(e) => set("personalityTraits", e.target.value)} rows={3} />
          </Field>
          <Field label="Ideals">
            <Textarea value={form.ideals} onChange={(e) => set("ideals", e.target.value)} rows={3} />
          </Field>
          <Field label="Bonds">
            <Textarea value={form.bonds} onChange={(e) => set("bonds", e.target.value)} rows={3} />
          </Field>
          <Field label="Flaws">
            <Textarea value={form.flaws} onChange={(e) => set("flaws", e.target.value)} rows={3} />
          </Field>
        </div>
      </FormSection>

      {/* Features & feats */}
      <FormSection title="Features & Traits">
        <ObjectListEditor
          value={form.featuresAndTraits}
          onChange={(v) => set("featuresAndTraits", v)}
          namePlaceholder="Feature name"
          addLabel="Add feature"
        />
      </FormSection>

      <FormSection title="Feats">
        <ObjectListEditor
          value={form.feats}
          onChange={(v) => set("feats", v)}
          namePlaceholder="Feat name"
          addLabel="Add feat"
        />
      </FormSection>

      {/* Multiclass */}
      <FormSection title="Multiclassing" description="Add the classes this character has levels in beyond the primary class.">
        <MulticlassEditor value={form.multiclassInfo} onChange={(v) => set("multiclassInfo", v)} />
      </FormSection>

      {/* Notes */}
      <FormSection title="Notes">
        <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={5} placeholder="Anything else worth remembering…" />
      </FormSection>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-5 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            <Save className="size-4" />
            {pending ? "Saving…" : character ? "Save changes" : "Create character"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function MulticlassEditor({
  value,
  onChange,
}: {
  value: MulticlassEntry[];
  onChange: (next: MulticlassEntry[]) => void;
}) {
  function update(i: number, patch: Partial<MulticlassEntry>) {
    onChange(value.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  return (
    <div className="space-y-3">
      {value.map((entry, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <Field label="Class" className="flex-1">
            <Input value={entry.className} onChange={(e) => update(i, { className: e.target.value })} placeholder="Wizard" />
          </Field>
          <Field label="Subclass" className="flex-1">
            <Input value={entry.subclass ?? ""} onChange={(e) => update(i, { subclass: e.target.value })} placeholder="Evocation" />
          </Field>
          <Field label="Level" className="w-24">
            <Input type="number" min={1} value={entry.level} onChange={(e) => update(i, { level: Number(e.target.value || 1) })} />
          </Field>
          <Button type="button" size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { className: "", subclass: "", level: 1 }])}>
        <Plus className="size-4" /> Add class
      </Button>
    </div>
  );
}
