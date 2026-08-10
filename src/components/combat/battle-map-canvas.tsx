"use client";

import { useEffect, useState } from "react";
import { Stage, Layer, Rect, Line, Circle, Image as KonvaImage, Text, Group } from "react-konva";
import type Konva from "konva";
import { snapToGrid } from "@/lib/battle-map";
import type { BattleToken } from "@/db/schema";

/** Everything the canvas needs to draw, without the database bookkeeping. */
export type CanvasMap = {
  imageUrl: string | null;
  gridSize: number;
  gridCols: number;
  gridRows: number;
  tokens: BattleToken[];
};

/** Live HP and conditions for a token, looked up from the linked participant. */
export type TokenStatus = {
  hpCurrent: number;
  hpMax: number;
  conditions: string[];
};

export default function BattleMapCanvas({
  map,
  statuses,
  selectedTokenId,
  onSelectToken,
  onMoveToken,
  readOnly = false,
}: {
  map: CanvasMap;
  /** Keyed by token id. Tokens without a linked participant have no status. */
  statuses: Record<string, TokenStatus>;
  selectedTokenId: string | null;
  onSelectToken: (id: string | null) => void;
  onMoveToken: (id: string, x: number, y: number) => void;
  readOnly?: boolean;
}) {
  const { gridSize, gridCols, gridRows } = map;
  const width = gridCols * gridSize;
  const height = gridRows * gridSize;
  const image = useMapImage(map.imageUrl);

  return (
    <div className="overflow-auto rounded-lg border border-border bg-[#0b0b0c]">
      <Stage
        width={width}
        height={height}
        onMouseDown={(e) => {
          // A click on empty canvas clears the selection.
          if (e.target === e.target.getStage()) onSelectToken(null);
        }}
      >
        {/* Background image */}
        <Layer listening={false}>
          <Rect width={width} height={height} fill="#111113" />
          {image && <KonvaImage image={image} width={width} height={height} />}
        </Layer>

        {/* Grid */}
        <Layer listening={false}>
          <GridLines cols={gridCols} rows={gridRows} size={gridSize} />
        </Layer>

        {/* Tokens */}
        <Layer>
          {map.tokens.map((token) => (
            <TokenShape
              key={token.id}
              token={token}
              status={statuses[token.id]}
              gridSize={gridSize}
              gridCols={gridCols}
              gridRows={gridRows}
              selected={token.id === selectedTokenId}
              draggable={!readOnly}
              onSelect={() => onSelectToken(token.id)}
              onMove={(x, y) => onMoveToken(token.id, x, y)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

/**
 * Load a map image into an HTMLImageElement for Konva. The loaded URL is kept
 * with the element so swapping the map image doesn't flash the previous one
 * while the new file decodes.
 */
function useMapImage(url: string | null) {
  const [loaded, setLoaded] = useState<{ url: string; image: HTMLImageElement } | null>(null);
  useEffect(() => {
    if (!url) return;
    const img = new window.Image();
    img.src = url;
    img.onload = () => setLoaded({ url, image: img });
    return () => {
      img.onload = null;
    };
  }, [url]);
  return loaded && loaded.url === url ? loaded.image : null;
}

function GridLines({ cols, rows, size }: { cols: number; rows: number; size: number }) {
  const width = cols * size;
  const height = rows * size;
  const lines: React.ReactNode[] = [];
  for (let c = 0; c <= cols; c++) {
    lines.push(
      <Line
        key={`v${c}`}
        points={[c * size, 0, c * size, height]}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />,
    );
  }
  for (let r = 0; r <= rows; r++) {
    lines.push(
      <Line
        key={`h${r}`}
        points={[0, r * size, width, r * size]}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />,
    );
  }
  return <>{lines}</>;
}

function TokenShape({
  token,
  status,
  gridSize,
  gridCols,
  gridRows,
  selected,
  draggable,
  onSelect,
  onMove,
}: {
  token: BattleToken;
  status?: TokenStatus;
  gridSize: number;
  gridCols: number;
  gridRows: number;
  selected: boolean;
  draggable: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const size = Math.max(1, token.sizeCells);
  const px = size * gridSize;
  const radius = px / 2 - 2;

  const down = status ? status.hpCurrent <= 0 : false;
  const bloodied = status ? !down && status.hpMax > 0 && status.hpCurrent <= status.hpMax / 2 : false;
  const fontSize = Math.max(9, Math.min(14, gridSize / 4.5));

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target;
    // Konva reports pixels; the map stores cells, snapped to the grid.
    const x = snapToGrid(node.x() / gridSize, gridCols - size);
    const y = snapToGrid(node.y() / gridSize, gridRows - size);
    node.position({ x: x * gridSize, y: y * gridSize });
    onMove(x, y);
  }

  return (
    <Group
      x={token.x * gridSize}
      y={token.y * gridSize}
      draggable={draggable}
      onDragEnd={handleDragEnd}
      onMouseDown={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      opacity={token.hidden ? 0.45 : 1}
    >
      <Circle
        x={px / 2}
        y={px / 2}
        radius={radius}
        fill={token.color}
        stroke={selected ? "#ffffff" : down ? "#dc2626" : "rgba(0,0,0,0.6)"}
        strokeWidth={selected ? 3 : 2}
        dash={token.hidden ? [6, 4] : undefined}
      />

      {/* Name */}
      <Text
        y={px / 2 - fontSize / 2}
        width={px}
        align="center"
        text={token.label}
        fontSize={fontSize}
        fontStyle="bold"
        fill="#ffffff"
        shadowColor="#000000"
        shadowBlur={3}
        listening={false}
      />

      {/* HP bar for combatants linked to the encounter */}
      {status && status.hpMax > 0 && (
        <>
          <Rect
            x={4}
            y={px - 9}
            width={px - 8}
            height={5}
            fill="rgba(0,0,0,0.7)"
            cornerRadius={2}
            listening={false}
          />
          <Rect
            x={4}
            y={px - 9}
            width={Math.max(0, Math.min(1, status.hpCurrent / status.hpMax)) * (px - 8)}
            height={5}
            fill={down ? "#dc2626" : bloodied ? "#f59e0b" : "#22c55e"}
            cornerRadius={2}
            listening={false}
          />
        </>
      )}

      {/* Condition count badge */}
      {status && status.conditions.length > 0 && (
        <Group listening={false}>
          <Circle x={px - 7} y={7} radius={7} fill="#f59e0b" stroke="#000000" strokeWidth={1} />
          <Text
            x={px - 14}
            y={2}
            width={14}
            align="center"
            text={String(status.conditions.length)}
            fontSize={10}
            fontStyle="bold"
            fill="#000000"
          />
        </Group>
      )}
    </Group>
  );
}
