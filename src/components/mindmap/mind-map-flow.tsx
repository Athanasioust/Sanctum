"use client";

import { useCallback, useState } from "react";
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

type ResolveLink = (node: MindMapNode) => { href: string; label: string } | null;

function toFlowNode(node: MindMapNode, resolveLink: ResolveLink): FlowNode {
  const link = resolveLink(node);
  return {
    id: node.id,
    type: "mindMap",
    position: { x: node.x, y: node.y },
    data: {
      title: node.title,
      body: node.body,
      color: node.color,
      linkHref: link?.href,
      linkLabel: link?.label,
    },
  };
}

function toFlowEdge(edge: MindMapEdge): Edge {
  return {
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
  };
}

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
  resolveLink: ResolveLink;
}) {
  /*
   * React Flow keeps its own copy of the nodes, and the parent keeps the
   * semantic graph. That split is deliberate rather than tidy-minded.
   *
   * React Flow measures every node it hasn't seen before and writes the result
   * onto the node as `measured`. Rebuilding the node objects from `graph` on
   * every render drops that field, so `adoptUserNodes` resets the measurement
   * and re-measures, which emits a `dimensions` change. Feeding those changes
   * back into the parent's state produced fresh objects again — an infinite
   * measure/update loop that killed the canvas the moment the first node
   * existed. Keeping React Flow's array here preserves `measured`, and only
   * changes that actually alter the saved graph are pushed outward.
   */
  const [nodes, setNodes] = useState<FlowNode[]>(() =>
    graph.nodes.map((node) => toFlowNode(node, resolveLink)),
  );
  const [edges, setEdges] = useState<Edge[]>(() => graph.edges.map(toFlowEdge));

  // Re-derive when the parent's graph actually changes — a node added from the
  // toolbar, an inspector edit, an undo — keeping the measurements of nodes
  // that were already on screen. This is React's documented "adjust state while
  // rendering" pattern, which avoids an effect (and the extra paint one costs).
  const signature = JSON.stringify(graph);
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setNodes((previous) => {
      const measurements = new Map(previous.map((n) => [n.id, n]));
      return graph.nodes.map((node) => {
        const existing = measurements.get(node.id);
        const fresh = toFlowNode(node, resolveLink);
        return existing ? { ...existing, ...fresh, measured: existing.measured } : fresh;
      });
    });
    setEdges(graph.edges.map(toFlowEdge));
  }

  /** Turn React Flow's node array back into the shape the campaign stores. */
  const toGraph = useCallback(
    (flowNodes: FlowNode[], flowEdges: Edge[]): Graph => ({
      nodes: flowNodes
        .map((n) => {
          const original = graph.nodes.find((o) => o.id === n.id);
          return original ? { ...original, x: n.position.x, y: n.position.y } : null;
        })
        .filter((n): n is MindMapNode => n !== null),
      edges: flowEdges
        .map((e) => graph.edges.find((o) => o.id === e.id))
        .filter((e): e is MindMapEdge => e !== undefined),
    }),
    [graph],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      const next = applyNodeChanges(changes, nodes);
      setNodes(next);

      // Measuring and selecting are React Flow's business; they don't belong in
      // the saved graph and must not trigger a write, or the loop described
      // above starts again. Only a finished drag or a removal is worth saving —
      // the intermediate frames of a drag would also flood the undo history.
      const semantic = changes.some(
        (c) => c.type === "remove" || (c.type === "position" && c.dragging === false),
      );
      if (!semantic) return;

      const survivingEdges = edges.filter(
        (e) => next.some((n) => n.id === e.source) && next.some((n) => n.id === e.target),
      );
      if (survivingEdges.length !== edges.length) setEdges(survivingEdges);
      onChange(toGraph(next, survivingEdges), { history: true });
    },
    [nodes, edges, onChange, toGraph],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      const next = applyEdgeChanges(changes, edges);
      setEdges(next);
      if (changes.some((c) => c.type === "remove")) {
        onChange(toGraph(nodes, next), { history: true });
      }
    },
    [nodes, edges, onChange, toGraph],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const id = crypto.randomUUID();
      setEdges((previous) => addEdge({ ...connection, id }, previous));
      onChange(
        {
          nodes: graph.nodes,
          edges: [
            ...graph.edges,
            { id, source: connection.source, target: connection.target, label: "" },
          ],
        },
        { history: true },
      );
    },
    [graph, onChange],
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
