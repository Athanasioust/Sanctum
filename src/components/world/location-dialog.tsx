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

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setPending(true);
    const payload = {
      campaignId,
      name: form.name,
      type: form.type,
      description: form.description,
      notes: form.notes,
      parentLocationId: form.parentLocationId === "none" ? null : Number(form.parentLocationId),
    };
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> New Location
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
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
                <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None (top level)</SelectItem>
                  {selectableParents.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </Field>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
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
