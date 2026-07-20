import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** A quiet informational banner used to explain a page's purpose or workflow. */
export function InfoCallout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
      <p className="min-w-0">{children}</p>
    </div>
  );
}
