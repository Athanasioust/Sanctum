"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Eye,
  EyeOff,
  Grid3x3,
  ImageIcon,
  Map as MapIcon,
  Plus,
  Trash2,
  Upload,
  Users,
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
import { cn } from "@/lib/utils";
import type { TokenStatus } from "@/components/combat/battle-map-canvas";
import type {
  BattleMap as BattleMapRow,
  BattleToken,
  CombatParticipant,
  Encounter,
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

type EncounterWithParts = Encounter & { participants: CombatParticipant[] };

export function BattleMap({
  campaignId,
  maps: initialMaps,
  encounters,
}: {
  campaignId: number;
  maps: BattleMapRow[];
  encounters: Encounter[];
}) {
  const [maps, setMaps] = useState(initialMaps);
  const [activeId, setActiveId] = useState<number | null>(initialMaps[0]?.id ?? null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [fetched, setFetched] = useState<EncounterWithParts | null>(null);

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
  }, [map?.encounterId]);

  const statuses = useMemo(() => {
    const result: Record<string, TokenStatus> = {};
    if (!map || !live) return result;
    for (const token of map.tokens) {
      const participant = live.participants.find((p) => p.id === token.participantId);
      if (participant) {
        result[token.id] = {
          hpCurrent: participant.hpCurrent,
          hpMax: participant.hpMax,
          conditions: participant.conditions ?? [],
        };
      }
    }
    return result;
  }, [map, live]);

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

  const selectedToken = map?.tokens.find((t) => t.id === selectedTokenId) ?? null;

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

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
            <BattleMapCanvas
              map={{
                imageUrl: map.imageUrl,
                gridSize: map.gridSize,
                gridCols: map.gridCols,
                gridRows: map.gridRows,
                tokens: map.tokens,
              }}
              statuses={statuses}
              selectedTokenId={selectedTokenId}
              onSelectToken={setSelectedTokenId}
              onMoveToken={moveToken}
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
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  {map.tokens.length === 0
                    ? "No tokens yet. Add combatants from the linked encounter, or drop a blank token."
                    : "Select a token to edit it. Drag tokens to move them — they snap to the grid."}
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
