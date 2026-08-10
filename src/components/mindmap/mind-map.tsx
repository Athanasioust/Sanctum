"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Link2, Network, Plus, Redo2, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/shared/form";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { Graph } from "@/components/mindmap/mind-map-flow";
import type { MindMap as MindMapRow, MindMapLinkType, MindMapNode } from "@/db/schema";

const MindMapFlow = dynamic(() => import("@/components/mindmap/mind-map-flow"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center rounded-xl border border-border text-sm text-muted-foreground">
      Loading canvas…
    </div>
  ),
});

const NODE_COLORS = [
  "#7c3aed", "#dc2626", "#16a34a", "#2563eb", "#a16207", "#0891b2", "#db2777", "#65a30d",
];

/** Entities a node can point at, and where each one lives. */
const LINK_KINDS: { value: MindMapLinkType; label: string; segment: string }[] = [
  { value: "npc", label: "NPC", segment: "npcs" },
  { value: "location", label: "Location", segment: "world" },
  { value: "quest", label: "Quest", segment: "quests" },
  { value: "faction", label: "Faction", segment: "factions" },
  { value: "character", label: "Character", segment: "characters" },
];

export type LinkableEntity = { id: number; name: string; type: MindMapLinkType };

const MAX_HISTORY = 60;

export function MindMap({
  campaignId,
  maps: initialMaps,
  entities,
}: {
  campaignId: number;
  maps: MindMapRow[];
  entities: LinkableEntity[];
}) {
  const [maps, setMaps] = useState(initialMaps);
  const [activeId, setActiveId] = useState<number | null>(initialMaps[0]?.id ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const map = maps.find((m) => m.id === activeId) ?? null;

  /* ---------------------------------------------------------------------- */
  /*  Undo / redo                                                            */
  /* ---------------------------------------------------------------------- */

  // Snapshots of the graph before each structural edit. These are state rather
  // than refs because the undo/redo buttons' disabled state reads them.
  const [past, setPast] = useState<Graph[]>([]);
  const [future, setFuture] = useState<Graph[]>([]);

  /**
   * Switch canvases, clearing the undo stacks — a stack that spanned two maps
   * could restore the wrong graph onto the wrong canvas.
   */
  function selectMap(id: number | null) {
    setActiveId(id);
    setSelectedId(null);
    setPast([]);
    setFuture([]);
  }

  /* ---------------------------------------------------------------------- */
  /*  Persistence                                                            */
  /* ---------------------------------------------------------------------- */

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const persist = useCallback((id: number, graph: Graph) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.patch(`/api/mind-maps/${id}`, graph).catch(() => toast.error("Failed to save"));
    }, 600);
  }, []);

  const applyGraph = useCallback(
    (graph: Graph, { history = false } = {}) => {
      if (!map) return;
      if (history) {
        setPast((prev) => [...prev, { nodes: map.nodes, edges: map.edges }].slice(-MAX_HISTORY));
        setFuture([]);
      }
      setMaps((prev) =>
        prev.map((m) => (m.id === map.id ? { ...m, nodes: graph.nodes, edges: graph.edges } : m)),
      );
      persist(map.id, graph);
    },
    [map, persist],
  );

  function undo() {
    if (!map || past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [...prev, { nodes: map.nodes, edges: map.edges }]);
    setMaps((prev) => prev.map((m) => (m.id === map.id ? { ...m, ...previous } : m)));
    persist(map.id, previous);
  }

  function redo() {
    if (!map || future.length === 0) return;
    const next = future[future.length - 1];
    setFuture((prev) => prev.slice(0, -1));
    setPast((prev) => [...prev, { nodes: map.nodes, edges: map.edges }]);
    setMaps((prev) => prev.map((m) => (m.id === map.id ? { ...m, ...next } : m)));
    persist(map.id, next);
  }

  // Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z, unless the DM is typing in the inspector.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  /* ---------------------------------------------------------------------- */
  /*  Map + node actions                                                     */
  /* ---------------------------------------------------------------------- */

  async function createMap() {
    try {
      const created = await api.post<MindMapRow>("/api/mind-maps", {
        campaignId,
        name: `Mind map ${maps.length + 1}`,
      });
      setMaps((prev) => [created, ...prev]);
      selectMap(created.id);
    } catch {
      toast.error("Failed to create the mind map");
    }
  }

  async function deleteMap() {
    if (!map) return;
    try {
      await api.delete(`/api/mind-maps/${map.id}`);
      const remaining = maps.filter((m) => m.id !== map.id);
      setMaps(remaining);
      selectMap(remaining[0]?.id ?? null);
      toast.success("Mind map deleted");
    } catch {
      toast.error("Failed to delete the mind map");
    }
  }

  function renameMap(name: string) {
    if (!map) return;
    setMaps((prev) => prev.map((m) => (m.id === map.id ? { ...m, name } : m)));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.patch(`/api/mind-maps/${map.id}`, { name }).catch(() => toast.error("Failed to save"));
    }, 600);
  }

  function addNode() {
    if (!map) return;
    // Stagger new nodes so they don't stack on one spot.
    const offset = map.nodes.length * 30;
    const node: MindMapNode = {
      id: crypto.randomUUID(),
      x: 80 + (offset % 300),
      y: 80 + (offset % 240),
      title: "New idea",
      body: "",
      color: NODE_COLORS[map.nodes.length % NODE_COLORS.length],
    };
    applyGraph({ nodes: [...map.nodes, node], edges: map.edges }, { history: true });
    setSelectedId(node.id);
  }

  function patchNode(id: string, patch: Partial<MindMapNode>) {
    if (!map) return;
    applyGraph({
      nodes: map.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      edges: map.edges,
    });
  }

  function removeNode(id: string) {
    if (!map) return;
    applyGraph(
      {
        nodes: map.nodes.filter((n) => n.id !== id),
        edges: map.edges.filter((e) => e.source !== id && e.target !== id),
      },
      { history: true },
    );
    setSelectedId(null);
  }

  function setEdgeLabel(edgeId: string, label: string) {
    if (!map) return;
    applyGraph({
      nodes: map.nodes,
      edges: map.edges.map((e) => (e.id === edgeId ? { ...e, label } : e)),
    });
  }

  /** Where a node's entity link points, for the card and the inspector. */
  const resolveLink = useCallback(
    (node: MindMapNode) => {
      if (!node.linkType || !node.linkId) return null;
      const kind = LINK_KINDS.find((k) => k.value === node.linkType);
      const entity = entities.find(
        (e) => e.type === node.linkType && e.id === node.linkId,
      );
      if (!kind || !entity) return null;
      const href =
        node.linkType === "location"
          ? `/campaign/${campaignId}/world/${node.linkId}`
          : `/campaign/${campaignId}/${kind.segment}${
              node.linkType === "npc" || node.linkType === "character"
                ? `/${node.linkId}`
                : ""
            }`;
      return { href, label: `${kind.label}: ${entity.name}` };
    },
    [campaignId, entities],
  );

  const selectedNode = map?.nodes.find((n) => n.id === selectedId) ?? null;
  const connectedEdges = map?.edges.filter(
    (e) => e.source === selectedId || e.target === selectedId,
  );

  if (maps.length === 0) {
    return (
      <EmptyState
        icon={Network}
        title="No mind maps yet"
        description="An infinite canvas for plotting mysteries, factions and the threads between them."
        action={
          <Button onClick={createMap}>
            <Plus className="size-4" /> New mind map
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Map picker */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
        <Field label="Mind map" className="min-w-48 flex-1">
          <Select
            value={activeId ? String(activeId) : ""}
            onValueChange={(v) => selectMap(Number(v))}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {maps.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {map && (
          <Field label="Name" className="min-w-40 flex-1">
            <Input value={map.name} onChange={(e) => renameMap(e.target.value)} />
          </Field>
        )}
        <Button variant="outline" onClick={createMap}>
          <Plus className="size-4" /> New
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
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={addNode}>
              <Plus className="size-4" /> Add node
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={undo}
              disabled={past.length === 0}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={redo}
              disabled={future.length === 0}
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo"
            >
              <Redo2 className="size-4" />
            </Button>
            <p className="text-sm text-muted-foreground">
              Drag from a node&apos;s edge handle to connect. Shift-drag to select
              several. Delete removes what&apos;s selected.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
            <MindMapFlow
              key={map.id}
              graph={{ nodes: map.nodes, edges: map.edges }}
              onChange={applyGraph}
              onSelect={setSelectedId}
              resolveLink={resolveLink}
            />

            {/* Node inspector */}
            <div className="space-y-3">
              {selectedNode ? (
                <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <h3 className="font-medium">Node</h3>
                  <Field label="Title">
                    <Input
                      value={selectedNode.title}
                      onChange={(e) => patchNode(selectedNode.id, { title: e.target.value })}
                    />
                  </Field>
                  <Field label="Body" hint="Markdown works here.">
                    <Textarea
                      rows={5}
                      value={selectedNode.body}
                      onChange={(e) => patchNode(selectedNode.id, { body: e.target.value })}
                      placeholder="What this thread is about…"
                    />
                  </Field>
                  <Field label="Colour">
                    <div className="flex flex-wrap gap-2">
                      {NODE_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => patchNode(selectedNode.id, { color: c })}
                          className={cn(
                            "size-6 rounded-full border-2",
                            selectedNode.color === c ? "border-foreground" : "border-transparent",
                          )}
                          style={{ backgroundColor: c }}
                          aria-label={`Colour ${c}`}
                        />
                      ))}
                    </div>
                  </Field>

                  <Field label="Links to" hint="Ties this node back to your prep.">
                    <Select
                      value={
                        selectedNode.linkType && selectedNode.linkId
                          ? `${selectedNode.linkType}:${selectedNode.linkId}`
                          : "none"
                      }
                      onValueChange={(v) => {
                        if (v === "none") {
                          patchNode(selectedNode.id, { linkType: undefined, linkId: undefined });
                          return;
                        }
                        const [type, id] = v.split(":");
                        patchNode(selectedNode.id, {
                          linkType: type as MindMapLinkType,
                          linkId: Number(id),
                        });
                      }}
                    >
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— nothing —</SelectItem>
                        {LINK_KINDS.map((kind) => {
                          const options = entities.filter((e) => e.type === kind.value);
                          if (options.length === 0) return null;
                          return options.map((entity) => (
                            <SelectItem
                              key={`${kind.value}:${entity.id}`}
                              value={`${kind.value}:${entity.id}`}
                            >
                              {kind.label}: {entity.name}
                            </SelectItem>
                          ));
                        })}
                      </SelectContent>
                    </Select>
                  </Field>

                  {connectedEdges && connectedEdges.length > 0 && (
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                        <Link2 className="size-3" /> Connections
                      </p>
                      <div className="space-y-1.5">
                        {connectedEdges.map((edge) => {
                          const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                          const other = map.nodes.find((n) => n.id === otherId);
                          return (
                            <div key={edge.id}>
                              <p className="truncate text-xs text-muted-foreground">
                                {edge.source === selectedNode.id ? "→ " : "← "}
                                {other?.title || "Untitled"}
                              </p>
                              <Input
                                value={edge.label ?? ""}
                                onChange={(e) => setEdgeLabel(edge.id, e.target.value)}
                                placeholder="Label this connection"
                                className="h-7 text-xs"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => removeNode(selectedNode.id)}
                  >
                    <Trash2 className="size-4" /> Delete node
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  {map.nodes.length === 0
                    ? "Empty canvas. Add a node to start plotting."
                    : "Select a node to edit its title, body, colour, links and connection labels."}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${map?.name}?`}
        description="Every node and connection on this canvas will be removed."
        confirmLabel="Delete"
        onConfirm={deleteMap}
      />
    </div>
  );
}
