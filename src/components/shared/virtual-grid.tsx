"use client";

import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

/** Columns per breakpoint, matching Tailwind's `sm` (640px) and `lg` (1024px). */
type Columns = { base: number; sm: number; lg: number };

const DEFAULT_COLUMNS: Columns = { base: 1, sm: 2, lg: 3 };

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function useColumns(cols: Columns): number {
  return useSyncExternalStore(
    subscribeResize,
    () => (window.innerWidth >= 1024 ? cols.lg : window.innerWidth >= 640 ? cols.sm : cols.base),
    () => cols.base,
  );
}

const GRID_CLASS: Record<string, string> = {
  "1-2-3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "1-2-4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * A card grid that only mounts the rows near the viewport once a list gets
 * long — a seeded Bestiary is 140+ stat-block cards, which otherwise all mount
 * (and re-render on every filter keystroke) at once. Short lists render as a
 * plain CSS grid, exactly as before.
 *
 * Rows are measured as they render, so cards of different heights are fine.
 * Filtering just changes `items`; the grid re-lays out from the top.
 */
export function VirtualGrid<T>({
  items,
  getKey,
  render,
  columns = DEFAULT_COLUMNS,
  gapClass = "gap-4",
  rowGapClass = "pb-4",
  estimateRowHeight = 190,
  threshold = 48,
}: {
  items: T[];
  getKey: (item: T) => string | number;
  render: (item: T) => React.ReactNode;
  columns?: Columns;
  /** Column gap, as a Tailwind class. */
  gapClass?: string;
  /** Space under each row — the row gap — as a padding class. */
  rowGapClass?: string;
  estimateRowHeight?: number;
  /** Lists at or below this length are not virtualized. */
  threshold?: number;
}) {
  const cols = useColumns(columns);
  const gridClass =
    GRID_CLASS[`${columns.base}-${columns.sm}-${columns.lg}`] ?? GRID_CLASS["1-2-3"];

  if (items.length <= threshold) {
    return (
      <div className={cn("grid", gridClass, gapClass)}>
        {items.map((item) => (
          <Fragment key={getKey(item)}>{render(item)}</Fragment>
        ))}
      </div>
    );
  }

  return (
    <WindowedRows
      items={items}
      getKey={getKey}
      render={render}
      cols={cols}
      gapClass={gapClass}
      rowGapClass={rowGapClass}
      estimateRowHeight={estimateRowHeight}
    />
  );
}

function WindowedRows<T>({
  items,
  getKey,
  render,
  cols,
  gapClass,
  rowGapClass,
  estimateRowHeight,
}: {
  items: T[];
  getKey: (item: T) => string | number;
  render: (item: T) => React.ReactNode;
  cols: number;
  gapClass: string;
  rowGapClass: string;
  estimateRowHeight: number;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  // Where the list starts on the page; the window virtualizer measures from
  // the top of the document. Re-read whenever the layout around it shifts.
  const [scrollMargin, setScrollMargin] = useState(0);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const measure = () => setScrollMargin(el.getBoundingClientRect().top + window.scrollY);
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const rowCount = Math.ceil(items.length / cols);
  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimateRowHeight,
    overscan: 4,
    scrollMargin,
  });

  return (
    <div ref={listRef} style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
      {virtualizer.getVirtualItems().map((row) => {
        const slice = items.slice(row.index * cols, row.index * cols + cols);
        return (
          <div
            key={row.key}
            data-index={row.index}
            ref={virtualizer.measureElement}
            className={cn("absolute left-0 top-0 grid w-full", gapClass, rowGapClass)}
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              transform: `translateY(${row.start - scrollMargin}px)`,
            }}
          >
            {slice.map((item) => (
              <Fragment key={getKey(item)}>{render(item)}</Fragment>
            ))}
          </div>
        );
      })}
    </div>
  );
}
