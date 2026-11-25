"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useT } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export type Autosave = {
  /** The data differs from what was last saved. */
  dirty: boolean;
  saving: boolean;
  failed: boolean;
  /** Something has been saved since the editor opened. */
  savedOnce: boolean;
  /**
   * Save now if anything changed. Resolves true when everything is saved,
   * false when the data can't be saved yet (see `canSave`) or the save failed.
   */
  flush: () => Promise<boolean>;
};

/**
 * Saves `data` a moment after it stops changing, and whenever `flush()` is
 * called (on blur, on close). Comparison is by JSON, so `data` can be a fresh
 * object every render. The first value seen is taken as already saved.
 */
export function useAutosave<T>({
  data,
  save,
  enabled = true,
  delay = 800,
  canSave,
}: {
  data: T;
  save: (data: T) => Promise<unknown>;
  enabled?: boolean;
  delay?: number;
  /** Return false to hold off (e.g. a required name is empty). */
  canSave?: (data: T) => boolean;
}): Autosave {
  const json = JSON.stringify(data);
  const [savedJson, setSavedJson] = useState(json);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  // Latest inputs for timers and handlers, updated after each render.
  const latest = useRef({ json, data, save, canSave, savedJson });
  useEffect(() => {
    latest.current = { json, data, save, canSave, savedJson };
  });
  const inflight = useRef<Promise<boolean> | null>(null);

  const flush = useCallback(async (): Promise<boolean> => {
    // One save at a time; a change made during a save is picked up after it.
    while (inflight.current) await inflight.current;
    const { json: current, data: value, save: run, canSave: check, savedJson: saved } = latest.current;
    if (current === saved) return true;
    if (check && !check(value)) return false;
    setSaving(true);
    const attempt = run(value)
      .then(() => {
        latest.current.savedJson = current;
        setSavedJson(current);
        setFailed(false);
        setSavedOnce(true);
        return true;
      })
      .catch(() => {
        setFailed(true);
        return false;
      })
      .finally(() => {
        inflight.current = null;
        setSaving(false);
      });
    inflight.current = attempt;
    return attempt;
  }, []);

  useEffect(() => {
    if (!enabled || json === savedJson) return;
    const timer = setTimeout(() => void flush(), delay);
    return () => clearTimeout(timer);
  }, [json, savedJson, enabled, delay, flush]);

  // Leaving the page (or closing the editor) mid-debounce still saves.
  useEffect(() => {
    if (!enabled) return;
    return () => void flush();
  }, [enabled, flush]);

  return { dirty: json !== savedJson, saving, failed, savedOnce, flush };
}

/** A small "Saving… / Saved / Unsaved changes" line for an autosaving editor. */
export function SaveStatus({ state, className }: { state: Autosave; className?: string }) {
  const t = useT();
  const { saving, failed, dirty, savedOnce } = state;
  let icon: React.ReactNode = null;
  let label = "";
  if (saving) {
    icon = <Loader2 className="size-3.5 animate-spin" />;
    label = t("autosave.saving");
  } else if (failed) {
    icon = <AlertCircle className="size-3.5" />;
    label = t("autosave.failed");
  } else if (dirty) {
    label = t("autosave.unsaved");
  } else if (savedOnce) {
    icon = <Check className="size-3.5" />;
    label = t("autosave.saved");
  } else {
    label = t("autosave.on");
  }
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        failed ? "text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}
