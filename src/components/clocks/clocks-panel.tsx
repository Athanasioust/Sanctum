"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Hourglass, Minus, Pencil, Plus, Trash2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useT } from "@/components/i18n/i18n-provider";
import { ClockFace } from "@/components/clocks/clock-face";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { Clock } from "@/db/schema";

const CLOCK_COLORS = ["#d4a017", "#dc2626", "#7c3aed", "#2563eb", "#16a34a", "#0891b2"];

type Draft = { name: string; segments: string; color: string; note: string };

/**
 * Progress clocks on the dashboard — "The ritual completes", "The guard grows
 * suspicious". Click a segment to fill up to it (click the last filled one to
 * empty it); the eye toggles whether players see the clock.
 */
export function ClocksPanel({
  campaignId,
  initialClocks,
}: {
  campaignId: number;
  initialClocks: Clock[];
}) {
  const t = useT();
  const router = useRouter();
  const [items, setItems] = useState(initialClocks);
  const [editing, setEditing] = useState<Clock | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: "", segments: "4", color: CLOCK_COLORS[0], note: "" });
  const [deleting, setDeleting] = useState<Clock | null>(null);

  async function patch(clock: Clock, change: Partial<Clock>) {
    const next = { ...clock, ...change };
    setItems((prev) => prev.map((c) => (c.id === clock.id ? next : c)));
    try {
      await api.patch(`/api/clocks/${clock.id}`, change);
    } catch {
      setItems((prev) => prev.map((c) => (c.id === clock.id ? clock : c)));
      toast.error(t("clocks.saveFailed"));
    }
  }

  function clickSegment(clock: Clock, index: number) {
    // Clicking the last filled segment empties it; any other fills up to it.
    const filled = index + 1 === clock.filled ? index : index + 1;
    patch(clock, { filled });
  }

  function openEditor(clock: Clock | "new") {
    setDraft(
      clock === "new"
        ? { name: "", segments: "4", color: CLOCK_COLORS[0], note: "" }
        : { name: clock.name, segments: String(clock.segments), color: clock.color, note: clock.note },
    );
    setEditing(clock);
  }

  async function saveEditor() {
    const name = draft.name.trim();
    if (!name) return;
    const segments = Math.max(2, Math.min(16, Math.round(Number(draft.segments) || 4)));
    const body = { name, segments, color: draft.color, note: draft.note };
    try {
      if (editing === "new") {
        const created = await api.post<Clock>("/api/clocks", { campaignId, ...body });
        setItems((prev) => [...prev, created]);
      } else if (editing) {
        await patch(editing, { ...body, filled: Math.min(editing.filled, segments) });
      }
      setEditing(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("clocks.saveFailed"));
    }
  }

  async function remove(clock: Clock) {
    try {
      await api.delete(`/api/clocks/${clock.id}`);
      setItems((prev) => prev.filter((c) => c.id !== clock.id));
      router.refresh();
    } catch {
      toast.error(t("clocks.saveFailed"));
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Hourglass className="size-4 text-primary" /> {t("clocks.title")}
        </h2>
        <Button size="sm" variant="outline" onClick={() => openEditor("new")}>
          <Plus className="size-4" /> {t("clocks.new")}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("clocks.empty")}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((clock) => (
            <li
              key={clock.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3"
            >
              <ClockFace
                segments={clock.segments}
                filled={clock.filled}
                color={clock.color}
                size={76}
                label={`${clock.name}: ${clock.filled} / ${clock.segments}`}
                onSegmentClick={(i) => clickSegment(clock, i)}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{clock.name}</p>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {clock.filled} / {clock.segments}
                  {clock.filled >= clock.segments ? (
                    <span className="ml-1.5 font-medium text-destructive">{t("clocks.full")}</span>
                  ) : null}
                </p>
                {clock.note ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{clock.note}</p>
                ) : null}
                <div className="mt-1.5 flex items-center gap-0.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => patch(clock, { filled: Math.max(0, clock.filled - 1) })}
                    disabled={clock.filled <= 0}
                    aria-label={t("clocks.unfill")}
                    title={t("clocks.unfill")}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => patch(clock, { filled: Math.min(clock.segments, clock.filled + 1) })}
                    disabled={clock.filled >= clock.segments}
                    aria-label={t("clocks.fill")}
                    title={t("clocks.fill")}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn("size-7", clock.revealToPlayers ? "text-primary" : "text-muted-foreground")}
                    onClick={() => patch(clock, { revealToPlayers: !clock.revealToPlayers })}
                    aria-pressed={clock.revealToPlayers}
                    aria-label={clock.revealToPlayers ? t("clocks.shown") : t("clocks.hidden")}
                    title={clock.revealToPlayers ? t("clocks.shown") : t("clocks.hidden")}
                  >
                    {clock.revealToPlayers ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground"
                    onClick={() => openEditor(clock)}
                    aria-label={t("action.edit")}
                    title={t("action.edit")}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleting(clock)}
                    aria-label={t("action.delete")}
                    title={t("action.delete")}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? t("clocks.new") : t("clocks.edit")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <Field label={t("common.name")}>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder={t("clocks.namePlaceholder")}
                maxLength={120}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEditor();
                }}
              />
            </Field>
            <Field label={t("clocks.segments")}>
              <Input
                type="number"
                min={2}
                max={16}
                value={draft.segments}
                onChange={(e) => setDraft((d) => ({ ...d, segments: e.target.value }))}
              />
            </Field>
            <Field label={t("clocks.color")}>
              <div className="flex flex-wrap gap-2">
                {CLOCK_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, color: c }))}
                    className={cn(
                      "size-6 rounded-full border-2",
                      draft.color === c ? "border-foreground" : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                    aria-pressed={draft.color === c}
                  />
                ))}
              </div>
            </Field>
            <Field label={t("common.notes")}>
              <Textarea
                value={draft.note}
                onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                rows={2}
                maxLength={2000}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t("action.cancel")}
            </Button>
            <Button onClick={saveEditor} disabled={!draft.name.trim()}>
              {t("action.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`${t("action.delete")} ${deleting?.name ?? ""}?`}
        confirmLabel={t("action.delete")}
        destructive
        onConfirm={() => {
          if (deleting) remove(deleting);
        }}
      />
    </section>
  );
}
