import { hpBarColor } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function HpBar({
  current,
  max,
  temp = 0,
  className,
  showText = true,
}: {
  current: number;
  max: number;
  temp?: number;
  className?: string;
  showText?: boolean;
}) {
  const fraction = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  return (
    <div className={cn("space-y-1", className)}>
      {showText ? (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">HP</span>
          <span className="font-medium tabular-nums">
            {current}
            <span className="text-muted-foreground">/{max}</span>
            {temp > 0 ? <span className="text-blue-400"> +{temp}</span> : null}
          </span>
        </div>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", hpBarColor(fraction))}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
