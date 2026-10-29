"use client";

import Link from "next/link";
import { Eye, EyeOff, MapPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/form";
import { useT } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { ATLAS_ICON_NAMES, atlasIconSvg } from "@/lib/atlas/icons";
import { atlasMapHref, type AtlasLinkable } from "@/lib/atlas/links";
import { RecordPicker } from "@/components/atlas/record-picker";
import type { MapOption } from "@/components/atlas/map-dialog";
import type { AtlasCategory, AtlasMarker } from "@/db/schema";

export const ATLAS_COLORS = ["#d4a017", "#a16207", "#dc2626", "#16a34a", "#0891b2", "#2563eb", "#7c3aed", "#db2777", "#71717a"];

/** Edit the selected marker. Text saves after a pause; everything else at once. */
export function MarkerPanel({
  campaignId,
  marker,
  categories,
  maps,
  records,
  playerVisible,
  onChange,
  onDelete,
  onCreateChild,
}: {
  campaignId: number;
  marker: AtlasMarker;
  categories: AtlasCategory[];
  /** Maps the marker may portal to (all but the one it's on). */
  maps: MapOption[];
  records: AtlasLinkable[];
  playerVisible: boolean;
  onChange: (patch: Partial<AtlasMarker>, debounce?: boolean) => void;
  onDelete: () => void;
  onCreateChild: () => void;
}) {
  const t = useT();
  const category = categories.find((c) => c.id === marker.categoryId);
  const icon = marker.icon || category?.icon || "map-pin";
  const color = marker.color || category?.color || "#d4a017";

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <Field label={t("atlas.markerTitle")}>
        <Input value={marker.title} onChange={(e) => onChange({ title: e.target.value }, true)} maxLength={120} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("atlas.category")}>
          <Select
            value={marker.categoryId ? String(marker.categoryId) : "none"}
            onValueChange={(v) => onChange({ categoryId: v === "none" ? null : Number(v) })}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("atlas.uncategorized")}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("atlas.icon")}>
          <Select value={marker.icon ?? "default"} onValueChange={(v) => onChange({ icon: v === "default" ? null : v })}>
            <SelectTrigger className="w-full">
              <span className="flex items-center gap-2">
                <span dangerouslySetInnerHTML={{ __html: atlasIconSvg(icon, 14) }} />
                <span className="truncate">{marker.icon ? icon : t("atlas.fromCategory")}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">{t("atlas.fromCategory")}</SelectItem>
              {ATLAS_ICON_NAMES.map((name) => (
                <SelectItem key={name} value={name}>
                  <span className="flex items-center gap-2">
                    <span dangerouslySetInnerHTML={{ __html: atlasIconSvg(name, 14) }} />
                    {name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label={t("atlas.color")}>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ color: null })}
            className={cn(
              "rounded-full border px-2 py-0.5 text-xs",
              !marker.color ? "border-primary text-primary" : "border-border text-muted-foreground",
            )}
          >
            {t("atlas.fromCategory")}
          </button>
          {ATLAS_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ color: c })}
              className={cn("size-6 rounded-full border-2", marker.color === c ? "border-foreground" : "border-transparent")}
              style={{ backgroundColor: c }}
              aria-label={c}
              aria-pressed={marker.color === c}
            />
          ))}
          <span className="ml-auto size-6 rounded-full border border-border" style={{ backgroundColor: color }} aria-hidden />
        </div>
      </Field>

      <Field label={t("atlas.description")} hint={t("atlas.markdownHint")}>
        <Textarea value={marker.description} onChange={(e) => onChange({ description: e.target.value }, true)} rows={4} />
      </Field>

      <Field label={t("atlas.dmNotes")} hint={t("atlas.dmNotesHint")}>
        <Textarea value={marker.dmNotes} onChange={(e) => onChange({ dmNotes: e.target.value }, true)} rows={2} />
      </Field>

      <Field label={t("atlas.linkedRecord")}>
        <RecordPicker
          value={marker.linkType && marker.linkId ? { type: marker.linkType, id: marker.linkId } : null}
          records={records}
          onChange={(next) => onChange({ linkType: next?.type ?? null, linkId: next?.id ?? null })}
        />
      </Field>

      <Field label={t("atlas.portal")} hint={t("atlas.portalHint")}>
        <div className="flex items-center gap-1.5">
          <Select
            value={marker.portalMapId ? String(marker.portalMapId) : "none"}
            onValueChange={(v) => onChange({ portalMapId: v === "none" ? null : Number(v) })}
          >
            <SelectTrigger className="min-w-0 flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("common.none")}</SelectItem>
              {maps.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {marker.portalMapId ? (
            <Button asChild size="sm" variant="outline">
              <Link href={atlasMapHref(campaignId, marker.portalMapId)}>{t("atlas.open")}</Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onCreateChild} title={t("atlas.createChildMap")}>
              <MapPlus className="size-4" /> {t("atlas.createChildMapShort")}
            </Button>
          )}
        </div>
      </Field>

      <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
        <span className="flex items-center gap-2">
          {playerVisible ? <Eye className="size-4 text-primary" /> : <EyeOff className="size-4 text-muted-foreground" />}
          <span>
            {t("atlas.hiddenFromPlayersToggle")}
            <span className="block text-xs text-muted-foreground">
              {playerVisible ? t("atlas.visibleNow") : marker.hidden ? t("atlas.hiddenByDm") : t("atlas.hiddenByFog")}
            </span>
          </span>
        </span>
        <Switch checked={marker.hidden} onCheckedChange={(v) => onChange({ hidden: v })} />
      </label>

      <Button variant="destructive" size="sm" onClick={onDelete}>
        <Trash2 className="size-4" /> {t("atlas.deleteMarker")}
      </Button>
    </div>
  );
}
