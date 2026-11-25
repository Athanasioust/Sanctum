"use client";

import { useRef, useState } from "react";
import { FileUp, ListPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";
import type { GeneratorList } from "@/db/schema";
import { listKeyFor, type CustomMode, type GeneratorDef } from "@/lib/generators/registry";

/** Matches the API's limits (validators.ts). */
const MAX_ENTRIES = 5000;
const MAX_LENGTH = 2000;

type Target = { key: string; label: string };

/** One entry per line: trimmed, blank lines and repeats dropped. */
export function parseEntries(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const entry = line.trim().slice(0, MAX_LENGTH);
    if (!entry || seen.has(entry)) continue;
    seen.add(entry);
    out.push(entry);
  }
  return out;
}

/**
 * The DM's own lists for one generator: pick a field, paste or import entries
 * (one per line), and choose whether they mix with the built-ins or replace them.
 */
export function CustomListsDialog({
  campaignId,
  def,
  options,
  lists,
  onSaved,
}: {
  campaignId: number;
  def: GeneratorDef;
  options: Record<string, string>;
  lists: GeneratorList[];
  onSaved: (list: GeneratorList) => void;
}) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);

  // Names keep one list per kind of name; every other generator, one per field.
  const kindOption = def.options.find((o) => o.key === "kind");
  const targets: Target[] =
    def.id === "names" && kindOption
      ? kindOption.choices.map((c) => ({
          key: `name:${c.value}`,
          label: `${t("gen.field.name")}: ${t(c.labelKey)}`,
        }))
      : def.fields.filter((f) => f.custom).map((f) => ({ key: f.key, label: t(f.labelKey) }));
  const firstKey = def.fields.map((f) => listKeyFor(f, options)).find((k) => k !== null) ?? targets[0]?.key ?? "";

  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(firstKey);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CustomMode>("mix");
  const [saving, setSaving] = useState(false);

  const existing = (key: string) => lists.find((l) => l.fieldKey === key);

  function load(key: string) {
    const list = existing(key);
    setTarget(key);
    setText((list?.entries ?? []).join("\n"));
    setMode(list?.mode ?? "mix");
  }

  const dirty = (() => {
    const list = existing(target);
    return (
      parseEntries(text).join("\n") !== (list?.entries ?? []).join("\n") || mode !== (list?.mode ?? "mix")
    );
  })();

  async function save(): Promise<boolean> {
    const entries = parseEntries(text);
    if (entries.length > MAX_ENTRIES) {
      toast.error(t("gen.custom.tooMany"));
      return false;
    }
    setSaving(true);
    try {
      const list = existing(target);
      const saved = list
        ? await api.patch<GeneratorList>(`/api/generator-lists/${list.id}`, { entries, mode })
        : await api.post<GeneratorList>("/api/generator-lists", {
            campaignId,
            generatorId: def.id,
            fieldKey: target,
            entries,
            mode,
          });
      onSaved(saved);
      setText(saved.entries.join("\n"));
      toast.success(t("gen.custom.saved"));
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("gen.saveFailed"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function switchTarget(key: string) {
    // Switching field keeps what was typed for the old one.
    if (dirty && !(await save())) return;
    load(key);
  }

  async function importFile(file: File) {
    try {
      const incoming = await file.text();
      setText((current) => parseEntries(`${current}\n${incoming}`).join("\n"));
    } catch {
      toast.error(t("gen.custom.importFailed"));
    }
  }

  if (targets.length === 0) return null;
  const count = parseEntries(text).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) load(firstKey);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <ListPlus className="size-4" /> {t("gen.custom.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("gen.custom.button")}: {t(def.nameKey)}
          </DialogTitle>
          <DialogDescription>{t("gen.custom.desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("gen.custom.field")}</Label>
            <Select value={target} onValueChange={(v) => void switchTarget(v)} disabled={saving}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targets.map((tg) => (
                  <SelectItem key={tg.key} value={tg.key}>
                    {tg.label}
                    {existing(tg.key)?.entries.length ? ` (${existing(tg.key)!.entries.length})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="custom-list-entries">{t("gen.custom.entries")}</Label>
              <span className="text-xs text-muted-foreground">
                {t("gen.custom.count")}: {count}
              </span>
            </div>
            <Textarea
              id="custom-list-entries"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={t("gen.custom.placeholder")}
            />
            <input
              ref={fileRef}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importFile(file);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <FileUp className="size-4" /> {t("gen.custom.import")}
            </Button>
          </div>

          <RadioGroup value={mode} onValueChange={(v) => setMode(v as CustomMode)} className="gap-2">
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="mix" /> {t("gen.custom.mix")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="only" /> {t("gen.custom.only")}
            </label>
            <p className="text-xs text-muted-foreground">{t("gen.custom.onlyHint")}</p>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            {t("gen.custom.close")}
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving || !dirty}>
            {saving ? t("common.saving") : t("gen.custom.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
