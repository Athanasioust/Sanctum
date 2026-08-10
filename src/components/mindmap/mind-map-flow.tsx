"use client";

import { useCallback, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { renderMarkdown } from "@/lib/markdown";
import type { MindMapEdge, MindMapNode } from "@/db/schema";

/** The graph as the rest of the app stores it. */
export type Graph = { nodes: MindMapNode[]; edges: MindMapEdge[] };

/** Extra data carried on each React Flow node. */
type NodeData = {
  title: string;
  body: string;
  color: string;
  linkHref?: string;
  linkLabel?: string;
};

type FlowNode = Node<NodeData, "mindMap">;

/**
 * A mind-map node: a coloured card with a title, optional markdown body and an
 * optional link to a campaign entity. Connection handles sit on all four sides
 * so edges can leave in whichever direction reads best.
 */
function MindMapNodeCard({ data, selected }: NodeProps<FlowNode>) {
  return (
    <div
      className="min-w-40 max-w-64 rounded-xl border-2 bg-card px-3 py-2 shadow-lg"
      style={{ borderColor: selected ? "#ffffff" : data.color }}
    >
      <Handle type="target" position={Position.Top} className="!size-2 !bg-muted-foreground" />
      <Handle type="target" position={Position.Left} className="!size-2 !bg-muted-foreground" />

      <div className="mb-1 flex items-center gap-1.5">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: data.color }} />
        <p className="truncate text-sm font-semibold">{data.title || "Untitled"}</p>
      </div>

      {data.body && (
        <div
          className="prose prose-invert prose-sm max-w-none text-xs text-muted-foreground [&_p]:my-0.5"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(data.body) }}
        />
      )}

      {data.linkHref && (
        <a
          href={data.linkHref}
          className="mt-1.5 block truncate text-xs text-primary underline decoration-dotted underline-offset-2"
          // Stop React Flow from treating the click as the start of a drag.
          onMouseDown={(e) => e.stopPropagation()}
        >
          {data.linkLabel}
        </a>
      )}

      <Handle type="source" position={Position.Bottom} className="!size-2 !bg-muted-foreground" />
      <Handle type="source" position={Position.Right} className="!size-2 !bg-muted-foreground" />
    </div>
  );
}

const NODE_TYPES = { mindMap: MindMapNodeCard };

export default function MindMapFlow({
  graph,
  onChange,
  onSelect,
  resolveLink,
}: {
  graph: Graph;
  /** Called with the whole graph after any structural edit. */
  onChange: (next: Graph, options?: { history?: boolean }) => void;
  onSelect: (nodeId: string | null) => void;
  /** Turn a node's entity link into an href and a label. */
  resolveLink: (node: MindMapNode) => { href: string; label: string } | null;
}) {
  const nodes = useMemo<FlowNode[]>(
    () =>
      graph.nodes.map((node) => {
        const link = resolveLink(node);
        return {
          id: node.id,
          type: "mindMap" as const,
          position: { x: node.x, y: node.y },
          data: {
            title: node.title,
            body: node.body,
            color: node.color,
            linkHref: link?.href,
            linkLabel: link?.label,
          },
        };
      }),
    [graph.nodes, resolveLink],
  );

  const edges = useMemo<Edge[]>(
    () =>
      graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: "default", // bezier
        animated: false,
        style: { stroke: edge.color ?? "#71717a", strokeWidth: 2 },
        labelStyle: { fill: "#e4e4e7", fontSize: 11 },
        labelBgStyle: { fill: "#18181b" },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      })),
    [graph.edges],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      const next = applyNodeChanges(changes, nodes);
      // Only a finished drag or a removal is worth an undo entry; the
      // intermediate positions of a drag would flood the history.
      const structural = changes.some(
        (c) => c.type === "remove" || (c.type === "position" && c.dragging === false),
      );
      onChange(
        {
          nodes: next.map((n) => {
            const original = graph.nodes.find((o) => o.id === n.id);
            return { ...original!, x: n.position.x, y: n.position.y };
          }),
          edges: graph.edges.filter((e) =>
            next.some((n) => n.id === e.source) && next.some((n) => n.id === e.target),
          ),
        },
        { history: structural },
      );
    },
    [nodes, graph, onChange],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      const next = applyEdgeChanges(changes, edges);
      onChange(
        {
          nodes: graph.nodes,
          edges: next.map((e) => graph.edges.find((o) => o.id === e.id)!).filter(Boolean),
        },
        { history: changes.some((c) => c.type === "remove") },
      );
    },
    [edges, graph, onChange],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const next = addEdge({ ...connection, id: crypto.randomUUID() }, edges);
      const added = next.find((e) => !graph.edges.some((o) => o.id === e.id));
      if (!added) return;
      onChange(
        {
          nodes: graph.nodes,
          edges: [
            ...graph.edges,
            { id: added.id, source: added.source, target: added.target, label: "" },
          ],
        },
        { history: true },
      );
    },
    [edges, graph, onChange],
  );

  return (
    <div className="h-[70vh] w-full overflow-hidden rounded-xl border border-border bg-[#0b0b0c]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={(_, node) => onSelect(node.id)}
        onPaneClick={() => onSelect(null)}
        colorMode="dark"
        fitView
        minZoom={0.1}
        maxZoom={2.5}
        // Shift-drag draws a selection box; plain drag pans the canvas.
        selectionOnDrag
        panOnDrag={[1, 2]}
        deleteKeyCode={["Backspace", "Delete"]}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#3f3f46" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => (n.data as NodeData).color}
          maskColor="rgba(0,0,0,0.6)"
          style={{ backgroundColor: "#18181b" }}
        />
      </ReactFlow>
    </div>
  );
}
