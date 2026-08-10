"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Combobox } from "@/components/shared/combobox";
import { ObjectListEditor } from "@/components/shared/object-list-editor";
import { HomebrewFeatPicker } from "@/components/characters/homebrew-feat-picker";
import { useCampaignOptions } from "@/components/campaigns/campaign-options-context";
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
import {
  BACKGROUND_CATALOG,
  CLASS_CATALOG,
  RACE_CATALOG,
  optionsFor,
  subclassOptions,
  withCampaignValues,
} from "@/lib/character-options";
import { abilityModifier, proficiencyBonusForLevel, formatModifier } from "@/lib/dnd";
import { cn } from "@/lib/utils";
import type { Character, MulticlassEntry } from "@/db/schema";

type Props = { campaignId: number; character?: Character };

let multiclassKeyCounter = 0;
const nextMulticlassKey = () => `mc-${multiclassKeyCounter++}`;

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
    hpMax: 10,
    hpCurrent: 10,
    hpTemp: 0,
    armorClass: 10,
    speed: 30,
    initiativeBonus: 0,
    initiative: 0,
    darkvision: 0,
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
    backstory: "",
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
  const { rulebooks, used } = useCampaignOptions();
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

  // Keep Current HP in step with Max HP while the character is at full health
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

  // The checkbox is tracked separately from the range so clearing the number
  // box mid-edit doesn't collapse the field out from under the cursor.
  const [hasDarkvision, setHasDarkvision] = useState(() => (character?.darkvision ?? 0) > 0);

  function toggleDarkvision(on: boolean) {
    setHasDarkvision(on);
    set("darkvision", on ? form.darkvision || 60 : 0);
  }

  const proficiencyBonus = useMemo(
    () => proficiencyBonusForLevel(form.level),
    [form.level],
  );

  const raceChoices = useMemo(
    () =>
      withCampaignValues(
        optionsFor(RACE_CATALOG, rulebooks).map((value) => ({ value })),
        used.races,
      ),
    [rulebooks, used.races],
  );
  const classChoices = useMemo(
    () =>
      withCampaignValues(
        optionsFor(CLASS_CATALOG, rulebooks).map((value) => ({ value })),
        used.classes,
      ),
    [rulebooks, used.classes],
  );
  const backgroundChoices = useMemo(
    () =>
      withCampaignValues(
        optionsFor(BACKGROUND_CATALOG, rulebooks).map((value) => ({ value })),
        used.backgrounds,
      ),
    [rulebooks, used.backgrounds],
  );
  const subclassChoices = useMemo(
    () => withCampaignValues(subclassOptions(form.class, rulebooks), used.subclasses),
    [form.class, rulebooks, used.subclasses],
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
            <Combobox
              id="race"
              value={form.race}
              onValueChange={(v) => set("race", v)}
              options={raceChoices}
              placeholder="Select a race"
            />
          </Field>
          <Field label="Class" htmlFor="class">
            <Combobox
              id="class"
              value={form.class}
              onValueChange={(v) => set("class", v)}
              options={classChoices}
              placeholder="Select a class"
            />
          </Field>
          <Field
            label="Subclass"
            htmlFor="subclass"
            hint={form.class ? undefined : "Pick a class to narrow this list"}
          >
            <Combobox
              id="subclass"
              value={form.subclass}
              onValueChange={(v) => set("subclass", v)}
              options={subclassChoices}
              placeholder="Select a subclass"
            />
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
            <Input type="number" value={form.hpMax} onChange={(e) => setHpMax(Number(e.target.value || 0))} />
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
        <div className="flex flex-wrap items-center gap-3">
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm transition-colors",
              hasDarkvision ? "border-primary/50 bg-primary/10" : "hover:bg-muted",
            )}
          >
            <Checkbox
              checked={hasDarkvision}
              onCheckedChange={(c) => toggleDarkvision(c === true)}
            />
            <span className="select-none">Darkvision</span>
          </label>
          {hasDarkvision ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                step={30}
                className="w-24"
                value={form.darkvision}
                onChange={(e) => set("darkvision", Math.max(0, Number(e.target.value || 0)))}
                aria-label="Darkvision range in feet"
              />
              <span className="text-sm text-muted-foreground">ft — commonly 60 or 120</span>
            </div>
          ) : null}
        </div>
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

      {/* Characteristics */}
      <FormSection title="Characteristics" description="What this character is like at the table.">
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

      {/* Background */}
      <FormSection title="Background" description="Where this character came from.">
        <Field label="Background" htmlFor="background" className="sm:max-w-sm">
          <Combobox
            id="background"
            value={form.background}
            onValueChange={(v) => set("background", v)}
            options={backgroundChoices}
            placeholder="Select a background"
          />
        </Field>
        <Field label="Backstory">
          <Textarea
            value={form.backstory}
            onChange={(e) => set("backstory", e.target.value)}
            rows={6}
            placeholder="How they grew up, what drove them to adventure, who they left behind…"
          />
        </Field>
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
        <HomebrewFeatPicker
          campaignId={campaignId}
          value={form.feats}
          onChange={(v) => set("feats", v)}
        />
        <ObjectListEditor
          value={form.feats}
          onChange={(v) => set("feats", v)}
          namePlaceholder="Feat name"
          addLabel="Add feat"
        />
      </FormSection>

      {/* Multiclass */}
      <FormSection title="Multiclassing" description="Add the classes this character has levels in beyond the primary class.">
        <MulticlassEditor
          value={form.multiclassInfo}
          onChange={(v) => set("multiclassInfo", v)}
          classChoices={classChoices}
          rulebooks={rulebooks}
          usedSubclasses={used.subclasses}
        />
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
  classChoices,
  rulebooks,
  usedSubclasses,
}: {
  value: MulticlassEntry[];
  onChange: (next: MulticlassEntry[]) => void;
  classChoices: { value: string; group?: string }[];
  rulebooks: string[];
  usedSubclasses: string[];
}) {
  const [keys, setKeys] = useState<string[]>(() => value.map(nextMulticlassKey));
  useEffect(() => {
    setKeys((k) => (k.length === value.length ? k : value.map(nextMulticlassKey)));
  }, [value.length]);

  function update(i: number, patch: Partial<MulticlassEntry>) {
    onChange(value.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function removeAt(i: number) {
    setKeys((k) => k.filter((_, idx) => idx !== i));
    onChange(value.filter((_, idx) => idx !== i));
  }
  function addClass() {
    setKeys((k) => [...k, nextMulticlassKey()]);
    onChange([...value, { className: "", subclass: "", level: 1 }]);
  }
  return (
    <div className="space-y-3">
      {value.map((entry, i) => (
        <div key={keys[i] ?? i} className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <Field label="Class" className="flex-1">
            <Combobox
              value={entry.className}
              onValueChange={(v) => update(i, { className: v })}
              options={classChoices}
              placeholder="Wizard"
            />
          </Field>
          <Field label="Subclass" className="flex-1">
            <Combobox
              value={entry.subclass ?? ""}
              onValueChange={(v) => update(i, { subclass: v })}
              options={withCampaignValues(
                subclassOptions(entry.className, rulebooks),
                usedSubclasses,
              )}
              placeholder="School of Evocation"
            />
          </Field>
          <Field label="Level" className="w-24">
            <Input type="number" min={1} value={entry.level} onChange={(e) => update(i, { level: Number(e.target.value || 1) })} />
          </Field>
          <Button type="button" size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => removeAt(i)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addClass}>
        <Plus className="size-4" /> Add class
      </Button>
    </div>
  );
}
