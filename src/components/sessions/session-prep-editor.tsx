"use client";

import { useState } from "react";
import { Save, Plus, Trash2, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Field, FormSection } from "@/components/shared/form";
import { CheckboxGroup } from "@/components/shared/checkbox-group";
import { api } from "@/lib/client";
import { statusClasses } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { SessionPrep, PlotPoint } from "@/db/schema";

type Option = { id: number; name: string };

export function SessionPrepEditor({
  session,
  bestiary,
  npcs,
}: {
  session: SessionPrep;
  bestiary: Option[];
  npcs: Option[];
}) {
  const [status, setStatus] = useState(session.status);
  const [sessionNumber, setSessionNumber] = useState(
    session.sessionNumber != null ? String(session.sessionNumber) : "",
  );
  const [sessionDate, setSessionDate] = useState(session.sessionDate ?? "");
  const [plotPoints, setPlotPoints] = useState<PlotPoint[]>(session.plotPoints);
  const [dmNotes, setDmNotes] = useState(session.dmNotes);
  const [plannedEncounters, setPlannedEncounters] = useState(session.plannedEncounters.map(String));
  const [plannedNpcs, setPlannedNpcs] = useState(session.plannedNpcs.map(String));
  const [pending, setPending] = useState(false);

  function payload(extra?: Partial<SessionPrep>) {
    return {
      status,
      sessionNumber: sessionNumber ? Number(sessionNumber) : null,
      sessionDate: sessionDate || null,
      plotPoints,
      dmNotes,
      plannedEncounters: plannedEncounters.map(Number),
      plannedNpcs: plannedNpcs.map(Number),
      ...extra,
    };
  }

  async function save() {
    setPending(true);
    try {
      await api.patch(`/api/session-preps/${session.id}`, payload());
      toast.success("Session saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  async function toggleStatus() {
    const next = status === "planned" ? "completed" : "planned";
    setStatus(next);
    try {
      await api.patch(`/api/session-preps/${session.id}`, payload({ status: next }));
      toast.success(next === "completed" ? "Marked completed" : "Reopened");
    } catch {
      toast.error("Failed to update status");
      setStatus(status);
    }
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {sessionNumber ? `Session ${sessionNumber}` : "Session"}
          </h1>
          <Badge className={cn("capitalize", statusClasses(status))}>{status}</Badge>
        </div>
        <Button variant={status === "completed" ? "outline" : "default"} onClick={toggleStatus}>
          {status === "completed" ? (
            <><RotateCcw className="size-4" /> Reopen</>
          ) : (
            <><CheckCircle2 className="size-4" /> Mark completed</>
          )}
        </Button>
      </div>

      <FormSection title="Details">
        <div className="grid grid-cols-2 gap-4 sm:max-w-md">
          <Field label="Session number">
            <Input type="number" value={sessionNumber} onChange={(e) => setSessionNumber(e.target.value)} />
          </Field>
          <Field label="Date">
            <Input value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} placeholder="2026-06-30" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Plot points" description="A checklist of beats to hit this session.">
        <div className="space-y-2">
          {plotPoints.map((pp, i) => (
            <div key={i} className="flex items-center gap-2">
              <Checkbox
                checked={pp.checked}
                onCheckedChange={(c) =>
                  setPlotPoints((prev) => prev.map((x, idx) => (idx === i ? { ...x, checked: c === true } : x)))
                }
              />
              <Input
                value={pp.text}
                onChange={(e) =>
                  setPlotPoints((prev) => prev.map((x, idx) => (idx === i ? { ...x, text: e.target.value } : x)))
                }
                className={cn(pp.checked && "text-muted-foreground line-through")}
                placeholder="Plot point…"
              />
              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setPlotPoints((p) => p.filter((_, idx) => idx !== i))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setPlotPoints((p) => [...p, { text: "", checked: false }])}>
            <Plus className="size-4" /> Add plot point
          </Button>
        </div>
      </FormSection>

      {bestiary.length > 0 ? (
        <FormSection title="Planned encounters" description="Bestiary templates you expect to use.">
          <CheckboxGroup columns={3} options={bestiary.map((b) => ({ value: String(b.id), label: b.name }))} value={plannedEncounters} onChange={setPlannedEncounters} />
        </FormSection>
      ) : null}

      {npcs.length > 0 ? (
        <FormSection title="Planned NPCs">
          <CheckboxGroup columns={3} options={npcs.map((n) => ({ value: String(n.id), label: n.name }))} value={plannedNpcs} onChange={setPlannedNpcs} />
        </FormSection>
      ) : null}

      <FormSection title="DM private notes">
        <Textarea value={dmNotes} onChange={(e) => setDmNotes(e.target.value)} rows={8} placeholder="Secrets, reminders, read-aloud text…" />
      </FormSection>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-5 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-end">
          <Button onClick={save} disabled={pending}>
            <Save className="size-4" /> {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
