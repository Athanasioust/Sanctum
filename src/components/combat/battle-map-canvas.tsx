"use client";

import { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Line,
  Circle,
  Image as KonvaImage,
  Text,
  Group,
  Arrow,
  Label,
  Tag,
} from "react-konva";
import type Konva from "konva";
import {
  aoePoints,
  aoeRadiusCells,
  gridDistanceFeet,
  snapToGrid,
  type DiagonalRule,
  type Point,
} from "@/lib/battle-map";
import type { BattleToken, MapAnnotation } from "@/db/schema";

/** Everything the canvas needs to draw, without the database bookkeeping. */
export type CanvasMap = {
  imageUrl: string | null;
  gridSize: number;
  gridCols: number;
  gridRows: number;
  feetPerCell: number;
  diagonalRule: DiagonalRule;
  tokens: BattleToken[];
  annotations: MapAnnotation[];
};

/** Live HP and conditions for a token, looked up from the linked participant. */
export type TokenStatus = {
  hpCurrent: number;
  hpMax: number;
  conditions: string[];
};

/** What a click on the canvas does. */
export type MapTool =
  | "select"
  | "measure"
  | "draw"
  | "arrow"
  | "text"
  | "circle"
  | "cone"
  | "line"
  | "cube";

export default function BattleMapCanvas({
  map,
  statuses,
  tool,
  templateSizeFt,
  templateColor,
  selectedTokenId,
  selectedAnnotationId,
  onSelectToken,
  onSelectAnnotation,
  onMoveToken,
  onAddAnnotation,
  onMoveAnnotation,
  readOnly = false,
}: {
  map: CanvasMap;
  statuses: Record<string, TokenStatus>;
  tool: MapTool;
  /** Size in feet for the next AoE template placed. */
  templateSizeFt: number;
  templateColor: string;
  selectedTokenId: string | null;
  selectedAnnotationId: string | null;
  onSelectToken: (id: string | null) => void;
  onSelectAnnotation: (id: string | null) => void;
  onMoveToken: (id: string, x: number, y: number) => void;
  onAddAnnotation: (annotation: MapAnnotation) => void;
  onMoveAnnotation: (id: string, x: number, y: number) => void;
  readOnly?: boolean;
}) {
  const { gridSize, gridCols, gridRows, feetPerCell, diagonalRule } = map;
  const width = gridCols * gridSize;
  const height = gridRows * gridSize;
  const image = useMapImage(map.imageUrl);

  /** Measure tool: the anchor point and the live cursor, in cells. */
  const [measureFrom, setMeasureFrom] = useState<Point | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  /** Freehand stroke in progress, as flat cell coordinates. */
  const stroke = useRef<number[]>([]);
  const [drawing, setDrawing] = useState<number[] | null>(null);

  const isTemplateTool = ["circle", "cone", "line", "cube"].includes(tool);

  /** Pointer position in (fractional) cell coordinates. */
  function pointerCell(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): Point | null {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return null;
    return { x: pos.x / gridSize, y: pos.y / gridSize };
  }

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (readOnly) return;
    const cell = pointerCell(e);
    if (!cell) return;

    if (tool === "select") {
      if (e.target === e.target.getStage()) {
        onSelectToken(null);
        onSelectAnnotation(null);
      }
      return;
    }

    if (tool === "measure") {
      // First click anchors, second click clears — snapped to cell centres.
      setMeasureFrom(measureFrom ? null : { x: Math.floor(cell.x), y: Math.floor(cell.y) });
      return;
    }

    if (tool === "draw" || tool === "arrow") {
      stroke.current = [cell.x, cell.y];
      setDrawing([cell.x, cell.y]);
      return;
    }

    if (tool === "text") {
      const text = window.prompt("Label text");
      if (!text?.trim()) return;
      onAddAnnotation({
        id: crypto.randomUUID(),
        kind: "text",
        color: templateColor,
        x: cell.x,
        y: cell.y,
        text: text.trim().slice(0, 200),
      });
      return;
    }

    if (isTemplateTool) {
      onAddAnnotation({
        id: crypto.randomUUID(),
        kind: tool as MapAnnotation["kind"],
        color: templateColor,
        // Templates snap to a grid intersection so they line up with squares.
        x: snapToGrid(cell.x, gridCols),
        y: snapToGrid(cell.y, gridRows),
        rotation: 0,
        sizeFt: templateSizeFt,
        widthFt: tool === "line" ? 5 : undefined,
      });
    }
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    const cell = pointerCell(e);
    if (!cell) return;
    if (tool === "measure" && measureFrom) {
      setCursor({ x: Math.floor(cell.x), y: Math.floor(cell.y) });
      return;
    }
    if (drawing) {
      // Thin the stroke so a long drag doesn't store thousands of points.
      const points = stroke.current;
      const lastX = points[points.length - 2];
      const lastY = points[points.length - 1];
      if (Math.hypot(cell.x - lastX, cell.y - lastY) < 0.15) return;
      stroke.current = [...points, cell.x, cell.y];
      setDrawing(stroke.current);
    }
  }

  function handleMouseUp() {
    if (!drawing) return;
    const points = stroke.current;
    stroke.current = [];
    setDrawing(null);
    if (points.length < 4) return;

    onAddAnnotation({
      id: crypto.randomUUID(),
      kind: tool === "arrow" ? "arrow" : "freehand",
      color: templateColor,
      x: 0,
      y: 0,
      // An arrow only needs its two ends; freehand keeps the whole path.
      points:
        tool === "arrow"
          ? [points[0], points[1], points[points.length - 2], points[points.length - 1]]
          : points,
    });
  }

  const measureFeet =
    measureFrom && cursor
      ? gridDistanceFeet(measureFrom, cursor, diagonalRule, feetPerCell)
      : null;

  return (
    <div className="overflow-auto rounded-lg border border-border bg-[#0b0b0c]">
      <Stage
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: tool === "select" ? "default" : "crosshair" }}
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

        {/* Annotations sit under the tokens so combatants stay readable */}
        <Layer>
          {map.annotations.map((annotation) => (
            <AnnotationShape
              key={annotation.id}
              annotation={annotation}
              gridSize={gridSize}
              gridCols={gridCols}
              gridRows={gridRows}
              feetPerCell={feetPerCell}
              selected={annotation.id === selectedAnnotationId}
              draggable={!readOnly && tool === "select"}
              onSelect={() => onSelectAnnotation(annotation.id)}
              onMove={(x, y) => onMoveAnnotation(annotation.id, x, y)}
            />
          ))}
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
              draggable={!readOnly && tool === "select"}
              onSelect={() => onSelectToken(token.id)}
              onMove={(x, y) => onMoveToken(token.id, x, y)}
            />
          ))}
        </Layer>

        {/* Live overlays: the stroke being drawn and the measuring tape */}
        <Layer listening={false}>
          {drawing && drawing.length >= 4 && (
            <Line
              points={drawing.map((v) => v * gridSize)}
              stroke={templateColor}
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
              tension={tool === "arrow" ? 0 : 0.4}
            />
          )}
          {measureFrom && cursor && (
            <MeasureOverlay
              from={measureFrom}
              to={cursor}
              gridSize={gridSize}
              feet={measureFeet ?? 0}
            />
          )}
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

/** The measuring tape: a line from anchor to cursor with the distance in feet. */
function MeasureOverlay({
  from,
  to,
  gridSize,
  feet,
}: {
  from: Point;
  to: Point;
  gridSize: number;
  feet: number;
}) {
  // Measure between cell centres, which is where a creature stands.
  const x1 = (from.x + 0.5) * gridSize;
  const y1 = (from.y + 0.5) * gridSize;
  const x2 = (to.x + 0.5) * gridSize;
  const y2 = (to.y + 0.5) * gridSize;
  return (
    <>
      <Line points={[x1, y1, x2, y2]} stroke="#facc15" strokeWidth={2} dash={[8, 4]} />
      <Circle x={x1} y={y1} radius={4} fill="#facc15" />
      <Circle x={x2} y={y2} radius={4} fill="#facc15" />
      <Label x={x2} y={y2 - 14}>
        <Tag fill="#facc15" cornerRadius={4} pointerDirection="down" pointerWidth={8} pointerHeight={6} />
        <Text text={`${feet} ft`} fontSize={13} fontStyle="bold" padding={5} fill="#000000" />
      </Label>
    </>
  );
}

function AnnotationShape({
  annotation,
  gridSize,
  gridCols,
  gridRows,
  feetPerCell,
  selected,
  draggable,
  onSelect,
  onMove,
}: {
  annotation: MapAnnotation;
  gridSize: number;
  gridCols: number;
  gridRows: number;
  feetPerCell: number;
  selected: boolean;
  draggable: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const common = {
    onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      onSelect();
    },
    onTap: (e: Konva.KonvaEventObject<Event>) => {
      e.cancelBubble = true;
      onSelect();
    },
    draggable,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      onMove(
        Math.max(0, Math.min(gridCols, node.x() / gridSize)),
        Math.max(0, Math.min(gridRows, node.y() / gridSize)),
      );
    },
  };

  const stroke = selected ? "#ffffff" : annotation.color;
  const strokeWidth = selected ? 3 : 2;

  // Freehand strokes and arrows carry absolute points, so they draw at the
  // origin and move by their own offset rather than an x/y anchor.
  if (annotation.kind === "freehand" || annotation.kind === "arrow") {
    const points = (annotation.points ?? []).map((v) => v * gridSize);
    if (points.length < 4) return null;
    const Shape = annotation.kind === "arrow" ? Arrow : Line;
    return (
      <Shape
        {...common}
        x={annotation.x * gridSize}
        y={annotation.y * gridSize}
        points={points}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={annotation.kind === "arrow" ? annotation.color : undefined}
        lineCap="round"
        lineJoin="round"
        tension={annotation.kind === "freehand" ? 0.4 : 0}
        hitStrokeWidth={16}
      />
    );
  }

  if (annotation.kind === "text") {
    return (
      <Label {...common} x={annotation.x * gridSize} y={annotation.y * gridSize}>
        <Tag fill={annotation.color} cornerRadius={4} stroke={selected ? "#ffffff" : undefined} strokeWidth={selected ? 2 : 0} />
        <Text text={annotation.text ?? ""} fontSize={13} padding={5} fill="#ffffff" />
      </Label>
    );
  }

  if (annotation.kind === "circle") {
    return (
      <Circle
        {...common}
        x={annotation.x * gridSize}
        y={annotation.y * gridSize}
        radius={aoeRadiusCells(annotation, feetPerCell) * gridSize}
        fill={`${annotation.color}40`}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  const points = aoePoints(annotation, feetPerCell);
  if (!points) return null;
  return (
    <Line
      {...common}
      x={annotation.x * gridSize}
      y={annotation.y * gridSize}
      points={points.map((v) => v * gridSize)}
      closed
      fill={`${annotation.color}40`}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
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
