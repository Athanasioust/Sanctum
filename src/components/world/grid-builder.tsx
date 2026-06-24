"use client";

import { useState } from "react";
import { Stage, Layer, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { GridData } from "@/db/schema";

export const GRID_CELL_COLORS: Record<string, string> = {
  floor: "#3f3f46",
  wall: "#0b0b0c",
  door: "#a16207",
  water: "#1d4ed8",
  difficult: "#166534",
};

export default function GridBuilder({
  data,
  onCellPointer,
}: {
  data: GridData;
  onCellPointer: (index: number) => void;
}) {
  const [painting, setPainting] = useState(false);
  const { cols, rows, cellSize, cells } = data;

  function cellColor(index: number): string {
    const cell = cells[index];
    if (!cell) return "#18181b";
    return GRID_CELL_COLORS[cell.type] ?? "#3f3f46";
  }

  function handlePointer(index: number, e?: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (e) e.cancelBubble = true;
    onCellPointer(index);
  }

  return (
    <div className="overflow-auto rounded-lg border border-border bg-card p-2">
      <Stage
        width={cols * cellSize}
        height={rows * cellSize}
        onMouseDown={() => setPainting(true)}
        onMouseUp={() => setPainting(false)}
        onMouseLeave={() => setPainting(false)}
      >
        <Layer>
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((__, c) => {
              const index = r * cols + c;
              const cell = cells[index];
              return (
                <Rect
                  key={index}
                  x={c * cellSize}
                  y={r * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={cellColor(index)}
                  stroke="#27272a"
                  strokeWidth={1}
                  onMouseDown={(e) => handlePointer(index, e)}
                  onMouseEnter={() => painting && handlePointer(index)}
                  onTap={(e) => handlePointer(index, e)}
                />
              );
            }),
          )}
          {cells.map((cell, index) =>
            cell?.label ? (
              <Text
                key={`label-${index}`}
                x={(index % cols) * cellSize}
                y={(Math.floor(index / cols)) * cellSize + cellSize / 2 - 6}
                width={cellSize}
                align="center"
                text={cell.label}
                fontSize={Math.max(9, Math.min(12, cellSize / 4))}
                fill="#ffffff"
                listening={false}
              />
            ) : null,
          )}
        </Layer>
      </Stage>
    </div>
  );
}
