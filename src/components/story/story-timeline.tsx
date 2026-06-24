"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, ScrollText, MapPin, Users, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { CheckboxGroup } from "@/components/shared/checkbox-group";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityActions } from "@/components/shared/entity-actions";
import { api } from "@/lib/client";
import { STORY_EVENT_TYPES } from "@/lib/constants";
import { statusClasses } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { StoryEvent } from "@/db/schema";

type Option = { id: number; name: string };

const FILTERS = [
  { key: "all", label: "All" },
  ...STORY_EVENT_TYPES.map((t) => ({ key: t.key, label: t.label })),
];

export function StoryTimeline({
  campaignId,
  initialEvents,
  npcs,
  locations,
}: {
  campaignId: number;
  initialEvents: StoryEvent[];
  npcs: Option[];
  locations: Option[];
}) {
  const [events, setEvents] = useState<StoryEvent[]>(initialEvents);
  const [filter, setFilter] = useState("all");

  const npcName = (id: number) => npcs.find((n) => n.id === id)?.name ?? `NPC #${id}`;
  const locName = (id: number) => locations.find((l) => l.id === id)?.name ?? `Location #${id}`;

  function upsert(e: StoryEvent) {
    setEvents((prev) =>
      prev.some((x) => x.id === e.id) ? prev.map((x) => (x.id === e.id ? e : x)) : [e, ...prev],
    );
  }

  async function toggleStatus(e: StoryEvent) {
    const status = e.status === "open" ? "resolved" : "open";
    upsert({ ...e, status });
    try {
      await api.patch(`/api/story-events/${e.id}`, { status });
    } catch {
      toast.error("Failed to update");
      upsert(e);
    }
  }

  const filtered = (filter === "all" ? events : events.filter((e) => e.eventType === filter)).sort(
    (a, b) => {
      const an = a.sessionNumber ?? -1;
      const bn = b.sessionNumber ?? -1;
      if (an !== bn) return bn - an;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap rounded-lg border border-border bg-card p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <EventDialog campaignId={campaignId} npcs={npcs} locations={locations} onSaved={upsert} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nothing here yet"
          description="Log sessions, track plot threads and mark milestones as your story unfolds."
        />
      ) : (
        <div className="relative space-y-3 border-l border-border pl-6">
          {filtered.map((e) => {
            const type = STORY_EVENT_TYPES.find((t) => t.key === e.eventType);
            return (
              <div key={e.id} className="relative rounded-xl border border-border bg-card p-4">
                <span className="absolute -left-[27px] top-5 size-3 rounded-full border-2 border-background bg-primary" />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{e.title}</h3>
                      <Badge variant="secondary">{type?.label ?? e.eventType}</Badge>
                      {e.sessionNumber != null ? (
                        <Badge variant="outline">Session {e.sessionNumber}</Badge>
                      ) : null}
                      {e.eventType === "plot_thread" ? (
                        <button onClick={() => toggleStatus(e)}>
                          <Badge className={cn("capitalize gap-1", statusClasses(e.status))}>
                            {e.status === "resolved" ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
                            {e.status}
                          </Badge>
                        </button>
                      ) : null}
                    </div>
                    {(e.inWorldDate || e.realDate) ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[e.inWorldDate, e.realDate].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <EventDialog
                      campaignId={campaignId}
                      npcs={npcs}
                      locations={locations}
                      event={e}
                      onSaved={upsert}
                      trigger={<Button size="sm" variant="outline">Edit</Button>}
                    />
                    <EntityActions deleteEndpoint={`/api/story-events/${e.id}`} entityLabel="Event" />
                  </div>
                </div>
                {e.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{e.description}</p>
                ) : null}
                {(e.linkedNpcIds.length > 0 || e.linkedLocationIds.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {e.linkedNpcIds.map((id) => (
                      <Badge key={`n${id}`} variant="secondary" className="gap-1">
                        <Users className="size-3" /> {npcName(id)}
                      </Badge>
                    ))}
                    {e.linkedLocationIds.map((id) => (
                      <Badge key={`l${id}`} variant="secondary" className="gap-1">
                        <MapPin className="size-3" /> {locName(id)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EventDialog({
  campaignId,
  npcs,
  locations,
  event,
  onSaved,
  trigger,
}: {
  campaignId: number;
  npcs: Option[];
  locations: Option[];
  event?: StoryEvent;
  onSaved: (e: StoryEvent) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: event?.title ?? "",
    description: event?.description ?? "",
    eventType: event?.eventType ?? "event",
    status: event?.status ?? "open",
    sessionNumber: event?.sessionNumber != null ? String(event.sessionNumber) : "",
    inWorldDate: event?.inWorldDate ?? "",
    linkedNpcIds: (event?.linkedNpcIds ?? []).map(String),
    linkedLocationIds: (event?.linkedLocationIds ?? []).map(String),
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setPending(true);
    const payload = {
      campaignId,
      title: form.title,
      description: form.description,
      eventType: form.eventType,
      status: form.status,
      sessionNumber: form.sessionNumber ? Number(form.sessionNumber) : null,
      inWorldDate: form.inWorldDate || null,
      linkedNpcIds: form.linkedNpcIds.map(Number),
      linkedLocationIds: form.linkedLocationIds.map(Number),
    };
    try {
      const saved = event
        ? // On edit the original real-world timestamp is preserved (omitted here).
          await api.patch<StoryEvent>(`/api/story-events/${event.id}`, payload)
        : // New events are stamped with the real date from the system clock.
          await api.post<StoryEvent>("/api/story-events", {
            ...payload,
            realDate: format(new Date(), "yyyy-MM-dd"),
          });
      toast.success(event ? "Event saved" : "Event created");
      onSaved(saved);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> New Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "New story event"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Type">
              <Select value={form.eventType} onValueChange={(v) => set("eventType", v as typeof form.eventType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STORY_EVENT_TYPES.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            {form.eventType === "plot_thread" ? (
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => set("status", v as typeof form.status)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
            <Field label="Session #">
              <Input type="number" value={form.sessionNumber} onChange={(e) => set("sessionNumber", e.target.value)} />
            </Field>
          </div>
          <Field label="In-world date" hint="The real-world date is recorded automatically">
            <Input value={form.inWorldDate} onChange={(e) => set("inWorldDate", e.target.value)} placeholder="15th of Mirtul" />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} />
          </Field>
          {npcs.length > 0 ? (
            <Field label="Linked NPCs">
              <CheckboxGroup columns={2} options={npcs.map((n) => ({ value: String(n.id), label: n.name }))} value={form.linkedNpcIds} onChange={(v) => set("linkedNpcIds", v)} />
            </Field>
          ) : null}
          {locations.length > 0 ? (
            <Field label="Linked Locations">
              <CheckboxGroup columns={2} options={locations.map((l) => ({ value: String(l.id), label: l.name }))} value={form.linkedLocationIds} onChange={(v) => set("linkedLocationIds", v)} />
            </Field>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
