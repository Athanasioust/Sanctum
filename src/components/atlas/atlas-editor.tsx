"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CloudFog,
  Download,
  Eye,
  EyeOff,
  ImagePlus,
  MapPinPlus,
  MousePointer2,
  Paintbrush,
  Pencil,
  Play,
  RectangleHorizontal,
  Search,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";
import { fogPointVisible } from "@/lib/atlas/fog";
import { atlasIconSvg } from "@/lib/atlas/icons";
import {
  ATLAS_LINK_LABEL_KEYS,
  atlasAncestors,
  atlasDescendantIds,
  atlasLinkHref,
  atlasMapHref,
  type AtlasLinkable,
} from "@/lib/atlas/links";
import { atlasPopupHtml } from "@/lib/atlas/popup";
import type { AtlasCategory, AtlasFogOp, AtlasMap, AtlasMarker } from "@/db/schema";
import type { AtlasPopupAction, AtlasTool, AtlasViewMarker } from "@/components/atlas/leaflet-atlas";
import { MapDialog, type MapOption } from "@/components/atlas/map-dialog";
import { MarkerPanel } from "@/components/atlas/marker-panel";
import { CategoryManager } from "@/components/atlas/category-manager";
import { patchMap, renderPlayerImage, uploadAtlasImage } from "@/components/atlas/atlas-client";

const LeafletAtlas = dynamic(() => import("@/components/atlas/leaflet-atlas"), {
  ssr: false,
  loading: () => <div className="atlas-map h-[70vh] min-h-[420px] w-full animate-pulse rounded-xl border border-border bg-card" />,
});

/** Category filter key for markers with no category. */
const NONE = "none";

export function AtlasEditor({
  campaignId,
  initialMap,
  initialMarkers,
  initialCategories,
  maps,
  places,
  records,
}: {
  campaignId: number;
  initialMap: AtlasMap;
  initialMarkers: AtlasMarker[];
  initialCategories: AtlasCategory[];
  maps: MapOption[];
  places: { id: number; name: string }[];
  records: AtlasLinkable[];
}) {
  const t = useT();
  const router = useRouter();
  const [map, setMap] = useState(initialMap);
  const [markers, setMarkers] = useState(initialMarkers);
  const [categories, setCategories] = useState(initialCategories);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<"edit" | "play">("edit");
  const [tool, setTool] = useState<AtlasTool>("select");
  const [brush, setBrush] = useState(0.03);
  const [hiddenCats, setHiddenCats] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<{ id: number; nonce: number } | null>(null);
  const [tab, setTab] = useState("markers");
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rendering, setRendering] = useState(false);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const mapById = useMemo(() => new Map(maps.map((m) => [m.id, m])), [maps]);
  const recordByKey = useMemo(() => new Map(records.map((r) => [`${r.type}:${r.id}`, r])), [records]);
  const trail = atlasAncestors(maps, map.id);
  const children = maps.filter((m) => m.parentMapId === map.id);
  const selected = markers.find((m) => m.id === selectedId) ?? null;

  /* ------------------------------ map saving ------------------------------ */

  // Map patches run one at a time so the fog the server ends up with is always
  // the newest. The last response is what fogged renders are made from.
  const serverMap = useRef(initialMap);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef(0);
  const renderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderNow = useCallback(async (force = false) => {
    const m = serverMap.current;
    if (pending.current > 0 || !m.fogEnabled || !m.imageUrl || m.playerImageUrl) return m;
    if (!force && !m.revealToPlayers) return m;
    setRendering(true);
    try {
      const row = await renderPlayerImage(m);
      if (row) {
        serverMap.current = row;
        setMap(row);
        return row;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("atlas.renderFailed"));
    } finally {
      setRendering(false);
    }
    return serverMap.current;
  }, [t]);

  const scheduleRender = useCallback(() => {
    if (renderTimer.current) clearTimeout(renderTimer.current);
    renderTimer.current = setTimeout(() => void renderNow(), 700);
  }, [renderNow]);

  useEffect(() => {
    scheduleRender();
    return () => {
      if (renderTimer.current) clearTimeout(renderTimer.current);
    };
  }, [scheduleRender]);

  const saveMap = useCallback(
    (patch: Partial<AtlasMap>, success?: string) => {
      setMap((m) => ({ ...m, ...patch }));
      pending.current++;
      queue.current = queue.current.then(async () => {
        try {
          const row = await patchMap(map.id, patch);
          serverMap.current = row;
          if (success) toast.success(success);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t("atlas.saveFailed"));
        } finally {
          pending.current--;
          if (pending.current === 0) {
            setMap(serverMap.current);
            scheduleRender();
          }
        }
      });
      return queue.current;
    },
    [map.id, scheduleRender, t],
  );

  async function replaceImage(file: File) {
    setUploading(true);
    try {
      const img = await uploadAtlasImage(file);
      await saveMap({ imageUrl: img.url, width: img.width, height: img.height }, t("atlas.imageUploaded"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("atlas.saveFailed"));
    } finally {
      setUploading(false);
    }
  }

  /* ---------------------------- marker saving ----------------------------- */

  // Typing in a field is coalesced per marker; drags and toggles save at once.
  const markerTimers = useRef(new Map<number, { timer: ReturnType<typeof setTimeout>; patch: Partial<AtlasMarker> }>());

  const flushMarker = useCallback(
    async (id: number) => {
      const entry = markerTimers.current.get(id);
      if (!entry) return;
      clearTimeout(entry.timer);
      markerTimers.current.delete(id);
      try {
        await api.patch(`/api/atlas-markers/${id}`, entry.patch);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("atlas.saveFailed"));
      }
    },
    [t],
  );

  const updateMarker = useCallback(
    (id: number, patch: Partial<AtlasMarker>, debounce = false) => {
      setMarkers((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
      const prev = markerTimers.current.get(id);
      if (prev) clearTimeout(prev.timer);
      const merged = { ...prev?.patch, ...patch };
      const timer = setTimeout(() => void flushMarker(id), debounce ? 450 : 0);
      markerTimers.current.set(id, { timer, patch: merged });
    },
    [flushMarker],
  );

  // Don't lose a half-typed edit when leaving the page.
  useEffect(() => {
    const timers = markerTimers.current;
    return () => {
      for (const [id, entry] of timers) {
        clearTimeout(entry.timer);
        void api.patch(`/api/atlas-markers/${id}`, entry.patch).catch(() => {});
      }
      timers.clear();
    };
  }, []);

  async function addMarker(x: number, y: number) {
    try {
      const row = await api.post<AtlasMarker>("/api/atlas-markers", {
        mapId: map.id,
        x,
        y,
        title: t("atlas.newMarker"),
        categoryId: categories[0]?.id ?? null,
      });
      setMarkers((list) => [...list, row]);
      setSelectedId(row.id);
      setTab("marker");
      setTool("select");
      toast.success(t("atlas.markerAdded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("atlas.saveFailed"));
    }
  }

  async function deleteMarker(id: number) {
    const entry = markerTimers.current.get(id);
    if (entry) {
      clearTimeout(entry.timer);
      markerTimers.current.delete(id);
    }
    try {
      await api.delete(`/api/atlas-markers/${id}`);
      setMarkers((list) => list.filter((m) => m.id !== id));
      setSelectedId(null);
      setTab("markers");
      toast.success(t("atlas.markerDeleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("atlas.saveFailed"));
    }
  }

  /** Make a child map for a portal marker and walk into it. */
  async function createChildFromMarker(marker: AtlasMarker) {
    try {
      await flushMarker(marker.id);
      const child = await api.post<AtlasMap>("/api/atlas-maps", {
        campaignId,
        name: marker.title || t("atlas.untitledMap"),
        parentMapId: map.id,
        sourceLocationId: marker.linkType === "location" ? marker.linkId : null,
      });
      await api.patch(`/api/atlas-markers/${marker.id}`, { portalMapId: child.id });
      toast.success(t("atlas.mapCreated"));
      router.push(atlasMapHref(campaignId, child.id));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("atlas.saveFailed"));
    }
  }

  async function deleteMap() {
    try {
      await api.delete(`/api/atlas-maps/${map.id}`);
      toast.success(t("atlas.mapDeleted"));
      router.push(map.parentMapId ? atlasMapHref(campaignId, map.parentMapId) : `/campaign/${campaignId}/world`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("atlas.saveFailed"));
    }
  }

  /* --------------------------------- fog ---------------------------------- */

  function addFogStroke(op: AtlasFogOp) {
    void saveMap({ fog: [...map.fog, op] });
  }

  function undoFog() {
    if (map.fog.length === 0) return;
    void saveMap({ fog: map.fog.slice(0, -1) });
  }

  function revealAll() {
    void saveMap({
      fog: [...map.fog, { id: crypto.randomUUID(), mode: "reveal", kind: "rect", x: 0, y: 0, w: 1, h: 1 }],
    });
  }

  function hideAll() {
    void saveMap({ fog: [] });
  }

  async function downloadExport(variant: "dm" | "player", scope: "map" | "tree") {
    if (variant === "player") {
      // A fogged map can only go out as its fog-burned render, so make sure
      // every map headed for the file has a current one.
      await queue.current;
      const row = await renderNow(true);
      if (row.fogEnabled && !row.playerImageUrl) {
        toast.error(t("atlas.renderFailed"));
        return;
      }
      if (scope === "tree") {
        try {
          const all = await api.get<AtlasMap[]>(`/api/atlas-maps?campaignId=${campaignId}`);
          const below = atlasDescendantIds(all, map.id);
          for (const m of all) {
            if (m.id !== map.id && below.has(m.id) && m.revealToPlayers && m.fogEnabled && m.imageUrl && !m.playerImageUrl) {
              await renderPlayerImage(m);
            }
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t("atlas.renderFailed"));
          return;
        }
      }
    }
    const a = document.createElement("a");
    a.href = `/api/atlas-maps/${map.id}/export?variant=${variant}&scope=${scope}`;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ------------------------------ view model ------------------------------ */

  const catKey = (m: AtlasMarker) => (m.categoryId && catById.has(m.categoryId) ? String(m.categoryId) : NONE);
  const shown = markers.filter((m) => !hiddenCats.has(catKey(m)));
  const q = query.trim().toLowerCase();
  const listed = q
    ? shown.filter((m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
    : shown;

  const visibleToPlayers = (m: AtlasMarker) =>
    !m.hidden && fogPointVisible(map.fogEnabled, map.fog, m.x, m.y, map.width, map.height);

  const viewMarkers: AtlasViewMarker[] = shown.map((m) => {
    const cat = m.categoryId ? catById.get(m.categoryId) : undefined;
    const rec = m.linkType && m.linkId ? recordByKey.get(`${m.linkType}:${m.linkId}`) : undefined;
    const portal = m.portalMapId ? mapById.get(m.portalMapId) : undefined;
    return {
      id: m.id,
      x: m.x,
      y: m.y,
      title: m.title,
      icon: m.icon || cat?.icon || "map-pin",
      color: m.color || cat?.color || "#d4a017",
      portalMapId: portal ? portal.id : null,
      dim: mode === "edit" && !visibleToPlayers(m),
      popupHtml: atlasPopupHtml({
        title: m.title,
        description: m.description,
        link: rec && m.linkType
          ? { label: `${t(ATLAS_LINK_LABEL_KEYS[m.linkType])}: ${rec.name}`, href: atlasLinkHref(campaignId, m.linkType, rec.id) }
          : null,
        portal: portal ? { id: portal.id, label: t("atlas.enterMap").replace("{name}", portal.name) } : null,
        extraHtml:
          mode === "edit" && m.dmNotes.trim()
            ? `<div class="atlas-popup-body" style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px"><em>${escapeHtml(t("atlas.dmNotes"))}:</em> ${escapeHtml(m.dmNotes)}</div>`
            : "",
      }),
    };
  });

  function onPopupAction(action: AtlasPopupAction) {
    if ("portal" in action) router.push(atlasMapHref(campaignId, action.portal));
    else router.push(action.href);
  }

  const effectiveTool: AtlasTool = mode === "play" ? "select" : tool;
  const fogView = useMemo(
    () => (mode === "edit" ? { enabled: map.fogEnabled, ops: map.fog } : null),
    [mode, map.fogEnabled, map.fog],
  );
  const fogTools: { key: AtlasTool; icon: typeof Paintbrush; label: string }[] = [
    { key: "reveal-brush", icon: Paintbrush, label: t("atlas.fogRevealBrush") },
    { key: "hide-brush", icon: Paintbrush, label: t("atlas.fogHideBrush") },
    { key: "reveal-rect", icon: RectangleHorizontal, label: t("atlas.fogRevealRect") },
    { key: "hide-rect", icon: RectangleHorizontal, label: t("atlas.fogHideRect") },
  ];

  const playerCount = markers.filter(visibleToPlayers).length;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav aria-label={t("atlas.breadcrumb")} className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href={`/campaign/${campaignId}/world`} className="hover:text-foreground">{t("nav.world")}</Link>
        {trail.map((m) => (
          <span key={m.id} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" />
            {m.id === map.id ? (
              <span className="font-medium text-foreground" aria-current="page">{map.name}</span>
            ) : (
              <Link href={atlasMapHref(campaignId, m.id)} className="hover:text-foreground">{m.name}</Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">{map.name}</h1>
          {map.revealToPlayers ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
              <Eye className="size-3" /> {t("atlas.onPlayerView")}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5" role="group" aria-label={t("atlas.mode")}>
            <Button size="sm" variant={mode === "edit" ? "secondary" : "ghost"} onClick={() => setMode("edit")} aria-pressed={mode === "edit"}>
              <Pencil className="size-4" /> {t("atlas.modeEdit")}
            </Button>
            <Button size="sm" variant={mode === "play" ? "secondary" : "ghost"} onClick={() => setMode("play")} aria-pressed={mode === "play"}>
              <Play className="size-4" /> {t("atlas.modePlay")}
            </Button>
          </div>
          <Button
            size="sm"
            variant={map.revealToPlayers ? "default" : "outline"}
            onClick={() =>
              saveMap(
                { revealToPlayers: !map.revealToPlayers },
                map.revealToPlayers ? t("atlas.hiddenFromPlayers") : t("atlas.revealedToPlayers"),
              )
            }
            disabled={!map.imageUrl}
          >
            {map.revealToPlayers ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {map.revealToPlayers ? t("atlas.hideFromPlayers") : t("atlas.revealToPlayers")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={!map.imageUrl}>
                <Download className="size-4" /> {t("atlas.export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("atlas.exportHtml")}</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => void downloadExport("dm", "map")}>{t("atlas.exportDmMap")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void downloadExport("player", "map")}>{t("atlas.exportPlayerMap")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void downloadExport("dm", "tree")}>{t("atlas.exportDmTree")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void downloadExport("player", "tree")}>{t("atlas.exportPlayerTree")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <MapDialog
            campaignId={campaignId}
            map={map}
            maps={maps}
            places={places}
            onSaved={(row) => {
              serverMap.current = row;
              setMap(row);
              router.refresh();
            }}
            trigger={<Button size="sm" variant="outline">{t("atlas.editMap")}</Button>}
          />
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
            {t("action.delete")}
          </Button>
        </div>
      </div>

      {!map.imageUrl ? (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 py-20 text-center hover:border-primary/50">
          <ImagePlus className="mb-3 size-10 text-muted-foreground" />
          <p className="font-medium">{uploading ? t("common.loading") : t("atlas.uploadPrompt")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("atlas.uploadHint")}</p>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void replaceImage(f);
              e.target.value = "";
            }}
          />
        </label>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-2">
            {mode === "edit" ? (
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-2">
                <ToolButton active={tool === "select"} onClick={() => setTool("select")} icon={MousePointer2} label={t("atlas.toolSelect")} />
                <ToolButton active={tool === "add"} onClick={() => setTool("add")} icon={MapPinPlus} label={t("atlas.toolAdd")} />
                <span className="mx-1 h-6 w-px bg-border" />
                <label className="flex items-center gap-2 px-1 text-sm">
                  <Switch
                    checked={map.fogEnabled}
                    onCheckedChange={(v) => {
                      void saveMap({ fogEnabled: v });
                      if (!v && tool !== "add") setTool("select");
                    }}
                  />
                  <CloudFog className="size-4 text-muted-foreground" /> {t("atlas.fog")}
                </label>
                {map.fogEnabled ? (
                  <>
                    {fogTools.map((ft) => (
                      <ToolButton
                        key={ft.key}
                        active={tool === ft.key}
                        onClick={() => setTool(ft.key)}
                        icon={ft.icon}
                        label={ft.label}
                        tone={ft.key.startsWith("hide") ? "dark" : "light"}
                      />
                    ))}
                    {tool.endsWith("-brush") ? (
                      <div className="flex w-32 items-center gap-2 px-1" title={t("atlas.brushSize")}>
                        <Slider
                          min={0.005}
                          max={0.15}
                          step={0.005}
                          value={[brush]}
                          onValueChange={([v]) => setBrush(v)}
                          aria-label={t("atlas.brushSize")}
                        />
                      </div>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={undoFog} disabled={map.fog.length === 0}>
                      <Undo2 className="size-4" /> {t("atlas.fogUndo")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={revealAll}>{t("atlas.fogRevealAll")}</Button>
                    <Button size="sm" variant="ghost" onClick={hideAll}>{t("atlas.fogHideAll")}</Button>
                  </>
                ) : null}
              </div>
            ) : (
              <p className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">{t("atlas.playHint")}</p>
            )}

            <LeafletAtlas
              imageUrl={map.imageUrl}
              width={map.width}
              height={map.height}
              markers={viewMarkers}
              selectedId={mode === "edit" ? selectedId : null}
              tool={effectiveTool}
              readOnly={mode === "play"}
              followPortals={mode === "play"}
              fog={fogView}
              brushRadius={brush}
              focus={focus}
              onMeasured={(width, height) => void saveMap({ width, height })}
              onMapClick={(x, y) => void addMarker(x, y)}
              onMarkerClick={(id) => {
                if (mode !== "edit") return;
                setSelectedId(id);
                setTab("marker");
              }}
              onMarkerMove={(id, x, y) => updateMarker(id, { x, y })}
              onFogStroke={addFogStroke}
              onPopupAction={onPopupAction}
            />
            <p className="text-xs text-muted-foreground">
              {t("atlas.playerSummary")
                .replace("{shown}", String(playerCount))
                .replace("{total}", String(markers.length))}
              {rendering ? ` · ${t("atlas.rendering")}` : ""}
            </p>
          </div>

          <aside className="min-w-0">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-3 w-full">
                <TabsTrigger value="markers">{t("atlas.tabMarkers")}</TabsTrigger>
                <TabsTrigger value="marker" disabled={!selected}>{t("atlas.tabMarker")}</TabsTrigger>
                <TabsTrigger value="maps">{t("atlas.tabSubMaps")}</TabsTrigger>
                <TabsTrigger value="categories">{t("atlas.tabCategories")}</TabsTrigger>
              </TabsList>

              <TabsContent value="markers" className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("atlas.searchMarkers")}
                    className="pl-8"
                    aria-label={t("atlas.searchMarkers")}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("atlas.filterCategories")}>
                  {[...categories.map((c) => ({ key: String(c.id), name: c.name, color: c.color, icon: c.icon })), { key: NONE, name: t("atlas.uncategorized"), color: "#71717a", icon: "map-pin" }].map((c) => {
                    const off = hiddenCats.has(c.key);
                    return (
                      <button
                        key={c.key}
                        type="button"
                        aria-pressed={!off}
                        onClick={() =>
                          setHiddenCats((s) => {
                            const next = new Set(s);
                            if (off) next.delete(c.key);
                            else next.add(c.key);
                            return next;
                          })
                        }
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                          off ? "border-border text-muted-foreground line-through opacity-60" : "border-border hover:bg-muted",
                        )}
                      >
                        <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
                {listed.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    {markers.length === 0 ? t("atlas.noMarkers") : t("atlas.noMatches")}
                  </p>
                ) : (
                  <ul className="max-h-[52vh] space-y-1 overflow-y-auto">
                    {listed.map((m) => {
                      const look = viewMarkers.find((v) => v.id === m.id)!;
                      const rec = m.linkType && m.linkId ? recordByKey.get(`${m.linkType}:${m.linkId}`) : undefined;
                      return (
                        <li key={m.id}>
                          <div
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-2 py-1.5",
                              m.id === selectedId ? "border-primary/50 bg-primary/10" : "border-transparent hover:bg-muted",
                            )}
                          >
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                              onClick={() => {
                                setSelectedId(m.id);
                                setFocus({ id: m.id, nonce: Date.now() });
                                if (mode === "edit") setTab("marker");
                              }}
                            >
                              <span
                                className="flex size-6 shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: look.color }}
                                dangerouslySetInnerHTML={{ __html: atlasIconSvg(look.icon, 13, "#fff") }}
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-sm">{m.title || "—"}</span>
                                {rec ? (
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {t(ATLAS_LINK_LABEL_KEYS[m.linkType!])}: {rec.name}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                            {rec ? (
                              <Link
                                href={atlasLinkHref(campaignId, m.linkType!, rec.id)}
                                className="text-xs text-primary hover:underline"
                              >
                                {t("atlas.open")}
                              </Link>
                            ) : null}
                            {!visibleToPlayers(m) ? (
                              <EyeOff className="size-3.5 shrink-0 text-muted-foreground" aria-label={t("atlas.notOnPlayerView")} />
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {mode === "edit" && markers.length === 0 ? (
                  <Button variant="outline" size="sm" onClick={() => setTool("add")}>
                    <MapPinPlus className="size-4" /> {t("atlas.toolAdd")}
                  </Button>
                ) : null}
              </TabsContent>

              <TabsContent value="marker">
                {selected ? (
                  <MarkerPanel
                    key={selected.id}
                    campaignId={campaignId}
                    marker={selected}
                    categories={categories}
                    maps={maps.filter((m) => m.id !== map.id)}
                    records={records}
                    playerVisible={visibleToPlayers(selected)}
                    onChange={(patch, debounce) => updateMarker(selected.id, patch, debounce)}
                    onDelete={() => void deleteMarker(selected.id)}
                    onCreateChild={() => void createChildFromMarker(selected)}
                  />
                ) : null}
              </TabsContent>

              <TabsContent value="maps" className="space-y-3">
                {children.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">{t("atlas.noSubMaps")}</p>
                ) : (
                  <ul className="space-y-1">
                    {children.map((c) => {
                      const placed = markers.some((m) => m.portalMapId === c.id);
                      return (
                        <li key={c.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                          <Link href={atlasMapHref(campaignId, c.id)} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary">
                            {c.name}
                          </Link>
                          {!placed ? (
                            <span className="text-xs text-muted-foreground" title={t("atlas.portalUnplacedHint")}>{t("atlas.portalUnplaced")}</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <MapDialog
                  campaignId={campaignId}
                  maps={maps}
                  places={places}
                  defaultParentId={map.id}
                  trigger={<Button variant="outline" size="sm">{t("atlas.newSubMap")}</Button>}
                />
              </TabsContent>

              <TabsContent value="categories">
                <CategoryManager
                  campaignId={campaignId}
                  categories={categories}
                  onChange={setCategories}
                />
              </TabsContent>
            </Tabs>
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("atlas.deleteMapTitle")}
        description={t("atlas.deleteMapBody")}
        confirmLabel={t("action.delete")}
        cancelLabel={t("action.cancel")}
        onConfirm={deleteMap}
      />
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  icon: Icon,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Paintbrush;
  label: string;
  tone?: "light" | "dark";
}) {
  return (
    <Button
      size="sm"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(active && "ring-1 ring-primary/50")}
    >
      <Icon className={cn("size-4", tone === "dark" && "opacity-60")} />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
