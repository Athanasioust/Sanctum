"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Circle as CircleIcon,
  Cloud,
  Eraser,
  Eye,
  EyeOff,
  Grid3x3,
  ImageIcon,
  Map as MapIcon,
  Monitor,
  MousePointer2,
  Pencil,
  Plus,
  RotateCcw,
  Ruler,
  Square,
  Trash2,
  Triangle,
  Type,
  Upload,
  Users,
  Hand,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/shared/form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { api } from "@/lib/client";
import {
  createFog,
  fogForGrid,
  paintFog,
  resolveTokenImages,
  revealAllFog,
  tokensInTemplate,
} from "@/lib/battle-map";
import { AoeDamagePanel, type AoeSelection } from "@/components/combat/aoe-damage-panel";
import { conditionNames } from "@/lib/conditions";
import { cn } from "@/lib/utils";
import type { MapTool, TokenStatus } from "@/components/combat/battle-map-canvas";
import type {
  BattleMap as BattleMapRow,
  BattleToken,
  CombatParticipant,
  Encounter,
  MapAnnotation,
} from "@/db/schema";

const BattleMapCanvas = dynamic(() => import("@/components/combat/battle-map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

/** How often the map re-reads the encounter so token HP tracks the tracker. */
const COMBAT_POLL_MS = 4000;

const TOKEN_COLORS = [
  "#7c3aed", "#dc2626", "#16a34a", "#2563eb", "#a16207", "#0891b2", "#db2777", "#65a30d",
];

const TOOLS: { value: MapTool; label: string; icon: typeof MousePointer2; hint: string }[] = [
  { value: "select", label: "Select", icon: MousePointer2, hint: "Select and drag tokens and shapes" },
  { value: "measure", label: "Measure", icon: Ruler, hint: "Click to anchor, move to measure, click to clear" },
  { value: "circle", label: "Sphere", icon: CircleIcon, hint: "Place a radius template" },
  { value: "cone", label: "Cone", icon: Triangle, hint: "Place a cone template" },
  { value: "line", label: "Line", icon: ArrowUpRight, hint: "Place a line template" },
  { value: "cube", label: "Cube", icon: Square, hint: "Place a cube/square template" },
  { value: "draw", label: "Draw", icon: Pencil, hint: "Freehand drawing" },
  { value: "arrow", label: "Arrow", icon: ArrowUpRight, hint: "Drag to draw an arrow" },
  { value: "text", label: "Text", icon: Type, hint: "Click to drop a label" },
  { value: "fog-reveal", label: "Reveal", icon: Eye, hint: "Brush away the fog to show the players" },
  { value: "fog-hide", label: "Hide", icon: EyeOff, hint: "Brush fog back over the map" },
];

/** Common 5e template sizes, in feet. */
const TEMPLATE_SIZES = [5, 10, 15, 20, 30, 40, 60];

const TEMPLATE_COLORS = ["#f97316", "#dc2626", "#7c3aed", "#2563eb", "#16a34a", "#facc15"];

type EncounterWithParts = Encounter & {
  participants: CombatParticipant[];
  /** Portrait URL by `portraitKey`, for token art. */
  portraits?: Record<string, string>;
};

export function BattleMap({
  campaignId,
  maps: initialMaps,
  encounters,
}: {
  campaignId: number;
  maps: BattleMapRow[];
  encounters: Encounter[];
}) {
  const router = useRouter();
  const [maps, setMaps] = useState(initialMaps);
  const [activeId, setActiveId] = useState<number | null>(initialMaps[0]?.id ?? null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [tool, setTool] = useState<MapTool>("select");
  const [templateSizeFt, setTemplateSizeFt] = useState(20);
  const [templateColor, setTemplateColor] = useState(TEMPLATE_COLORS[0]);
  const [brushCells, setBrushCells] = useState(3);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [fetched, setFetched] = useState<EncounterWithParts | null>(null);
  // Bumped after area damage so the encounter (and token HP) reloads at once.
  const [reloadKey, setReloadKey] = useState(0);
  // The DM's edits to who an AoE template catches, tied to the exact template
  // position they were made for; moving or resizing it starts a fresh guess.
  const [aoeEdit, setAoeEdit] = useState<(AoeSelection & { key: string }) | null>(null);

  const map = maps.find((m) => m.id === activeId) ?? null;

  // Only trust the fetched encounter while it still matches the linked one, so
  // unlinking or switching maps drops the old combatants without a state write.
  const live = map?.encounterId && fetched?.id === map.encounterId ? fetched : null;

  /* ---------------------------------------------------------------------- */
  /*  Persistence                                                            */
  /* ---------------------------------------------------------------------- */

  // Token drags fire fast; coalesce writes so a flurry of moves is one request.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatch = useRef<Partial<BattleMapRow>>({});

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const flush = useCallback(async (id: number) => {
    const patch = pendingPatch.current;
    pendingPatch.current = {};
    if (Object.keys(patch).length === 0) return;
    try {
      await api.patch(`/api/battle-maps/${id}`, patch);
    } catch {
      toast.error("Failed to save the map");
    }
  }, []);

  const update = useCallback(
    (patch: Partial<BattleMapRow>, { immediate = false } = {}) => {
      if (!map) return;
      const id = map.id;
      setMaps((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
      pendingPatch.current = { ...pendingPatch.current, ...patch };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (immediate) void flush(id);
      else saveTimer.current = setTimeout(() => void flush(id), 500);
    },
    [map, flush],
  );

  /* ---------------------------------------------------------------------- */
  /*  Player-moved tokens                                                    */
  /* ---------------------------------------------------------------------- */

  // Whether players may drag the tokens handed to them (lan.json), and whether
  // sharing is on at all — without it no phone can reach the player view.
  const [lan, setLan] = useState<{ enabled: boolean; allowPlayerTokenMoves: boolean } | null>(null);
  useEffect(() => {
    let cancelled = false;
    api
      .get<{ enabled: boolean; allowPlayerTokenMoves: boolean }>("/api/lan")
      .then((data) => {
        if (!cancelled) setLan(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function togglePlayerMoves() {
    if (!lan) return;
    const allowPlayerTokenMoves = !lan.allowPlayerTokenMoves;
    try {
      await api.put("/api/lan", { allowPlayerTokenMoves });
      setLan({ ...lan, allowPlayerTokenMoves });
    } catch {
      toast.error("Couldn't change the setting");
    }
  }

  // While players can move tokens, pick their moves up from the server so the
  // DM's map (and the next save from it) doesn't drag them back. Only the
  // positions of player-controlled tokens are taken, and never while the DM
  // has unsaved token edits of their own.
  const watchPlayerMoves =
    !!map &&
    map.revealToPlayers &&
    !!lan?.enabled &&
    !!lan.allowPlayerTokenMoves &&
    map.tokens.some((t) => t.playerControllable);
  const mapId = map?.id;
  useEffect(() => {
    if (!watchPlayerMoves || !mapId) return;
    let cancelled = false;
    async function pull() {
      try {
        const remote = await api.get<BattleMapRow>(`/api/battle-maps/${mapId}`);
        if (cancelled || pendingPatch.current.tokens) return;
        const where = new Map(remote.tokens.map((t) => [t.id, t]));
        setMaps((prev) =>
          prev.map((m) => {
            if (m.id !== mapId) return m;
            let changed = false;
            const tokens = m.tokens.map((t) => {
              const r = where.get(t.id);
              if (!t.playerControllable || !r || (r.x === t.x && r.y === t.y)) return t;
              changed = true;
              return { ...t, x: r.x, y: r.y };
            });
            return changed ? { ...m, tokens } : m;
          }),
        );
      } catch {
        // A missed poll is picked up by the next one.
      }
    }
    const timer = setInterval(pull, COMBAT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [watchPlayerMoves, mapId]);

  /* ---------------------------------------------------------------------- */
  /*  Combat sync                                                            */
  /* ---------------------------------------------------------------------- */

  // Poll the linked encounter so HP and conditions on tokens follow the
  // tracker, matching how the player view stays live.
  useEffect(() => {
    const encounterId = map?.encounterId;
    if (!encounterId) return;

    let cancelled = false;
    async function load() {
      try {
        const data = await api.get<EncounterWithParts>(`/api/encounters/${encounterId}`);
        if (!cancelled) setFetched(data);
      } catch {
        // A deleted encounter just stops updating the badges.
      }
    }
    load();
    const timer = setInterval(load, COMBAT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [map?.encounterId, reloadKey]);

  const statuses = useMemo(() => {
    const result: Record<string, TokenStatus> = {};
    if (!map || !live) return result;
    for (const token of map.tokens) {
      const participant = live.participants.find((p) => p.id === token.participantId);
      if (participant) {
        result[token.id] = {
          hpCurrent: participant.hpCurrent,
          hpMax: participant.hpMax,
          conditions: conditionNames(participant.conditions),
        };
      }
    }
    return result;
  }, [map, live]);

  // Token art: the token's own image, else its combatant's portrait.
  const tokenImages = useMemo(
    () =>
      map
        ? resolveTokenImages(map.tokens, live?.participants ?? [], live?.portraits ?? {})
        : {},
    [map, live],
  );

  const [tokenArtUploading, setTokenArtUploading] = useState(false);
  async function uploadTokenArt(tokenId: string, file: File) {
    setTokenArtUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await api.upload<{ url: string }>("/api/upload", fd);
      patchToken(tokenId, { imageUrl: url });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setTokenArtUploading(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Map + token actions                                                    */
  /* ---------------------------------------------------------------------- */

  async function createMap() {
    try {
      const created = await api.post<BattleMapRow>("/api/battle-maps", {
        campaignId,
        name: `Map ${maps.length + 1}`,
      });
      setMaps((prev) => [created, ...prev]);
      setActiveId(created.id);
    } catch {
      toast.error("Failed to create the map");
    }
  }

  async function deleteMap() {
    if (!map) return;
    try {
      await api.delete(`/api/battle-maps/${map.id}`);
      const remaining = maps.filter((m) => m.id !== map.id);
      setMaps(remaining);
      setActiveId(remaining[0]?.id ?? null);
      toast.success("Map deleted");
    } catch {
      toast.error("Failed to delete the map");
    }
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await api.upload<{ url: string }>("/api/upload", fd);
      update({ imageUrl: url }, { immediate: true });
      toast.success("Map image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function moveToken(id: string, x: number, y: number) {
    if (!map) return;
    update({ tokens: map.tokens.map((t) => (t.id === id ? { ...t, x, y } : t)) });
  }

  function patchToken(id: string, patch: Partial<BattleToken>) {
    if (!map) return;
    update({ tokens: map.tokens.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  }

  function removeToken(id: string) {
    if (!map) return;
    update({ tokens: map.tokens.filter((t) => t.id !== id) });
    setSelectedTokenId(null);
  }

  function addToken(partial: Partial<BattleToken> = {}) {
    if (!map) return;
    const token: BattleToken = {
      id: crypto.randomUUID(),
      label: "Token",
      x: 0,
      y: 0,
      color: TOKEN_COLORS[map.tokens.length % TOKEN_COLORS.length],
      sizeCells: 1,
      ...partial,
    };
    update({ tokens: [...map.tokens, token] });
    setSelectedTokenId(token.id);
  }

  /**
   * Drop every combatant not already on the map into the first free cells,
   * left to right. Existing tokens keep their positions.
   */
  function addCombatants() {
    if (!map || !live) return;
    const existing = new Set(
      map.tokens.map((t) => t.participantId).filter((id): id is number => id !== undefined),
    );
    const missing = live.participants.filter((p) => !existing.has(p.id));
    if (missing.length === 0) {
      toast.info("Every combatant is already on the map");
      return;
    }

    const taken = new Set(map.tokens.map((t) => `${t.x},${t.y}`));
    const added: BattleToken[] = [];
    let cursor = 0;
    for (const participant of missing) {
      // Walk the grid for the next unoccupied cell.
      while (cursor < map.gridCols * map.gridRows) {
        const x = cursor % map.gridCols;
        const y = Math.floor(cursor / map.gridCols);
        cursor++;
        if (taken.has(`${x},${y}`)) continue;
        taken.add(`${x},${y}`);
        added.push({
          id: crypto.randomUUID(),
          participantId: participant.id,
          label: participant.name,
          x,
          y,
          color:
            participant.entityType === "character"
              ? "#2563eb"
              : TOKEN_COLORS[added.length % TOKEN_COLORS.length],
          sizeCells: 1,
          // Monsters start hidden from players; the party does not.
          hidden: participant.entityType !== "character",
        });
        break;
      }
    }

    update({ tokens: [...map.tokens, ...added] });
    toast.success(`Added ${added.length} combatant${added.length === 1 ? "" : "s"}`);
  }

  /* ---------------------------------------------------------------------- */
  /*  Annotations                                                            */
  /* ---------------------------------------------------------------------- */

  function addAnnotation(annotation: MapAnnotation) {
    if (!map) return;
    update({ annotations: [...map.annotations, annotation] });
    setSelectedAnnotationId(annotation.id);
  }

  function patchAnnotation(id: string, patch: Partial<MapAnnotation>) {
    if (!map) return;
    update({
      annotations: map.annotations.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  }

  function moveAnnotation(id: string, x: number, y: number) {
    patchAnnotation(id, { x, y });
  }

  function removeAnnotation(id: string) {
    if (!map) return;
    update({ annotations: map.annotations.filter((a) => a.id !== id) });
    setSelectedAnnotationId(null);
  }

  function clearAnnotations() {
    if (!map) return;
    update({ annotations: [] }, { immediate: true });
    setSelectedAnnotationId(null);
    toast.success("Cleared all drawings and templates");
  }

  /* ---------------------------------------------------------------------- */
  /*  Fog of war                                                             */
  /* ---------------------------------------------------------------------- */

  // Fog is kept in step with the grid, so resizing the map re-lays the mask
  // rather than leaving a mask of the wrong shape behind.
  const fog = useMemo(
    () => (map ? fogForGrid(map.fog, map.gridCols, map.gridRows) : null),
    [map],
  );

  function handlePaintFog(col: number, row: number, reveal: boolean) {
    if (!map || !fog) return;
    const next = paintFog(fog, col, row, brushCells, reveal);
    update({ fog: next });
  }

  function toggleFog() {
    if (!map) return;
    const enabling = !map.fogEnabled;
    update(
      {
        fogEnabled: enabling,
        // Turning fog on for the first time starts it fully hidden.
        fog: enabling ? (map.fog ?? createFog(map.gridCols, map.gridRows)) : map.fog,
      },
      { immediate: true },
    );
  }

  function resetFog(revealEverything: boolean) {
    if (!map || !fog) return;
    update(
      {
        fog: revealEverything ? revealAllFog(fog) : createFog(map.gridCols, map.gridRows),
      },
      { immediate: true },
    );
    toast.success(revealEverything ? "Whole map revealed" : "Fog reset");
  }

  const selectedToken = map?.tokens.find((t) => t.id === selectedTokenId) ?? null;
  const selectedAnnotation =
    map?.annotations.find((a) => a.id === selectedAnnotationId) ?? null;
  /** Templates have a size and rotation to edit; freehand and text don't. */
  const isTemplate =
    selectedAnnotation !== null &&
    ["circle", "cone", "line", "cube"].includes(selectedAnnotation.kind);

  // Who the selected template catches: the DM's own picks for this exact
  // placement, else every combatant token whose centre is inside it.
  const aoeKey = selectedAnnotation
    ? [
        selectedAnnotation.id,
        selectedAnnotation.x,
        selectedAnnotation.y,
        selectedAnnotation.sizeFt,
        selectedAnnotation.rotation,
        selectedAnnotation.widthFt,
      ].join(":")
    : "";
  const aoeSelection: AoeSelection | null =
    map && live && isTemplate && selectedAnnotation
      ? aoeEdit?.key === aoeKey
        ? aoeEdit
        : {
            affected: tokensInTemplate(selectedAnnotation, map.tokens, map.feetPerCell).filter(
              (id) => {
                const token = map.tokens.find((t) => t.id === id);
                return live.participants.some((p) => p.id === token?.participantId);
              },
            ),
            saved: [],
          }
      : null;

  if (maps.length === 0) {
    return (
      <EmptyState
        icon={MapIcon}
        title="No battle maps yet"
        description="Create a map, upload a floor plan and drop your encounter onto it."
        action={
          <Button onClick={createMap}>
            <Plus className="size-4" /> New map
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Map picker + top actions */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
        <Field label="Map" className="min-w-48 flex-1">
          <Select
            value={activeId ? String(activeId) : ""}
            onValueChange={(v) => {
              setActiveId(Number(v));
              setSelectedTokenId(null);
            }}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {maps.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button variant="outline" onClick={createMap}>
          <Plus className="size-4" /> New map
        </Button>
        {map && (
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
        )}
      </div>

      {map && (
        <>
          {/* Map settings */}
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
            <Field label="Name" className="min-w-40 flex-1">
              <Input
                value={map.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </Field>
            <Field label="Columns" className="w-24">
              <Input
                type="number"
                min={1}
                max={200}
                value={map.gridCols}
                onChange={(e) => update({ gridCols: clamp(e.target.value, 1, 200) })}
              />
            </Field>
            <Field label="Rows" className="w-24">
              <Input
                type="number"
                min={1}
                max={200}
                value={map.gridRows}
                onChange={(e) => update({ gridRows: clamp(e.target.value, 1, 200) })}
              />
            </Field>
            <Field label="Cell px" className="w-24">
              <Input
                type="number"
                min={16}
                max={200}
                value={map.gridSize}
                onChange={(e) => update({ gridSize: clamp(e.target.value, 16, 200) })}
              />
            </Field>
            <Field label="Encounter" className="min-w-44 flex-1">
              <Select
                value={map.encounterId ? String(map.encounterId) : "none"}
                onValueChange={(v) => update({ encounterId: v === "none" ? null : Number(v) }, { immediate: true })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked</SelectItem>
                  {encounters.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name}{e.status === "completed" ? " (ended)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <label className="inline-flex">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                  e.target.value = "";
                }}
              />
              <Button asChild variant="outline" disabled={uploading}>
                <span>
                  <Upload className="size-4" />
                  {uploading ? "Uploading…" : map.imageUrl ? "Replace image" : "Upload image"}
                </span>
              </Button>
            </label>
          </div>

          {/* Token actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={addCombatants} disabled={!live}>
              <Users className="size-4" /> Add combatants
            </Button>
            <Button variant="outline" onClick={() => addToken()}>
              <Plus className="size-4" /> Add token
            </Button>
            {!map.encounterId && (
              <span className="text-sm text-muted-foreground">
                Link an encounter to pull its combatants onto the map.
              </span>
            )}
          </div>

          {/* Tools */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex flex-wrap gap-1">
              {TOOLS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setTool(t.value);
                    if (t.value !== "select") {
                      setSelectedTokenId(null);
                      setSelectedAnnotationId(null);
                    }
                  }}
                  title={t.hint}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                    tool === t.value
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <t.icon className="size-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Size</span>
                <Select
                  value={String(templateSizeFt)}
                  onValueChange={(v) => setTemplateSizeFt(Number(v))}
                >
                  <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_SIZES.map((ft) => (
                      <SelectItem key={ft} value={String(ft)}>{ft} ft</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-1.5">
                {TEMPLATE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setTemplateColor(c)}
                    className={cn(
                      "size-5 rounded-full border-2",
                      templateColor === c ? "border-foreground" : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Template colour ${c}`}
                  />
                ))}
              </div>
              <Select
                value={map.diagonalRule}
                onValueChange={(v) =>
                  update({ diagonalRule: v as BattleMapRow["diagonalRule"] }, { immediate: true })
                }
              >
                <SelectTrigger className="h-8 w-36" title="How diagonal movement is counted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5-10-5">5-10-5 diagonals</SelectItem>
                  <SelectItem value="5-5-5">5-5-5 diagonals</SelectItem>
                </SelectContent>
              </Select>
              {map.annotations.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAnnotations}>
                  <Eraser className="size-3.5" /> Clear drawings
                </Button>
              )}
            </div>
          </div>

          {/* Fog of war + player streaming */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
            <Button
              variant={map.fogEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleFog}
            >
              <Cloud className="size-3.5" /> Fog of war {map.fogEnabled ? "on" : "off"}
            </Button>

            {map.fogEnabled && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Brush</span>
                  <Select value={String(brushCells)} onValueChange={(v) => setBrushCells(Number(v))}>
                    <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 square</SelectItem>
                      <SelectItem value="3">3 squares</SelectItem>
                      <SelectItem value="5">5 squares</SelectItem>
                      <SelectItem value="9">9 squares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={() => resetFog(true)}>
                  Reveal all
                </Button>
                <Button variant="outline" size="sm" onClick={() => resetFog(false)}>
                  <RotateCcw className="size-3.5" /> Reset fog
                </Button>
              </>
            )}

            <Button
              variant={map.revealToPlayers ? "default" : "outline"}
              size="sm"
              className="ml-auto"
              onClick={() =>
                update({ revealToPlayers: !map.revealToPlayers }, { immediate: true })
              }
              title="Show this map on the player view"
            >
              <Monitor className="size-3.5" />
              {map.revealToPlayers ? "Showing to players" : "Show to players"}
            </Button>
            <Button
              variant={lan?.enabled && lan.allowPlayerTokenMoves ? "default" : "outline"}
              size="sm"
              onClick={togglePlayerMoves}
              disabled={!lan?.enabled}
              title={
                lan?.enabled
                  ? "Let players drag the tokens you've handed them from their phones"
                  : "Turn on local-network sharing in Settings first"
              }
            >
              <Hand className="size-3.5" />
              {lan?.enabled && lan.allowPlayerTokenMoves
                ? "Players can move their tokens"
                : "Player token moves off"}
            </Button>
          </div>

          {map.revealToPlayers && (
            <p className="text-xs text-muted-foreground">
              Players see this map within a few seconds. Fogged areas are solid black
              for them, and tokens marked hidden or standing in fog aren&apos;t drawn at
              all — but anything you draw on the map is visible, so keep secrets off it.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
            <BattleMapCanvas
              map={{
                imageUrl: map.imageUrl,
                gridSize: map.gridSize,
                gridCols: map.gridCols,
                gridRows: map.gridRows,
                feetPerCell: map.feetPerCell,
                diagonalRule: map.diagonalRule,
                tokens: map.tokens,
                annotations: map.annotations,
                fog,
                fogEnabled: map.fogEnabled,
              }}
              statuses={statuses}
              tokenImages={tokenImages}
              highlightTokenIds={aoeSelection?.affected}
              tool={tool}
              templateSizeFt={templateSizeFt}
              templateColor={templateColor}
              brushCells={brushCells}
              selectedTokenId={selectedTokenId}
              selectedAnnotationId={selectedAnnotationId}
              onSelectToken={(id) => {
                setSelectedTokenId(id);
                if (id) setSelectedAnnotationId(null);
              }}
              onSelectAnnotation={(id) => {
                setSelectedAnnotationId(id);
                if (id) setSelectedTokenId(null);
              }}
              onMoveToken={moveToken}
              onAddAnnotation={addAnnotation}
              onMoveAnnotation={moveAnnotation}
              onPaintFog={handlePaintFog}
            />

            {/* Token inspector */}
            <div className="space-y-3">
              {selectedToken ? (
                <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <h3 className="font-medium">Token</h3>
                  <Field label="Label">
                    <Input
                      value={selectedToken.label}
                      onChange={(e) => patchToken(selectedToken.id, { label: e.target.value })}
                    />
                  </Field>
                  <Field label="Size">
                    <Select
                      value={String(selectedToken.sizeCells)}
                      onValueChange={(v) => patchToken(selectedToken.id, { sizeCells: Number(v) })}
                    >
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Medium (1×1)</SelectItem>
                        <SelectItem value="2">Large (2×2)</SelectItem>
                        <SelectItem value="3">Huge (3×3)</SelectItem>
                        <SelectItem value="4">Gargantuan (4×4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Colour">
                    <div className="flex flex-wrap gap-2">
                      {TOKEN_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => patchToken(selectedToken.id, { color: c })}
                          className={cn(
                            "size-6 rounded-full border-2",
                            selectedToken.color === c ? "border-foreground" : "border-transparent",
                          )}
                          style={{ backgroundColor: c }}
                          aria-label={`Colour ${c}`}
                        />
                      ))}
                    </div>
                  </Field>
                  <Field
                    label="Token art"
                    hint={
                      selectedToken.imageUrl
                        ? undefined
                        : tokenImages[selectedToken.id]
                          ? "Using the combatant's portrait"
                          : "None — a plain coloured disc"
                    }
                  >
                    <div className="flex items-center gap-2">
                      {tokenImages[selectedToken.id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={tokenImages[selectedToken.id]}
                          alt=""
                          className="size-9 rounded-full border border-border object-cover"
                        />
                      ) : null}
                      <label className="inline-flex">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/gif,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadTokenArt(selectedToken.id, f);
                            e.target.value = "";
                          }}
                        />
                        <Button asChild variant="outline" size="sm" disabled={tokenArtUploading}>
                          <span>
                            <Upload className="size-3.5" />
                            {tokenArtUploading ? "Uploading…" : selectedToken.imageUrl ? "Replace" : "Upload"}
                          </span>
                        </Button>
                      </label>
                      {selectedToken.imageUrl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => patchToken(selectedToken.id, { imageUrl: undefined })}
                        >
                          Clear
                        </Button>
                      ) : null}
                    </div>
                  </Field>
                  <div className="space-y-2 rounded-lg border border-border p-2.5">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!selectedToken.playerControllable}
                        onChange={(e) =>
                          patchToken(selectedToken.id, {
                            playerControllable: e.target.checked,
                            controllerName:
                              selectedToken.controllerName || selectedToken.label || undefined,
                          })
                        }
                        className="accent-primary"
                      />
                      <Hand className="size-3.5 text-muted-foreground" /> A player moves this token
                    </label>
                    {selectedToken.playerControllable ? (
                      <>
                        <Input
                          value={selectedToken.controllerName ?? ""}
                          onChange={(e) =>
                            patchToken(selectedToken.id, { controllerName: e.target.value.slice(0, 60) })
                          }
                          placeholder="Player name"
                          aria-label="Player name"
                          className="h-8"
                        />
                        <p className="text-xs text-muted-foreground">
                          On the player view they pick this name, then drag the token.
                          {!lan?.enabled
                            ? " Needs local-network sharing (Settings)."
                            : !lan.allowPlayerTokenMoves
                              ? " Switch on “Players can move their tokens” above."
                              : ""}
                        </p>
                      </>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      patchToken(selectedToken.id, { hidden: !selectedToken.hidden })
                    }
                  >
                    {selectedToken.hidden ? (
                      <><EyeOff className="size-4" /> Hidden from players</>
                    ) : (
                      <><Eye className="size-4" /> Visible to players</>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => removeToken(selectedToken.id)}
                  >
                    <Trash2 className="size-4" /> Remove token
                  </Button>
                </div>
              ) : selectedAnnotation ? (
                <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <h3 className="font-medium capitalize">{selectedAnnotation.kind}</h3>
                  {isTemplate && (
                    <>
                      <Field label="Size" hint={`${selectedAnnotation.sizeFt ?? 0} ft`}>
                        <Input
                          type="number"
                          min={5}
                          max={200}
                          step={5}
                          value={selectedAnnotation.sizeFt ?? 0}
                          onChange={(e) =>
                            patchAnnotation(selectedAnnotation.id, {
                              sizeFt: clamp(e.target.value, 5, 200),
                            })
                          }
                        />
                      </Field>
                      {selectedAnnotation.kind === "line" && (
                        <Field label="Width">
                          <Input
                            type="number"
                            min={5}
                            max={50}
                            step={5}
                            value={selectedAnnotation.widthFt ?? 5}
                            onChange={(e) =>
                              patchAnnotation(selectedAnnotation.id, {
                                widthFt: clamp(e.target.value, 5, 50),
                              })
                            }
                          />
                        </Field>
                      )}
                      {selectedAnnotation.kind !== "circle" && (
                        <Field
                          label="Rotation"
                          hint={`${Math.round(selectedAnnotation.rotation ?? 0)}°`}
                        >
                          <input
                            type="range"
                            min={0}
                            max={359}
                            value={selectedAnnotation.rotation ?? 0}
                            onChange={(e) =>
                              patchAnnotation(selectedAnnotation.id, {
                                rotation: Number(e.target.value),
                              })
                            }
                            className="w-full accent-primary"
                            aria-label="Rotation"
                          />
                        </Field>
                      )}
                    </>
                  )}
                  {isTemplate && live && aoeSelection && (
                    <AoeDamagePanel
                      tokens={map.tokens}
                      participants={live.participants}
                      encounterId={live.id}
                      round={live.roundNumber}
                      selection={aoeSelection}
                      onSelectionChange={(next) => setAoeEdit({ ...next, key: aoeKey })}
                      onApplied={() => {
                        setAoeEdit(null);
                        setReloadKey((k) => k + 1);
                        router.refresh();
                      }}
                    />
                  )}
                  {isTemplate && !live && (
                    <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                      Link an encounter to this map to apply this area&apos;s damage to the
                      combatants under it.
                    </p>
                  )}
                  <Field label="Colour">
                    <div className="flex flex-wrap gap-2">
                      {TEMPLATE_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => patchAnnotation(selectedAnnotation.id, { color: c })}
                          className={cn(
                            "size-6 rounded-full border-2",
                            selectedAnnotation.color === c
                              ? "border-foreground"
                              : "border-transparent",
                          )}
                          style={{ backgroundColor: c }}
                          aria-label={`Colour ${c}`}
                        />
                      ))}
                    </div>
                  </Field>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => removeAnnotation(selectedAnnotation.id)}
                  >
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  {tool === "measure"
                    ? "Click a square to anchor the tape, move to read the distance, click again to clear."
                    : tool !== "select"
                      ? TOOLS.find((t) => t.value === tool)?.hint
                      : map.tokens.length === 0
                        ? "No tokens yet. Add combatants from the linked encounter, or drop a blank token."
                        : "Select a token or shape to edit it. Drag tokens to move them — they snap to the grid."}
                </div>
              )}

              {/* Combatant list */}
              {live && (
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {live.name} — round {live.roundNumber}
                  </p>
                  <ul className="space-y-1">
                    {live.participants.map((p) => {
                      const token = map.tokens.find((t) => t.participantId === p.id);
                      return (
                        <li
                          key={p.id}
                          className="flex items-center justify-between gap-2 rounded px-2 py-1 text-sm"
                        >
                          <span className="truncate">{p.name}</span>
                          {token ? (
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              {p.hpCurrent}/{p.hpMax}
                            </Badge>
                          ) : (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              not placed
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {!map.imageUrl && (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-border p-4 text-center">
                  <ImageIcon className="mb-2 size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No background image — the bare grid works fine for theatre of the mind.
                  </p>
                </div>
              )}

              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Grid3x3 className="mt-0.5 size-3 shrink-0" />
                One cell is 5 ft. Set columns and rows to match the squares on your
                image, then adjust cell px until the grid lines up.
              </p>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${map?.name}?`}
        description="The map, its tokens and everything drawn on it will be removed."
        confirmLabel="Delete"
        onConfirm={deleteMap}
      />
    </div>
  );
}

function clamp(raw: string, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number(raw || min)));
}
