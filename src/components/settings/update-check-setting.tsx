"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";

/**
 * Opt-in "is there a newer version?" check. Off by default: until this is
 * switched on, Sanctum makes no network request at all.
 */
export function UpdateCheckSetting() {
  const t = useT();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ enabled: boolean }>("/api/update-check")
      .then((data) => {
        if (!cancelled) setEnabled(data.enabled);
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(next: boolean) {
    setSaving(true);
    try {
      const data = await api.put<{ enabled: boolean }>("/api/update-check", { enabled: next });
      setEnabled(data.enabled);
      toast.success(t(data.enabled ? "update.settingOn" : "update.settingOff"));
    } catch {
      toast.error(t("update.settingFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <BellRing className="size-4 text-primary" /> {t("update.settingLabel")}
        </h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("update.settingHint")}</p>
      </div>
      <Switch
        checked={enabled ?? false}
        onCheckedChange={toggle}
        disabled={enabled === null || saving}
        aria-label={t("update.settingLabel")}
        className="mt-1.5"
      />
    </div>
  );
}
