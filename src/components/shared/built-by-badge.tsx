import { Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { SupportLink } from "@/components/shared/support-link";

/**
 * Small attribution tag shown in the sidebar and on the home screen, with the
 * Ko-fi support link beneath it.
 */
export function BuiltByBadge({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Swords className="size-3.5 text-primary" />
        <span>
          Built by{" "}
          <span className="font-heading font-medium text-foreground">
            athanasioust
          </span>
        </span>
      </div>
      <SupportLink />
    </div>
  );
}
