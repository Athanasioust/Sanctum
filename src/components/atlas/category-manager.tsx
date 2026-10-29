"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";
import { ATLAS_ICON_NAMES, atlasIconSvg } from "@/lib/atlas/icons";
import { ATLAS_COLORS } from "@/components/atlas/marker-panel";
import type { AtlasCategory } from "@/db/schema";

/**
 * The campaign's marker categories. They're shared by every map in the
 * campaign, and the DM can rename, recolour, re-icon, add and remove them.
 */
export function CategoryManager({
  campaignId,
  categories,
  onChange,
}: {
  campaignId: number;
  categories: AtlasCategory[];
  onChange: (next: AtlasCategory[]) => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const timers = useState(() => new Map<number, ReturnType<typeof setTimeout>>())[0];

  function patch(id: number, p: Partial<AtlasCategory>, debounce = false) {
    onChange(categories.map((c) => (c.id === id ? { ...c, ...p } : c)));
    clearTimeout(timers.get(id));
    timers.set(
      id,
      setTimeout(() => {
        api.patch(`/api/atlas-categories/${id}`, p).catch((err) =>
          toast.error(err instanceof Error ? err.message : t("atlas.saveFailed")),
        );
      }, debounce ? 450 : 0),
    );
  }

  async function add() {
    if (!name.trim()) return;
    try {
      const row = await api.post<AtlasCategory>("/api/atlas-categories", {
        campaignId,
        name,
        sortOrder: categories.length,
        color: ATLAS_COLORS[categories.length % ATLAS_COLORS.length],
      });
      onChange([...categories, row]);
      setName("");
      toast.success(t("atlas.categoryAdded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("atlas.saveFailed"));
    }
  }

  async function remove(id: number) {
    try {
      await api.delete(`/api/atlas-categories/${id}`);
      onChange(categories.filter((c) => c.id !== id));
      toast.success(t("atlas.categoryDeleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("atlas.saveFailed"));
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{t("atlas.categoriesHint")}</p>
      <ul className="space-y-1.5">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="size-7 shrink-0 rounded-full border-2 border-white/70"
                  style={{ backgroundColor: c.color }}
                  aria-label={t("atlas.color")}
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex gap-1.5">
                  {ATLAS_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => patch(c.id, { color: col })}
                      className="size-6 rounded-full border-2 border-transparent hover:border-foreground"
                      style={{ backgroundColor: col }}
                      aria-label={col}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Select value={c.icon} onValueChange={(v) => patch(c.id, { icon: v })}>
              <SelectTrigger className="w-12 shrink-0 px-2" aria-label={t("atlas.icon")}>
                <span dangerouslySetInnerHTML={{ __html: atlasIconSvg(c.icon, 14) }} />
              </SelectTrigger>
              <SelectContent>
                {ATLAS_ICON_NAMES.map((n) => (
                  <SelectItem key={n} value={n}>
                    <span className="flex items-center gap-2">
                      <span dangerouslySetInnerHTML={{ __html: atlasIconSvg(n, 14) }} />
                      {n}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={c.name}
              onChange={(e) => patch(c.id, { name: e.target.value }, true)}
              className="h-9 min-w-0 flex-1"
              maxLength={60}
              aria-label={t("common.name")}
            />
            <Button
              size="icon"
              variant="ghost"
              className="size-9 shrink-0"
              onClick={() => void remove(c.id)}
              disabled={categories.length <= 1}
              aria-label={t("action.delete")}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1.5 pt-1">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void add()}
          placeholder={t("atlas.newCategory")}
          maxLength={60}
        />
        <Button variant="outline" onClick={() => void add()} disabled={!name.trim()}>
          <Plus className="size-4" /> {t("action.add")}
        </Button>
      </div>
    </div>
  );
}
