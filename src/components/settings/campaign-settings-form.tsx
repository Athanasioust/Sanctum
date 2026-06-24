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
import { api } from "@/lib/client";
import { DEFAULT_CUSTOM_CALENDAR } from "@/lib/constants";
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

      {calendarType === "custom" ? (
        <FormSection title="Custom calendar" description="Define the months of your world's year.">
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <Field label="Year label">
              <Input value={config.yearLabel ?? ""} onChange={(e) => setConfig((c) => ({ ...c, yearLabel: e.target.value }))} placeholder="AG, DR…" />
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
