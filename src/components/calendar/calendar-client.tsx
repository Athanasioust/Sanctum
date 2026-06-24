"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays } from "lucide-react";
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
import { CALENDAR_EVENT_TYPES } from "@/lib/constants";
import {
  canonicalCustomDate,
  parseCustomDate,
  formatCustomDate,
  customWeekday,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CustomCalendarConfig } from "@/db/schema";

const REAL_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DraftContext = {
  realDate: string | null;
  inWorldDate: string | null;
  displayDate: string;
};

export function CalendarClient({
  campaignId,
  calendarType,
  customConfig,
  initialEvents,
  initialInWorldDate,
}: {
  campaignId: number;
  calendarType: "real" | "custom";
  customConfig: CustomCalendarConfig | null;
  initialEvents: CalendarEvent[];
  initialInWorldDate: string | null;
}) {
  const hasCustom = calendarType === "custom" && !!customConfig;
  const [view, setView] = useState<"real" | "custom">(hasCustom ? "custom" : "real");
  const [events, setEvents] = useState(initialEvents);
  const [inWorldDate, setInWorldDate] = useState(initialInWorldDate ?? "");
  const [savingDate, setSavingDate] = useState(false);

  // Real calendar state
  const [realMonth, setRealMonth] = useState(() => new Date());
  // Custom calendar state
  const [customYear, setCustomYear] = useState(customConfig?.yearOne ?? 1);
  const [customMonthIndex, setCustomMonthIndex] = useState(0);

  const [dialog, setDialog] = useState<{
    open: boolean;
    event?: CalendarEvent;
    ctx?: DraftContext;
  }>({ open: false });

  function upsert(e: CalendarEvent) {
    setEvents((prev) =>
      prev.some((x) => x.id === e.id) ? prev.map((x) => (x.id === e.id ? e : x)) : [...prev, e],
    );
  }

  async function deleteEvent(id: number) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      await api.delete(`/api/calendar-events/${id}`);
      toast.success("Event deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function saveInWorldDate() {
    setSavingDate(true);
    try {
      await api.patch(`/api/campaigns/${campaignId}`, { currentInWorldDate: inWorldDate });
      toast.success("Current in-world date updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSavingDate(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        {hasCustom ? (
          <div className="inline-flex rounded-lg border border-border bg-background p-1">
            <ViewTab active={view === "custom"} onClick={() => setView("custom")}>In-world</ViewTab>
            <ViewTab active={view === "real"} onClick={() => setView("real")}>Real</ViewTab>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Real-world calendar</span>
        )}
        {hasCustom ? (
          <div className="flex items-end gap-2">
            <Field label="Current in-world date" className="w-56">
              <Input value={inWorldDate} onChange={(e) => setInWorldDate(e.target.value)} placeholder="15th of Mirtul, 1492 AG" />
            </Field>
            <Button variant="outline" onClick={saveInWorldDate} disabled={savingDate}>
              {savingDate ? "Saving…" : "Set"}
            </Button>
          </div>
        ) : (
          <div className="text-right">
            <p className="text-xs uppercase text-muted-foreground">Today</p>
            <p className="font-medium">{format(new Date(), "PPP")}</p>
          </div>
        )}
      </div>

      {view === "real" || !hasCustom ? (
        <RealCalendar
          month={realMonth}
          events={events}
          onPrev={() => setRealMonth((m) => subMonths(m, 1))}
          onNext={() => setRealMonth((m) => addMonths(m, 1))}
          onDayClick={(date) =>
            setDialog({
              open: true,
              ctx: { realDate: date, inWorldDate: null, displayDate: date },
            })
          }
          onEventClick={(e) => setDialog({ open: true, event: e, ctx: undefined })}
          onDelete={deleteEvent}
        />
      ) : (
        <CustomCalendar
          config={customConfig!}
          year={customYear}
          monthIndex={customMonthIndex}
          events={events}
          onPrev={() => {
            if (customMonthIndex === 0) {
              setCustomMonthIndex(customConfig!.months.length - 1);
              setCustomYear((y) => y - 1);
            } else setCustomMonthIndex((i) => i - 1);
          }}
          onNext={() => {
            if (customMonthIndex === customConfig!.months.length - 1) {
              setCustomMonthIndex(0);
              setCustomYear((y) => y + 1);
            } else setCustomMonthIndex((i) => i + 1);
          }}
          onDayClick={(day) => {
            const d = { year: customYear, monthIndex: customMonthIndex, day };
            setDialog({
              open: true,
              ctx: {
                realDate: null,
                inWorldDate: canonicalCustomDate(d),
                displayDate: formatCustomDate(d, customConfig!),
              },
            });
          }}
          onEventClick={(e) => setDialog({ open: true, event: e, ctx: undefined })}
          onDelete={deleteEvent}
        />
      )}

      <EventDialog
        campaignId={campaignId}
        state={dialog}
        config={customConfig}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onSaved={upsert}
      />
    </div>
  );
}

function ViewTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function CalendarFrame({
  title,
  weekdays,
  onPrev,
  onNext,
  children,
}: {
  title: string;
  weekdays: string[];
  onPrev: () => void;
  onNext: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <Button size="icon" variant="outline" onClick={onPrev} aria-label="Previous"><ChevronLeft className="size-4" /></Button>
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <Button size="icon" variant="outline" onClick={onNext} aria-label="Next"><ChevronRight className="size-4" /></Button>
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${weekdays.length}, minmax(0, 1fr))` }}
      >
        {weekdays.map((w) => (
          <div key={w} className="pb-1 text-center text-xs font-medium uppercase text-muted-foreground">{w}</div>
        ))}
        {children}
      </div>
    </div>
  );
}

function DayCell({
  label,
  events,
  onClick,
  onEventClick,
}: {
  label: number;
  events: CalendarEvent[];
  onClick: () => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  return (
    <div className="group min-h-20 rounded-lg border border-border bg-background/40 p-1.5 transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <button onClick={onClick} className="opacity-0 transition-opacity group-hover:opacity-100" aria-label="Add event">
          <Plus className="size-3.5 text-primary" />
        </button>
      </div>
      <div className="mt-1 space-y-0.5">
        {events.slice(0, 3).map((e) => (
          <button
            key={e.id}
            onClick={() => onEventClick(e)}
            className="block w-full truncate rounded bg-primary/15 px-1 py-0.5 text-left text-[11px] text-primary"
          >
            {e.title}
          </button>
        ))}
        {events.length > 3 ? <span className="text-[10px] text-muted-foreground">+{events.length - 3} more</span> : null}
      </div>
    </div>
  );
}

function RealCalendar({
  month,
  events,
  onPrev,
  onNext,
  onDayClick,
  onEventClick,
  onDelete,
}: {
  month: Date;
  events: CalendarEvent[];
  onPrev: () => void;
  onNext: () => void;
  onDayClick: (isoDate: string) => void;
  onEventClick: (e: CalendarEvent) => void;
  onDelete: (id: number) => void;
}) {
  const start = startOfMonth(month);
  const days = eachDayOfInterval({ start, end: endOfMonth(month) });
  const leading = getDay(start);
  const monthEvents = events.filter((e) => e.realDate && e.realDate.startsWith(format(month, "yyyy-MM")));

  return (
    <>
      <CalendarFrame title={format(month, "MMMM yyyy")} weekdays={REAL_WEEKDAYS} onPrev={onPrev} onNext={onNext}>
        {Array.from({ length: leading }).map((_, i) => (
          <div key={`b${i}`} />
        ))}
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          return (
            <DayCell
              key={iso}
              label={day.getDate()}
              events={events.filter((e) => e.realDate === iso)}
              onClick={() => onDayClick(iso)}
              onEventClick={onEventClick}
            />
          );
        })}
      </CalendarFrame>
      <MonthEventList events={monthEvents} onDelete={onDelete} onEventClick={onEventClick} dateOf={(e) => e.realDate ?? ""} />
    </>
  );
}

function CustomCalendar({
  config,
  year,
  monthIndex,
  events,
  onPrev,
  onNext,
  onDayClick,
  onEventClick,
  onDelete,
}: {
  config: CustomCalendarConfig;
  year: number;
  monthIndex: number;
  events: CalendarEvent[];
  onPrev: () => void;
  onNext: () => void;
  onDayClick: (day: number) => void;
  onEventClick: (e: CalendarEvent) => void;
  onDelete: (id: number) => void;
}) {
  const month = config.months[monthIndex];
  const weekdays = config.weekdays ?? ["1", "2", "3", "4", "5", "6", "7"];
  const leading = customWeekday({ year, monthIndex, day: 1 }, config);
  const label = `${month.name}, ${year}${config.yearLabel ? ` ${config.yearLabel}` : ""}`;

  const monthEvents = events.filter((e) => {
    const d = parseCustomDate(e.inWorldDate);
    return d && d.year === year && d.monthIndex === monthIndex;
  });

  return (
    <>
      <CalendarFrame title={label} weekdays={weekdays} onPrev={onPrev} onNext={onNext}>
        {Array.from({ length: leading }).map((_, i) => (
          <div key={`b${i}`} />
        ))}
        {Array.from({ length: month.days }, (_, i) => i + 1).map((day) => (
          <DayCell
            key={day}
            label={day}
            events={events.filter((e) => {
              const d = parseCustomDate(e.inWorldDate);
              return d && d.year === year && d.monthIndex === monthIndex && d.day === day;
            })}
            onClick={() => onDayClick(day)}
            onEventClick={onEventClick}
          />
        ))}
      </CalendarFrame>
      <MonthEventList
        events={monthEvents}
        onDelete={onDelete}
        onEventClick={onEventClick}
        dateOf={(e) => {
          const d = parseCustomDate(e.inWorldDate);
          return d ? formatCustomDate(d, config) : "";
        }}
      />
    </>
  );
}

function MonthEventList({
  events,
  onDelete,
  onEventClick,
  dateOf,
}: {
  events: CalendarEvent[];
  onDelete: (id: number) => void;
  onEventClick: (e: CalendarEvent) => void;
  dateOf: (e: CalendarEvent) => string;
}) {
  if (events.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">No events this month. Click a day to add one.</p>;
  }
  return (
    <div className="space-y-2">
      {events.map((e) => {
        const type = CALENDAR_EVENT_TYPES.find((t) => t.key === e.eventType);
        return (
          <div key={e.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <button className="min-w-0 text-left" onClick={() => onEventClick(e)}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{e.title}</span>
                <Badge variant="secondary">{type?.label ?? e.eventType}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{dateOf(e)}</p>
            </button>
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => onDelete(e.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function EventDialog({
  campaignId,
  state,
  config,
  onOpenChange,
  onSaved,
}: {
  campaignId: number;
  state: { open: boolean; event?: CalendarEvent; ctx?: DraftContext };
  config: CustomCalendarConfig | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (e: CalendarEvent) => void;
}) {
  const { event, ctx } = state;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("other");
  const [pending, setPending] = useState(false);
  const [initId, setInitId] = useState<number | "new" | null>(null);

  // Sync form when the dialog target changes.
  const targetKey = event ? event.id : ctx ? "new" : null;
  if (state.open && targetKey !== initId) {
    setInitId(targetKey);
    setTitle(event?.title ?? "");
    setDescription(event?.description ?? "");
    setEventType(event?.eventType ?? "other");
  }

  const displayDate = event
    ? event.realDate ||
      (() => {
        const d = parseCustomDate(event.inWorldDate);
        return d && config ? formatCustomDate(d, config) : event.inWorldDate ?? "";
      })()
    : ctx?.displayDate ?? "";

  async function save() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setPending(true);
    try {
      let saved: CalendarEvent;
      if (event) {
        saved = await api.patch<CalendarEvent>(`/api/calendar-events/${event.id}`, {
          title,
          description,
          eventType,
        });
      } else {
        saved = await api.post<CalendarEvent>("/api/calendar-events", {
          campaignId,
          title,
          description,
          eventType,
          realDate: ctx?.realDate ?? null,
          inWorldDate: ctx?.inWorldDate ?? null,
        });
      }
      toast.success("Event saved");
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            {event ? "Edit event" : "New event"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {displayDate ? <p className="text-sm text-muted-foreground">{displayDate}</p> : null}
          <Field label="Title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </Field>
          <Field label="Type">
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CALENDAR_EVENT_TYPES.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
