"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/form";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";
import { atlasDescendantIds, atlasMapHref } from "@/lib/atlas/links";
import { uploadAtlasImage } from "@/components/atlas/atlas-client";
import type { AtlasMap } from "@/db/schema";

export type MapOption = { id: number; name: string; parentMapId: number | null };

/**
 * Create a map, or edit one's name, parent, depicted place and image. A new map
 * opens straight away; the image can be added now or from the editor.
 */
export function MapDialog({
  campaignId,
  map,
  maps,
  places,
  defaultParentId = null,
  trigger,
  onSaved,
}: {
  campaignId: number;
  map?: AtlasMap;
  maps: MapOption[];
  places: { id: number; name: string }[];
  defaultParentId?: number | null;
  trigger?: React.ReactNode;
  onSaved?: (map: AtlasMap) => void;
}) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(map?.name ?? "");
  const [parent, setParent] = useState(String(map?.parentMapId ?? defaultParentId ?? "none"));
  const [place, setPlace] = useState(String(map?.sourceLocationId ?? "none"));
  const [file, setFile] = useState<File | null>(null);

  // A map can't be filed under itself or anything beneath it.
  const blocked = map ? atlasDescendantIds(maps, map.id) : new Set<number>();
  const parents = maps.filter((m) => !blocked.has(m.id));

  async function save() {
    if (!name.trim()) {
      toast.error(t("atlas.nameRequired"));
      return;
    }
    setPending(true);
    try {
      const image = file ? await uploadAtlasImage(file) : null;
      const payload = {
        name,
        parentMapId: parent === "none" ? null : Number(parent),
        sourceLocationId: place === "none" ? null : Number(place),
        ...(image ? { imageUrl: image.url, width: image.width, height: image.height } : {}),
      };
      const saved = map
        ? await api.patch<AtlasMap>(`/api/atlas-maps/${map.id}`, payload)
        : await api.post<AtlasMap>("/api/atlas-maps", { campaignId, ...payload });
      toast.success(map ? t("atlas.mapSaved") : t("atlas.mapCreated"));
      setOpen(false);
      if (onSaved) onSaved(saved);
      else if (!map) router.push(atlasMapHref(campaignId, saved.id));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("atlas.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setName(map?.name ?? "");
          setParent(String(map?.parentMapId ?? defaultParentId ?? "none"));
          setPlace(String(map?.sourceLocationId ?? "none"));
          setFile(null);
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> {t("atlas.newMap")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{map ? t("atlas.editMap") : t("atlas.newMap")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label={t("common.name")} required>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("atlas.parentMap")}>
              <Select value={parent} onValueChange={setParent}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("atlas.topLevel")}</SelectItem>
                  {parents.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("atlas.depicts")}>
              <Select value={place} onValueChange={setPlace}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {places.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label={map?.imageUrl ? t("atlas.replaceImage") : t("atlas.mapImage")}>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/50">
              <ImagePlus className="size-4" />
              <span className="truncate">{file ? file.name : t("atlas.chooseImage")}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>{t("action.cancel")}</Button>
          <Button onClick={save} disabled={pending}>{pending ? t("common.saving") : t("action.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
