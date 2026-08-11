import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type TabLink = {
  /** Matched against the page's current `?tab=` value. */
  value: string;
  label: string;
  href: string;
  icon?: LucideIcon;
};

/**
 * A tab bar built from links rather than the Radix `Tabs` primitive.
 *
 * Pages that use this fetch their data on the server per tab, so the URL has to
 * be what selects the tab: that keeps deep links and the back button working,
 * and means only the visible tab's queries run. Styled to match `TabsList`'s
 * default variant so it reads the same as the client-side tabs elsewhere.
 */
export function TabLinks({
  tabs,
  active,
  className,
}: {
  tabs: TabLink[];
  active: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-9 w-fit max-w-full items-center justify-start gap-0.5 overflow-x-auto rounded-lg bg-muted p-[3px] text-muted-foreground",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.value === active;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.value}
            href={tab.href}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "inline-flex h-full items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-3 text-sm font-medium transition-all",
              selected
                ? "bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30"
                : "hover:text-foreground",
            )}
          >
            {Icon ? <Icon className="size-4 shrink-0" /> : null}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
