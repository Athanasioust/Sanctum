"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ClipboardList, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityActions } from "@/components/shared/entity-actions";
import { api } from "@/lib/client";
import { statusClasses } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { SessionPrep } from "@/db/schema";

export function SessionsClient({
  campaignId,
  initialSessions,
}: {
  campaignId: number;
  initialSessions: SessionPrep[];
}) {
  const [sessions, setSessions] = useState(initialSessions);

  const sorted = [...sessions].sort(
    (a, b) => (b.sessionNumber ?? 0) - (a.sessionNumber ?? 0),
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewSessionDialog campaignId={campaignId} onSaved={(s) => setSessions((p) => [...p, s])} />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No sessions yet"
          description="Plan your next session: encounters, NPCs, plot beats and private notes."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((s) => {
            const total = s.plotPoints.length;
            const done = s.plotPoints.filter((p) => p.checked).length;
            return (
              <div key={s.id} className="group relative rounded-xl border border-border bg-card transition-colors hover:border-primary/50">
                <Link href={`/campaign/${campaignId}/sessions/${s.id}`} className="block p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-lg font-semibold">
                      {s.sessionNumber != null ? `Session ${s.sessionNumber}` : "Session"}
                    </h3>
                    <Badge className={cn("capitalize", statusClasses(s.status))}>{s.status}</Badge>
                  </div>
                  {s.sessionDate ? (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <CalendarDays className="size-3.5" /> {s.sessionDate}
                    </p>
                  ) : null}
                  {total > 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Plot points: {done}/{total}
                    </p>
                  ) : null}
                  {s.dmNotes ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.dmNotes}</p>
                  ) : null}
                </Link>
                <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <EntityActions deleteEndpoint={`/api/session-preps/${s.id}`} entityLabel="Session" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewSessionDialog({
  campaignId,
  onSaved,
}: {
  campaignId: number;
  onSaved: (s: SessionPrep) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [sessionNumber, setSessionNumber] = useState("");
  const [sessionDate, setSessionDate] = useState("");

  async function save() {
    setPending(true);
    try {
      const saved = await api.post<SessionPrep>("/api/session-preps", {
        campaignId,
        sessionNumber: sessionNumber ? Number(sessionNumber) : null,
        sessionDate: sessionDate || null,
        status: "planned",
      });
      toast.success("Session created");
      onSaved(saved);
      setOpen(false);
      setSessionNumber("");
      setSessionDate("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" /> New Session</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Plan a session</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Session number">
            <Input type="number" value={sessionNumber} onChange={(e) => setSessionNumber(e.target.value)} placeholder="12" />
          </Field>
          <Field label="Date">
            <Input value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} placeholder="2026-06-30" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending ? "Creating…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
