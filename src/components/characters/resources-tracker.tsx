"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, BatteryCharging } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { CharacterResource, ResourceRecharge } from "@/db/schema";

/** Above this many uses, pips stop being readable and a counter takes over. */
const MAX_PIPS = 10;

const RECHARGE_KEYS = {
  short: "resources.short",
  long: "resources.long",
  dawn: "resources.dawn",
  other: "resources.other",
} as const;

/**
 * Limited-use abilities that aren't spell slots — Channel Divinity, Second
 * Wind, Rage. The rest buttons in Hit Dice & Rests restore them by recharge;
 * this panel is for spending them and setting them up.
 */
export function ResourcesTracker({
  characterId,
  resources,
}: {
  characterId: number;
  resources: CharacterResource[];
}) {
  const t = useT();
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Clicks show immediately; the server copy arrives with the refresh.
  const [shown, setShown] = useOptimistic(
    resources,
    (current, change: { id: number; used: number }) =>
      current.map((r) => (r.id === change.id ? { ...r, used: change.used } : r)),
  );
  const [name, setName] = useState("");
  const [max, setMax] = useState("1");
  const [recharge, setRecharge] = useState<ResourceRecharge>("long");

  function setUsed(resource: CharacterResource, used: number) {
    const next = Math.max(0, Math.min(resource.max, used));
    if (next === resource.used) return;
    startTransition(async () => {
      setShown({ id: resource.id, used: next });
      try {
        await api.patch(`/api/character-resources/${resource.id}`, { used: next });
      } catch {
        toast.error(t("resources.saveFailed"));
      }
      router.refresh();
    });
  }

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await api.post("/api/character-resources", {
        characterId,
        name: trimmed,
        max: Math.max(1, Math.min(99, Math.round(Number(max) || 1))),
        recharge,
      });
      setName("");
      setMax("1");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("resources.saveFailed"));
    }
  }

  async function remove(id: number) {
    try {
      await api.delete(`/api/character-resources/${id}`);
      router.refresh();
    } catch {
      toast.error(t("resources.saveFailed"));
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 font-medium">
        <BatteryCharging className="size-4 text-primary" /> {t("resources.title")}
      </h3>

      {shown.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">{t("resources.empty")}</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {shown.map((r) => {
            const left = r.max - r.used;
            return (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted/30 px-3 py-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{r.name}</span>{" "}
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {left}/{r.max}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t(RECHARGE_KEYS[r.recharge])}
                  </span>
                </span>
                {r.max <= MAX_PIPS ? (
                  <span className="flex items-center gap-1">
                    {Array.from({ length: r.max }, (_, i) => {
                      const available = i < left;
                      return (
                        <button
                          key={i}
                          type="button"
                          // Clicking a lit pip spends down to it; an unlit one
                          // gives uses back up to it.
                          onClick={() => setUsed(r, available ? r.max - i : r.max - i - 1)}
                          className={cn(
                            "size-4 rounded-full border transition-colors",
                            available
                              ? "border-primary bg-primary/70 hover:bg-primary"
                              : "border-border bg-transparent hover:border-primary/60",
                          )}
                          aria-label={`${r.name}: ${available ? t("resources.spend") : t("resources.restore")}`}
                        />
                      );
                    })}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7"
                      onClick={() => setUsed(r, r.used + 1)}
                      disabled={left <= 0}
                      aria-label={`${r.name}: ${t("resources.spend")}`}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7"
                      onClick={() => setUsed(r, r.used - 1)}
                      disabled={r.used <= 0}
                      aria-label={`${r.name}: ${t("resources.restore")}`}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </span>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(r.id)}
                  aria-label={`${t("action.delete")} ${r.name}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          placeholder={t("resources.namePlaceholder")}
          className="h-8 min-w-40 flex-1"
          maxLength={120}
          aria-label={t("common.name")}
        />
        <Input
          type="number"
          min={1}
          max={99}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="h-8 w-16 text-center tabular-nums"
          aria-label={t("resources.uses")}
        />
        <Select value={recharge} onValueChange={(v) => setRecharge(v as ResourceRecharge)}>
          <SelectTrigger className="h-8 w-40" aria-label={t("resources.recharge")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RECHARGE_KEYS) as ResourceRecharge[]).map((k) => (
              <SelectItem key={k} value={k}>
                {t(RECHARGE_KEYS[k])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={add} disabled={!name.trim()}>
          <Plus className="size-4" /> {t("action.add")}
        </Button>
      </div>
    </div>
  );
}
