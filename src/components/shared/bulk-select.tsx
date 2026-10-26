"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckSquare, Square, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

export type BulkEntity = "characters" | "npcs" | "magicItems" | "quests" | "rumors" | "notes";

/** Selection state for a list: a select mode, the chosen ids, select-all. */
export function useBulkSelection(visibleIds: number[]) {
  const [selecting, setSelecting] = useState(false);
  const [chosen, setChosen] = useState<Set<number>>(new Set());
  // Only what's still on screen counts — a filter change or a delete drops
  // ids from the selection without a separate cleanup step.
  const selected = useMemo(
    () => new Set(visibleIds.filter((id) => chosen.has(id))),
    [visibleIds, chosen],
  );

  return {
    selecting,
    selected,
    start: () => setSelecting(true),
    stop: () => {
      setSelecting(false);
      setChosen(new Set());
    },
    isSelected: (id: number) => selected.has(id),
    toggle: (id: number) =>
      setChosen((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    allSelected: visibleIds.length > 0 && selected.size === visibleIds.length,
    toggleAll: () =>
      setChosen(selected.size === visibleIds.length ? new Set() : new Set(visibleIds)),
    clear: () => setChosen(new Set()),
  };
}

export type BulkSelection = ReturnType<typeof useBulkSelection>;

/**
 * Delete many rows at once with an Undo toast. The server keeps a snapshot
 * (children and links included) so Undo restores them exactly, ids and all.
 */
export function useBulkDelete<T>({
  entity,
  campaignId,
  onDeleted,
  onRestored,
}: {
  entity: BulkEntity;
  campaignId: number;
  /** Drop the rows from local state, for lists that keep their own copy. */
  onDeleted?: (ids: number[]) => void;
  /** Put restored rows back into local state. */
  onRestored?: (rows: T[]) => void;
}) {
  const t = useT();
  const router = useRouter();

  return async function deleteMany(ids: number[]) {
    if (ids.length === 0) return;
    try {
      const { token, deleted } = await api.post<{ token: string; deleted: number[] }>(
        "/api/bulk/delete",
        { entity, campaignId, ids },
      );
      onDeleted?.(deleted);
      router.refresh();
      toast.success(t("bulk.deleted").replace("{count}", String(deleted.length)), {
        duration: 10000,
        action: {
          label: t("bulk.undo"),
          onClick: async () => {
            try {
              const { restored } = await api.post<{ restored: T[] }>("/api/bulk/restore", { token });
              onRestored?.(restored);
              router.refresh();
              toast.success(t("bulk.restored").replace("{count}", String(restored.length)));
            } catch (err) {
              toast.error(err instanceof Error ? err.message : t("bulk.undoFailed"));
            }
          },
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("bulk.failed"));
    }
  };
}

/** "Select" button, or — while selecting — the bulk action bar. */
export function BulkToolbar({
  selection,
  total,
  onDelete,
  className,
}: {
  selection: BulkSelection;
  total: number;
  onDelete: (ids: number[]) => void;
  className?: string;
}) {
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  if (total === 0) return null;

  if (!selection.selecting) {
    return (
      <Button variant="outline" size="sm" onClick={selection.start} className={className}>
        <CheckSquare className="size-4" /> {t("bulk.select")}
      </Button>
    );
  }

  const count = selection.selected.size;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5",
        className,
      )}
      role="toolbar"
      aria-label={t("bulk.toolbar")}
    >
      <button
        type="button"
        onClick={selection.toggleAll}
        className="flex items-center gap-1.5 text-sm hover:text-primary"
      >
        {selection.allSelected ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
        {t("bulk.selectAll")}
      </button>
      <span className="text-sm text-muted-foreground tabular-nums">
        {t("bulk.count").replace("{count}", String(count))}
      </span>
      <Button
        size="sm"
        variant="destructive"
        disabled={count === 0}
        onClick={() => setConfirm(true)}
      >
        <Trash2 className="size-4" /> {t("action.delete")}
      </Button>
      <Button size="sm" variant="ghost" onClick={selection.stop} aria-label={t("action.cancel")}>
        <X className="size-4" /> {t("action.cancel")}
      </Button>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("bulk.confirmTitle").replace("{count}", String(count))}
        description={t("bulk.confirmBody")}
        confirmLabel={t("action.delete")}
        onConfirm={() => {
          onDelete([...selection.selected]);
          selection.stop();
        }}
      />
    </div>
  );
}

/**
 * Laid over a card while its list is in select mode: the whole card toggles
 * (instead of following its link), with a checkbox in the corner. The card
 * needs `relative` positioning.
 */
export function SelectOverlay({
  selection,
  id,
  label,
}: {
  selection: BulkSelection;
  id: number;
  label: string;
}) {
  if (!selection.selecting) return null;
  const on = selection.isSelected(id);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      onClick={() => selection.toggle(id)}
      className={cn(
        "absolute inset-0 z-10 rounded-[inherit] border-2 transition-colors",
        on ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted/20",
      )}
    >
      <span
        className={cn(
          "absolute left-2 top-2 flex size-5 items-center justify-center rounded border",
          on
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/60 bg-background",
        )}
      >
        {on ? <Check className="size-3.5" /> : null}
      </span>
    </button>
  );
}
