"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { SaveStatus, useAutosave } from "@/components/shared/autosave";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";
import { LOCATION_TYPES } from "@/lib/constants";
import type { Location } from "@/db/schema";

type Option = { id: number; name: string };

export function LocationDialog({
  campaignId,
  location,
  parentOptions,
  defaultParentId,
  trigger,
}: {
  campaignId: number;
  location?: Location;
  parentOptions: Option[];
  defaultParentId?: number | null;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: location?.name ?? "",
    type: location?.type ?? "location",
    parentLocationId:
      location?.parentLocationId != null
        ? String(location.parentLocationId)
        : defaultParentId != null
          ? String(defaultParentId)
          : "none",
    description: location?.description ?? "",
    notes: location?.notes ?? "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const payload = {
    campaignId,
    name: form.name,
    type: form.type,
    description: form.description,
    notes: form.notes,
    parentLocationId: form.parentLocationId === "none" ? null : Number(form.parentLocationId),
  };

  // Editing an existing location saves as you go (and on blur and close), so
  // a stray click outside the dialog can never throw the notes away.
  const autosave = useAutosave({
    data: payload,
    enabled: open && Boolean(location),
    canSave: (d) => d.name.trim().length > 0,
    save: (d) => api.patch(`/api/locations/${location!.id}`, d),
  });

  async function changeOpen(next: boolean) {
    if (next || !location) {
      setOpen(next);
      return;
    }
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const ok = await autosave.flush();
    if (!ok) {
      toast.error(t("autosave.failed"));
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setPending(true);
    try {
      if (location) await api.patch(`/api/locations/${location.id}`, payload);
      else await api.post("/api/locations", payload);
      toast.success(location ? "Location saved" : "Location created");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  const selectableParents = parentOptions.filter((o) => o.id !== location?.id);

  return (
    <Dialog open={open} onOpenChange={(o) => void changeOpen(o)}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> New Location
          </Button>
        )}
      </DialogTrigger>
      <DialogContent guardUnsaved={!location} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{location ? "Edit location" : "New location"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Parent location">
              <Select value={form.parentLocationId} onValueChange={(v) => set("parentLocationId", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="-" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top level)</SelectItem>
                  {selectableParents.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              onBlur={() => void autosave.flush()}
              rows={3}
            />
          </Field>
          <Field label="Notes" hint={t("location.notesHint")}>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              onBlur={() => void autosave.flush()}
              rows={4}
            />
          </Field>
        </div>
        {location ? (
          <DialogFooter className="items-center sm:justify-between">
            <SaveStatus state={autosave} />
            <Button onClick={() => void changeOpen(false)} disabled={autosave.saving}>{t("autosave.done")}</Button>
          </DialogFooter>
        ) : (
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
