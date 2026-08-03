"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2 } from "lucide-react";
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
import { CheckboxGroup } from "@/components/shared/checkbox-group";
import { ChipInput } from "@/components/shared/chip-input";
import { api } from "@/lib/client";
import { DEFAULT_CUSTOM_CALENDAR } from "@/lib/constants";
import { SOURCE_BOOKS } from "@/lib/character-options";
import type { Campaign, CustomCalendarConfig } from "@/db/schema";

export function CampaignSettingsForm({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description);
  const [setting, setSetting] = useState(campaign.setting);
  const [calendarType, setCalendarType] = useState(campaign.inWorldCalendarType);
  const [config, setConfig] = useState<CustomCalendarConfig>(
    campaign.customCalendarConfig ?? DEFAULT_CUSTOM_CALENDAR,
  );
  const [rulebooks, setRulebooks] = useState<string[]>(
    // Settings is where a broken campaign gets repaired, so it must survive a
    // row whose json rulebooks column is not an array.
    Array.isArray(campaign.rulebooks) ? campaign.rulebooks : [],
  );

  const bookKeys = new Set(SOURCE_BOOKS.map((b) => b.key));
  const customBooks = rulebooks.filter((b) => !bookKeys.has(b));

  async function save() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setPending(true);
    try {
      await api.patch(`/api/campaigns/${campaign.id}`, {
        name,
        description,
        setting,
        inWorldCalendarType: calendarType,
        customCalendarConfig: calendarType === "custom" ? config : null,
        rulebooks,
      });
      toast.success("Campaign updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  function updateMonth(i: number, patch: Partial<{ name: string; days: number }>) {
    setConfig((c) => ({
      ...c,
      months: c.months.map((m, idx) => (idx === i ? { ...m, ...patch } : m)),
    }));
  }

  return (
    <div className="space-y-6">
      <FormSection title="Campaign details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" required className="sm:col-span-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Setting">
            <Input value={setting} onChange={(e) => setSetting(e.target.value)} />
          </Field>
          <Field label="Calendar type">
            <Select value={calendarType} onValueChange={(v) => setCalendarType(v as "real" | "custom")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="real">Real-world calendar</SelectItem>
                <SelectItem value="custom">Custom in-world calendar</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Rulebooks"
        description="Tick the books your table plays with — character race, class, subclass and background pickers narrow to what those books allow. Leave everything unticked to allow all options."
      >
        <CheckboxGroup
          columns={3}
          options={SOURCE_BOOKS.map((b) => ({ value: b.key, label: b.label }))}
          value={rulebooks}
          onChange={setRulebooks}
        />
        <Field
          label="Homebrew rulebooks"
          hint="Anything you can't find above. These are recorded for reference — the pickers always let you type an option in by hand."
        >
          <ChipInput
            value={customBooks}
            onChange={(next) =>
              setRulebooks([...rulebooks.filter((b) => bookKeys.has(b)), ...next])
            }
            placeholder="Name a homebrew book and press Enter…"
          />
        </Field>
      </FormSection>

      {calendarType === "custom" ? (
        <FormSection title="Custom calendar" description="Define the months of your world's year.">
          <div className="grid gap-3 sm:grid-cols-3 sm:max-w-2xl">
            <Field label="Year label">
              <Input value={config.yearLabel ?? ""} onChange={(e) => setConfig((c) => ({ ...c, yearLabel: e.target.value }))} placeholder="AG, DR…" />
            </Field>
            <Field
              label="First year"
              hint="The epoch your reckoning starts from — weekdays are anchored to day 1 of this year."
            >
              <Input
                type="number"
                value={config.yearOne ?? 1}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    yearOne: Number.isFinite(Number(e.target.value)) && e.target.value !== ""
                      ? Math.trunc(Number(e.target.value))
                      : 1,
                  }))
                }
              />
            </Field>
            <Field label="Weekdays (comma-separated)">
              <Input
                value={(config.weekdays ?? []).join(", ")}
                onChange={(e) => setConfig((c) => ({ ...c, weekdays: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
              />
            </Field>
          </div>
          <div className="mt-3 space-y-2">
            {config.months.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={m.name} onChange={(e) => updateMonth(i, { name: e.target.value })} placeholder="Month name" />
                <Input type="number" min={1} value={m.days} onChange={(e) => updateMonth(i, { days: Number(e.target.value || 1) })} className="w-24" />
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setConfig((c) => ({ ...c, months: c.months.filter((_, idx) => idx !== i) }))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setConfig((c) => ({ ...c, months: [...c.months, { name: "New Month", days: 30 }] }))}>
              <Plus className="size-4" /> Add month
            </Button>
          </div>
        </FormSection>
      ) : null}

      <Button onClick={save} disabled={pending}>
        <Save className="size-4" /> {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
