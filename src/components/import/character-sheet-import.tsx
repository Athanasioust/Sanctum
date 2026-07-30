"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, AlertTriangle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/shared/form";
import { EmptyState } from "@/components/shared/empty-state";
import { api } from "@/lib/client";
import { ABILITIES } from "@/lib/constants";
import { abilityModifier, formatModifier } from "@/lib/dnd";
import type { ParsedCharacterSheet } from "@/lib/pdf-character-sheet";
import type { Character } from "@/db/schema";

type ParseResponse = ParsedCharacterSheet & { fileName: string };

export function CharacterSheetImport({ campaignId }: { campaignId: number }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sheet, setSheet] = useState<ParseResponse | null>(null);
  const [name, setName] = useState("");
  const [withSpells, setWithSpells] = useState(true);
  const [withInventory, setWithInventory] = useState(true);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setParsing(true);
    setSheet(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const parsed = await api.upload<ParseResponse>("/api/import/character-sheet", fd);
      setSheet(parsed);
      setName(parsed.character.name);
      toast.success(`Read ${parsed.fieldCount} fields from the sheet`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that PDF", {
        duration: 10000,
      });
    } finally {
      setParsing(false);
    }
  }

  async function createCharacter() {
    if (!sheet) return;
    if (!name.trim()) {
      toast.error("Give the character a name");
      return;
    }
    setCreating(true);
    try {
      const { character } = await api.post<{ character: Character }>(
        "/api/import/character-sheet/commit",
        {
          campaignId,
          character: { ...sheet.character, name: name.trim() },
          spells: withSpells ? sheet.spells : [],
          spellSlots: withSpells ? sheet.spellSlots : [],
          inventory: withInventory ? sheet.inventory : [],
        },
      );
      toast.success(`${character.name} added to the party`);
      router.push(`/campaign/${campaignId}/characters`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create the character");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Import a character sheet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a filled-in 5e character sheet PDF and Sanctum reads the form fields
          straight off it — abilities, skills, HP, equipment, currency and spells.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          It has to be a <strong className="font-medium text-foreground">fillable</strong> sheet
          — one where you can click into a box and type. The official Wizards fillable PDF is
          the reference. Sheets that were printed, scanned, or exported from a character
          builder are usually <em>flattened</em>: they look identical but carry no form data,
          and nothing can be read out of them.
        </p>

        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Button
          variant="outline"
          className="mt-4"
          disabled={parsing}
          onClick={() => input.current?.click()}
        >
          <FileUp className="size-4" /> {parsing ? "Reading PDF…" : "Choose a PDF sheet"}
        </Button>
      </div>

      {!sheet ? (
        <EmptyState
          icon={FileUp}
          title="No sheet loaded"
          description="Pick a filled-in character sheet PDF. You'll see everything that was read before anything is saved."
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-lg font-semibold">What was read</h3>
              <Badge variant="outline">
                {sheet.fileName} · {sheet.fieldCount} fields
              </Badge>
            </div>

            <Field label="Name" className="mt-4 max-w-sm" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label="Class">
                {[sheet.character.class, sheet.character.level].filter(Boolean).join(" ") || "—"}
              </Stat>
              <Stat label="Race">{sheet.character.race || "—"}</Stat>
              <Stat label="Background">{sheet.character.background || "—"}</Stat>
              <Stat label="Alignment">{sheet.character.alignment || "—"}</Stat>
              <Stat label="Armor Class">{sheet.character.armorClass}</Stat>
              <Stat label="Hit Points">
                {sheet.character.hpCurrent} / {sheet.character.hpMax}
              </Stat>
              <Stat label="Speed">{sheet.character.speed} ft.</Stat>
              <Stat label="Proficiency">{formatModifier(sheet.character.proficiencyBonus)}</Stat>
            </dl>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ABILITIES.map((ability) => {
                const score = sheet.character[ability.key];
                return (
                  <div
                    key={ability.key}
                    className="rounded-lg border border-border bg-background p-2 text-center"
                  >
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {ability.short}
                    </div>
                    <div className="font-heading text-lg font-semibold">{score}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatModifier(abilityModifier(score))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">
                {sheet.character.savingThrowProficiencies.length} save proficiencies
              </Badge>
              <Badge variant="outline">
                {sheet.character.skillProficiencies.length} skill proficiencies
              </Badge>
              <Badge variant="outline">
                {sheet.character.featuresAndTraits.length} features
              </Badge>
              <Badge variant="outline">{sheet.character.languages.length} languages</Badge>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading text-lg font-semibold">Also import</h3>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                Spells
                <span className="text-muted-foreground">
                  {" "}
                  — {sheet.spells.length} found, {sheet.spellSlots.length} slot levels
                </span>
              </span>
              <Switch
                checked={withSpells}
                onCheckedChange={setWithSpells}
                disabled={sheet.spells.length === 0 && sheet.spellSlots.length === 0}
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                Equipment
                <span className="text-muted-foreground"> — {sheet.inventory.length} items</span>
              </span>
              <Switch
                checked={withInventory}
                onCheckedChange={setWithInventory}
                disabled={sheet.inventory.length === 0}
              />
            </label>
          </div>

          {sheet.warnings.length > 0 ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-500">
                <AlertTriangle className="size-4" /> Worth checking
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {sheet.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button onClick={createCharacter} disabled={creating}>
            <UserPlus className="size-4" /> {creating ? "Creating…" : "Create character"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
