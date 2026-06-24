import { Swords } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small attribution tag shown in the sidebar and on the home screen. */
export function BuiltByBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <Swords className="size-3.5 text-primary" />
      <span>
        Built by{" "}
        <span className="font-heading font-medium text-foreground">
          athanasioust
        </span>
      </span>
    </div>
  );
}
