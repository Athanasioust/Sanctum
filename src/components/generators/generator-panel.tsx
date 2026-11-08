"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Dices, Lock, LockOpen, MapPinPlus, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/components/i18n/i18n-provider";
import type { TranslationKey } from "@/lib/i18n";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";
import {
  generate,
  generatorById,
  reroll,
  resultText,
  toggleLock,
  withOptions,
  type GeneratedResult,
  type PoolItem,
  type SaveTarget,
} from "@/lib/generators/registry";
import { addRecordToMap, saveResult, type SavedRecord } from "@/lib/generators/save";

const SAVE_LABEL: Record<SaveTarget, TranslationKey> = {
  npc: "gen.saveAsNpc",
  shop: "gen.saveAsShop",
  location: "gen.saveAsLocation",
  quest: "gen.saveAsQuest",
  rumor: "gen.saveAsRumor",
  shop_stock: "gen.addToShop",
};

type Option = { id: number; name: string };

/**
 * One generator, live: options, every field with its own reroll and lock, and
 * the actions that turn the result into real records.
 */
export function GeneratorPanel({
  campaignId,
  generatorId,
  onSaved,
}: {
  campaignId: number;
  generatorId: string;
  /** Called after a record is created (dialogs close themselves here). */
  onSaved?: (record: SavedRecord) => void;
}) {
  const t = useT();
  const router = useRouter();
  const def = generatorById(generatorId);
  const [pool, setPool] = useState<PoolItem[]>([]);
  const [result, setResult] = useState<GeneratedResult | null>(() => (def ? generate(def) : null));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SavedRecord | null>(null);
  const [shops, setShops] = useState<Option[] | null>(null);
  const [shopId, setShopId] = useState<string>("");
  const [maps, setMaps] = useState<Option[] | null>(null);
  const [mapId, setMapId] = useState<string>("");

  const needsShops = def?.saves.includes("shop_stock") ?? false;
  const canMap = Boolean(def?.mapLink);

  // Treasure mixes in the campaign's unclaimed magic items; the shop picker
  // and map picker need their lists. All local API reads.
  useEffect(() => {
    if (!def) return;
    let cancelled = false;
    if (def.id === "treasure") {
      api
        .get<{ name: string; rarity: string; itemType: string; characterId: number | null }[]>(
          `/api/magic-items?campaignId=${campaignId}`,
        )
        .then((items) => {
          if (!cancelled) setPool(items.filter((i) => i.characterId === null));
        })
        .catch(() => {});
    }
    if (needsShops) {
      api
        .get<Option[]>(`/api/shops?campaignId=${campaignId}`)
        .then((s) => !cancelled && setShops(s.map(({ id, name }) => ({ id, name }))))
        .catch(() => !cancelled && setShops([]));
    }
    if (canMap) {
      api
        .get<Option[]>(`/api/atlas-maps?campaignId=${campaignId}`)
        .then((m) => !cancelled && setMaps(m.map(({ id, name }) => ({ id, name }))))
        .catch(() => !cancelled && setMaps([]));
    }
    return () => {
      cancelled = true;
    };
  }, [def, campaignId, needsShops, canMap]);

  const text = useMemo(() => (def && result ? resultText(def, result, t) : ""), [def, result, t]);

  if (!def || !result) return null;

  function update(next: GeneratedResult) {
    setResult(next);
    setSaved(null);
  }

  async function save(target: SaveTarget) {
    if (!result) return;
    setSaving(true);
    try {
      const record = await saveResult(target, result, campaignId, {
        shopId: shopId ? Number(shopId) : undefined,
      });
      setSaved(record);
      toast.success(t("gen.saved"), {
        action: { label: t("gen.open"), onClick: () => router.push(record.href) },
      });
      router.refresh();
      onSaved?.(record);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("gen.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function addToMap() {
    if (!saved || !mapId) return;
    setSaving(true);
    try {
      const href = await addRecordToMap(campaignId, Number(mapId), saved);
      toast.success(t("gen.addedToMap"));
      router.push(href);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("gen.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("gen.copied"));
    } catch {
      toast.error(t("gen.copyFailed"));
    }
  }

  return (
    <div className="space-y-4">
      {def.options.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {def.options.map((o) => (
            <div key={o.key} className="min-w-40 space-y-1">
              <Label className="text-xs">{t(o.labelKey)}</Label>
              <Select
                value={result.options[o.key] ?? o.default}
                onValueChange={(value) =>
                  update(withOptions(def, result, { ...result.options, [o.key]: value }, pool))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {o.choices.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {t(c.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      ) : null}

      <dl className="divide-y divide-border rounded-xl border border-border bg-card">
        {def.fields.map((f) => {
          const value = result.values[f.key];
          // The optional stat block only shows when it was asked for.
          if (!value && f.key === "statBlock") return null;
          const locked = result.locked.includes(f.key);
          return (
            <div key={f.key} className="flex items-start gap-3 px-3 py-2.5">
              <dt className="w-28 shrink-0 pt-0.5 text-xs font-medium uppercase text-muted-foreground">
                {t(f.labelKey)}
              </dt>
              <dd
                className={cn(
                  "min-w-0 flex-1 whitespace-pre-line text-sm",
                  f.key === "name" && "font-heading text-base font-semibold",
                )}
              >
                {value || "—"}
              </dd>
              <div className="flex shrink-0 gap-0.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  aria-label={t("gen.rerollField")}
                  title={t("gen.rerollField")}
                  onClick={() => update(reroll(def, result, [f.key], pool))}
                >
                  <RefreshCw className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={cn("size-7", locked && "text-primary")}
                  aria-label={locked ? t("gen.unlock") : t("gen.lock")}
                  aria-pressed={locked}
                  title={locked ? t("gen.unlock") : t("gen.lock")}
                  onClick={() => setResult(toggleLock(result, f.key))}
                >
                  {locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
                </Button>
              </div>
            </div>
          );
        })}
      </dl>

      <p className="text-xs text-muted-foreground">{t("gen.englishNote")}</p>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => update(reroll(def, result, "all", pool))}>
          <Dices className="size-4" /> {t("gen.rerollAll")}
        </Button>
        <Button type="button" variant="outline" onClick={copy}>
          <Copy className="size-4" /> {t("gen.copy")}
        </Button>

        {needsShops ? (
          <>
            <Select value={shopId} onValueChange={setShopId}>
              <SelectTrigger className="h-9 w-48" aria-label={t("gen.pickShop")}>
                <SelectValue placeholder={shops?.length === 0 ? t("gen.noShops") : t("gen.pickShop")} />
              </SelectTrigger>
              <SelectContent>
                {(shops ?? []).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              disabled={saving || !shopId || !result.values.items || result.values.items === "—"}
              onClick={() => save("shop_stock")}
            >
              <Save className="size-4" /> {t(SAVE_LABEL.shop_stock)}
            </Button>
          </>
        ) : null}

        {def.saves
          .filter((s) => s !== "shop_stock")
          .map((target) => (
            <Button
              key={target}
              type="button"
              variant="outline"
              disabled={saving || saved !== null}
              onClick={() => save(target)}
            >
              <Save className="size-4" /> {t(SAVE_LABEL[target])}
            </Button>
          ))}
      </div>

      {canMap && saved ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3">
          <span className="text-sm text-muted-foreground">{t("gen.addToMapPrompt")}</span>
          {maps && maps.length === 0 ? (
            <span className="text-sm text-muted-foreground">{t("gen.noMaps")}</span>
          ) : (
            <>
              <Select value={mapId} onValueChange={setMapId}>
                <SelectTrigger className="h-9 w-48" aria-label={t("gen.pickMap")}>
                  <SelectValue placeholder={t("gen.pickMap")} />
                </SelectTrigger>
                <SelectContent>
                  {(maps ?? []).map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" size="sm" disabled={saving || !mapId} onClick={addToMap}>
                <MapPinPlus className="size-4" /> {t("gen.addToMap")}
              </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
