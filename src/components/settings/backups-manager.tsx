"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DatabaseBackup, RotateCcw, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { api } from "@/lib/client";
import type { Backup } from "@/db/schema";

export function BackupsManager({ initialBackups }: { initialBackups: Backup[] }) {
  const [backups, setBackups] = useState(initialBackups);
  const [creating, setCreating] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Backup | null>(null);

  async function create() {
    setCreating(true);
    try {
      const row = await api.post<Backup>("/api/backups", { label: "Manual backup" });
      setBackups((prev) => [row, ...prev]);
      toast.success("Backup created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create backup");
    } finally {
      setCreating(false);
    }
  }

  async function restore(backup: Backup) {
    try {
      await api.post(`/api/backups/${backup.id}/restore`);
      toast.success("Backup restored. Restart the app to load the restored data.", {
        duration: 8000,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore");
    }
  }

  async function remove(backup: Backup) {
    try {
      await api.delete(`/api/backups/${backup.id}`);
      setBackups((prev) => prev.filter((b) => b.id !== backup.id));
      toast.success("Backup deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          A snapshot is taken automatically each day the app starts.
        </p>
        <Button onClick={create} disabled={creating} variant="outline">
          <Plus className="size-4" /> {creating ? "Backing up…" : "Backup now"}
        </Button>
      </div>

      {backups.length === 0 ? (
        <EmptyState icon={DatabaseBackup} title="No backups yet" description="Create a manual backup, or one will be made automatically on next startup." />
      ) : (
        <div className="space-y-2">
          {backups.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{b.label || "Backup"}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(b.createdAt), "PPp")} · {b.filePath}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => setRestoreTarget(b)}>
                  <RotateCcw className="size-4" /> Restore
                </Button>
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(b)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(o) => !o && setRestoreTarget(null)}
        title="Restore this backup?"
        description="The current database is snapshotted first as a safety backup, then replaced. Restart the app afterwards to load the restored data."
        confirmLabel="Restore"
        destructive={false}
        onConfirm={() => {
          if (restoreTarget) return restore(restoreTarget);
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this backup?"
        description="The backup file will be permanently removed."
        onConfirm={() => {
          if (deleteTarget) return remove(deleteTarget);
        }}
      />
    </div>
  );
}
