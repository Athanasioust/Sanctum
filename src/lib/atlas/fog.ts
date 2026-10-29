import type { AtlasFogOp } from "@/db/schema";

/**
 * Exploration fog for atlas maps.
 *
 * With fog on, the whole map starts hidden and the DM's strokes are applied in
 * order — "reveal" uncovers what it touches, "hide" covers it again. The same
 * rule decides both what the DM's overlay shades and which markers the player
 * view is sent, so the two can never disagree.
 *
 * Coordinates are 0–1 fractions of the image. Distances are measured in pixel
 * space (`w`, `h` are the image size) so a brush stays round on a wide map.
 */

function distToSegmentSq(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  let t = len > 0 ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx - px;
  const cy = ay + t * dy - py;
  return cx * cx + cy * cy;
}

/** Does this stroke cover the point? */
export function fogOpCovers(op: AtlasFogOp, x: number, y: number, w: number, h: number): boolean {
  if (op.kind === "rect") {
    return x >= op.x && x <= op.x + op.w && y >= op.y && y <= op.y + op.h;
  }
  const r = op.radius * w;
  const rSq = r * r;
  const px = x * w;
  const py = y * h;
  const pts = op.points;
  if (pts.length === 1) {
    const dx = pts[0][0] * w - px;
    const dy = pts[0][1] * h - py;
    return dx * dx + dy * dy <= rSq;
  }
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    if (distToSegmentSq(px, py, ax * w, ay * h, bx * w, by * h) <= rSq) return true;
  }
  return false;
}

/** Is the point uncovered for the players? Always true when fog is off. */
export function fogPointVisible(
  fogEnabled: boolean,
  ops: AtlasFogOp[],
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  if (!fogEnabled) return true;
  // Without a measured size there is no way to place a stroke, so stay hidden.
  if (!w || !h) return false;
  let visible = false;
  for (const op of ops) {
    if (fogOpCovers(op, x, y, w, h)) visible = op.mode === "reveal";
  }
  return visible;
}

/** Apply one stroke to a fog canvas sized `cw`×`ch`. */
export function applyFogOp(
  ctx: CanvasRenderingContext2D,
  op: AtlasFogOp,
  cw: number,
  ch: number,
  color: string,
) {
  ctx.save();
  ctx.globalCompositeOperation = op.mode === "reveal" ? "destination-out" : "source-over";
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (op.kind === "rect") {
    ctx.fillRect(op.x * cw, op.y * ch, op.w * cw, op.h * ch);
  } else if (op.points.length === 1) {
    ctx.beginPath();
    ctx.arc(op.points[0][0] * cw, op.points[0][1] * ch, op.radius * cw, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.lineWidth = op.radius * cw * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(op.points[0][0] * cw, op.points[0][1] * ch);
    for (let i = 1; i < op.points.length; i++) {
      ctx.lineTo(op.points[i][0] * cw, op.points[i][1] * ch);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Paint the fog onto a 2D canvas sized `cw`×`ch` (any scale of the image):
 * opaque `color` where hidden, transparent where revealed. Used for the DM's
 * overlay and for burning the fog into the player image.
 */
export function paintFog(
  ctx: CanvasRenderingContext2D,
  ops: AtlasFogOp[],
  cw: number,
  ch: number,
  color: string,
) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, cw, ch);
  ctx.restore();
  for (const op of ops) applyFogOp(ctx, op, cw, ch, color);
}

/**
 * A fingerprint of everything a fogged render depends on. The editor sends it
 * with each render and the server refuses a render whose fog has since moved
 * on. Compute it from a row the server returned, so both sides stringify the
 * same stored JSON.
 */
export function atlasFogKey(map: { imageUrl: string | null; fog: unknown; fogEnabled: boolean }) {
  const s = JSON.stringify([map.imageUrl, map.fogEnabled, map.fog]);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36) + ":" + s.length;
}
