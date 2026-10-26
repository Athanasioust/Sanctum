/**
 * A segmented progress clock drawn as SVG wedges. Used interactively on the
 * dashboard and read-only on the player view.
 */
export function ClockFace({
  segments,
  filled,
  color,
  size = 96,
  label,
  onSegmentClick,
}: {
  segments: number;
  filled: number;
  color: string;
  size?: number;
  /** Accessible description, e.g. "The ritual completes: 3 of 6". */
  label: string;
  onSegmentClick?: (index: number) => void;
}) {
  const n = Math.max(1, segments);
  const r = 46;
  const c = 50;
  const wedges = Array.from({ length: n }, (_, i) => {
    const a0 = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const a1 = -Math.PI / 2 + ((i + 1) / n) * Math.PI * 2;
    const x0 = c + r * Math.cos(a0);
    const y0 = c + r * Math.sin(a0);
    const x1 = c + r * Math.cos(a1);
    const y1 = c + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    // A single segment is a full circle, which an arc path can't draw.
    const d =
      n === 1
        ? `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - 0.01} ${c - r} Z`
        : `M ${c} ${c} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
    return { d, on: i < filled };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className="shrink-0"
    >
      <circle cx={c} cy={c} r={r + 2} fill="var(--muted)" />
      {wedges.map((w, i) => (
        <path
          key={i}
          d={w.d}
          fill={w.on ? color : "transparent"}
          fillOpacity={w.on ? 0.9 : 1}
          stroke="var(--card)"
          strokeWidth={2.5}
          onClick={onSegmentClick ? () => onSegmentClick(i) : undefined}
          className={onSegmentClick ? "cursor-pointer transition-opacity hover:opacity-80" : undefined}
        />
      ))}
      <circle cx={c} cy={c} r={r + 2} fill="none" stroke={color} strokeOpacity={0.6} strokeWidth={2} />
    </svg>
  );
}
