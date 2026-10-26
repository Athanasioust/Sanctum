/**
 * Grid geometry for the battle map: distance in 5e's two diagonal rules, and
 * the polygon shapes for area-of-effect templates.
 *
 * Everything here works in *cell* coordinates and converts to feet through
 * `feetPerCell`, so the maths is independent of how big a cell is drawn.
 */

import type { BattleToken, FogData, MapAnnotation } from "@/db/schema";
import { portraitKey } from "@/lib/portrait-key";

export type DiagonalRule = "5-10-5" | "5-5-5";

export type Point = { x: number; y: number };

/**
 * Distance in cells between two grid points.
 *
 * `5-5-5` is the PHB default where a diagonal costs the same as a straight
 * step (Chebyshev distance). `5-10-5` is the DMG variant where every *second*
 * diagonal costs double — so four diagonal steps are 6 cells, i.e. 30 ft.
 */
export function gridDistanceCells(a: Point, b: Point, rule: DiagonalRule): number {
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  const diagonals = Math.min(dx, dy);
  const straights = Math.max(dx, dy) - diagonals;
  if (rule === "5-5-5") return diagonals + straights;
  // Every second diagonal costs two cells.
  return diagonals + Math.floor(diagonals / 2) + straights;
}

/** Distance in feet between two grid points. */
export function gridDistanceFeet(
  a: Point,
  b: Point,
  rule: DiagonalRule,
  feetPerCell: number,
): number {
  return gridDistanceCells(a, b, rule) * feetPerCell;
}

/** Snap a cell coordinate to the nearest whole cell, clamped to the grid. */
export function snapToGrid(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(value)));
}

/* -------------------------------------------------------------------------- */
/*  Area-of-effect templates                                                   */
/* -------------------------------------------------------------------------- */

/** The AoE shapes the DM can place, with the 5e sizes they usually come in. */
export const AOE_PRESETS: {
  kind: MapAnnotation["kind"];
  label: string;
  sizeFt: number;
  widthFt?: number;
}[] = [
  { kind: "circle", label: "Sphere / radius", sizeFt: 20 },
  { kind: "cone", label: "Cone", sizeFt: 15 },
  { kind: "line", label: "Line", sizeFt: 30, widthFt: 5 },
  { kind: "cube", label: "Cube / square", sizeFt: 15 },
];

const DEG = Math.PI / 180;

/**
 * Polygon points (in cells, flattened as [x1,y1,x2,y2,…]) for an AoE template
 * anchored at the origin. The caller positions it by drawing at the
 * annotation's x/y, so these are all relative to (0,0).
 *
 * A 5e cone is as wide at its end as it is long, so it is drawn as a triangle
 * with a flat far edge rather than a circular arc — an arc of radius L would
 * only be 0.89L across, which reads as a narrower cone than the rules describe.
 */
export function aoePoints(
  annotation: MapAnnotation,
  feetPerCell: number,
): number[] | null {
  const sizeCells = (annotation.sizeFt ?? 0) / feetPerCell;
  if (sizeCells <= 0) return null;
  const rotation = (annotation.rotation ?? 0) * DEG;

  switch (annotation.kind) {
    case "cone": {
      const half = sizeCells / 2;
      const corners: Point[] = [
        { x: 0, y: 0 },
        { x: sizeCells, y: -half },
        { x: sizeCells, y: half },
      ];
      return corners.flatMap((p) => {
        const x = p.x * Math.cos(rotation) - p.y * Math.sin(rotation);
        const y = p.x * Math.sin(rotation) + p.y * Math.cos(rotation);
        return [x, y];
      });
    }
    case "line": {
      const widthCells = (annotation.widthFt ?? 5) / feetPerCell;
      const half = widthCells / 2;
      // A rectangle from the origin, rotated about it.
      const corners: Point[] = [
        { x: 0, y: -half },
        { x: sizeCells, y: -half },
        { x: sizeCells, y: half },
        { x: 0, y: half },
      ];
      return corners.flatMap((p) => {
        const x = p.x * Math.cos(rotation) - p.y * Math.sin(rotation);
        const y = p.x * Math.sin(rotation) + p.y * Math.cos(rotation);
        return [x, y];
      });
    }
    case "cube": {
      // A cube's "size" is the length of one side, centred on the anchor.
      const half = sizeCells / 2;
      const corners: Point[] = [
        { x: -half, y: -half },
        { x: half, y: -half },
        { x: half, y: half },
        { x: -half, y: half },
      ];
      return corners.flatMap((p) => {
        const x = p.x * Math.cos(rotation) - p.y * Math.sin(rotation);
        const y = p.x * Math.sin(rotation) + p.y * Math.cos(rotation);
        return [x, y];
      });
    }
    default:
      return null;
  }
}

/** Radius in cells for a circular template (drawn as a Konva circle). */
export function aoeRadiusCells(annotation: MapAnnotation, feetPerCell: number): number {
  return (annotation.sizeFt ?? 0) / feetPerCell;
}

/* -------------------------------------------------------------------------- */
/*  Fog of war                                                                 */
/* -------------------------------------------------------------------------- */

/** A fully-hidden fog mask sized to the grid. */
export function createFog(cols: number, rows: number): FogData {
  return { cols, rows, revealed: Array(cols * rows).fill(false) };
}

/**
 * Fog matching the current grid. A fog mask from a differently-sized grid is
 * re-laid onto the new dimensions so a resize keeps what was already revealed
 * instead of throwing it away.
 */
export function fogForGrid(
  fog: FogData | null | undefined,
  cols: number,
  rows: number,
): FogData {
  if (!fog) return createFog(cols, rows);
  if (fog.cols === cols && fog.rows === rows) return fog;

  const next = createFog(cols, rows);
  for (let r = 0; r < Math.min(rows, fog.rows); r++) {
    for (let c = 0; c < Math.min(cols, fog.cols); c++) {
      next.revealed[r * cols + c] = fog.revealed[r * fog.cols + c] ?? false;
    }
  }
  return next;
}

/** Whether a cell is revealed. Out-of-bounds cells count as hidden. */
export function isRevealed(fog: FogData, col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= fog.cols || row >= fog.rows) return false;
  return fog.revealed[row * fog.cols + col] ?? false;
}

/**
 * Reveal (or re-hide) a square brush of cells centred on a cell. Returns a new
 * mask; the original is left alone so React state updates stay honest.
 */
export function paintFog(
  fog: FogData,
  col: number,
  row: number,
  brushCells: number,
  reveal: boolean,
): FogData {
  const revealed = [...fog.revealed];
  const radius = Math.floor(brushCells / 2);
  for (let r = row - radius; r <= row + radius; r++) {
    for (let c = col - radius; c <= col + radius; c++) {
      if (c < 0 || r < 0 || c >= fog.cols || r >= fog.rows) continue;
      revealed[r * fog.cols + c] = reveal;
    }
  }
  return { ...fog, revealed };
}

/** Reveal every cell — "show the whole map". */
export function revealAllFog(fog: FogData): FogData {
  return { ...fog, revealed: Array(fog.cols * fog.rows).fill(true) };
}

/**
 * The hidden area as a small set of rectangles (in cells), merging each row's
 * runs of hidden cells. A 100x100 map is 10,000 cells but usually only a few
 * dozen rectangles, which is the difference between a smooth canvas and a
 * stuttering one.
 */
export function fogRects(fog: FogData): { x: number; y: number; w: number; h: number }[] {
  const rects: { x: number; y: number; w: number; h: number }[] = [];
  for (let row = 0; row < fog.rows; row++) {
    let runStart = -1;
    // One extra step past the end closes a run that reaches the edge.
    for (let col = 0; col <= fog.cols; col++) {
      const hidden = col < fog.cols && !fog.revealed[row * fog.cols + col];
      if (hidden && runStart === -1) runStart = col;
      else if (!hidden && runStart !== -1) {
        rects.push({ x: runStart, y: row, w: col - runStart, h: 1 });
        runStart = -1;
      }
    }
  }
  return rects;
}

/**
 * Whether a token should be visible to players: not explicitly hidden, and
 * standing on a revealed cell when fog is on.
 */
export function tokenVisibleToPlayers(
  token: BattleToken,
  fog: FogData | null,
  fogEnabled: boolean,
): boolean {
  if (token.hidden) return false;
  if (!fogEnabled || !fog) return true;
  // A large token counts as visible if any cell it occupies is revealed.
  const size = Math.max(1, token.sizeCells);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isRevealed(fog, Math.round(token.x) + c, Math.round(token.y) + r)) return true;
    }
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/*  Token art                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The image each token is drawn with: its own uploaded art first, then the
 * portrait of the character or NPC its combatant came from. Tokens with
 * neither are left out and stay plain coloured discs.
 */
export function resolveTokenImages(
  tokens: BattleToken[],
  participants: { id: number; entityType: string | null; entityId: number | null }[],
  portraits: Record<string, string>,
): Record<string, string> {
  const byParticipant = new Map(participants.map((p) => [p.id, p]));
  const out: Record<string, string> = {};
  for (const token of tokens) {
    if (token.imageUrl) {
      out[token.id] = token.imageUrl;
      continue;
    }
    const participant =
      token.participantId !== undefined ? byParticipant.get(token.participantId) : undefined;
    const key = participant ? portraitKey(participant.entityType, participant.entityId) : null;
    if (key && portraits[key]) out[token.id] = portraits[key];
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  What a template covers                                                     */
/* -------------------------------------------------------------------------- */

const TEMPLATE_KINDS = new Set<MapAnnotation["kind"]>(["circle", "cone", "line", "cube"]);

export function isAoeTemplate(annotation: MapAnnotation): boolean {
  return TEMPLATE_KINDS.has(annotation.kind);
}

/** Ray-casting point-in-polygon over a flat [x1,y1,x2,y2,…] list. */
function pointInPolygon(x: number, y: number, flat: number[]): boolean {
  let inside = false;
  const n = flat.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = flat[i * 2];
    const yi = flat[i * 2 + 1];
    const xj = flat[j * 2];
    const yj = flat[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Ids of the tokens whose centre sits inside an AoE template. This is a
 * starting guess for "who's caught in the fireball" — the DM confirms or
 * changes it — so a token straddling the edge is judged by its centre alone.
 */
export function tokensInTemplate(
  annotation: MapAnnotation,
  tokens: BattleToken[],
  feetPerCell: number,
): string[] {
  if (!isAoeTemplate(annotation)) return [];
  const hits: string[] = [];
  const polygon = annotation.kind === "circle" ? null : aoePoints(annotation, feetPerCell);
  const radius = aoeRadiusCells(annotation, feetPerCell);
  for (const token of tokens) {
    const half = Math.max(1, token.sizeCells) / 2;
    // Relative to the template's anchor, which its geometry is built around.
    const cx = token.x + half - annotation.x;
    const cy = token.y + half - annotation.y;
    const inside = polygon
      ? pointInPolygon(cx, cy, polygon)
      : Math.hypot(cx, cy) <= radius + 1e-9;
    if (inside) hits.push(token.id);
  }
  return hits;
}
