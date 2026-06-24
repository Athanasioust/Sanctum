"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

/**
 * A responsive grid of checkboxes for selecting many values from a fixed list.
 * Used for skills, saving throws, languages, damage resistances, etc.
 */
export function CheckboxGroup({
  options,
  value,
  onChange,
  columns = 2,
  className,
}: {
  options: (Option | string)[];
  value: string[];
  onChange: (next: string[]) => void;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const normalized: Option[] = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );

  function toggle(v: string, checked: boolean) {
    if (checked) onChange([...new Set([...value, v])]);
    else onChange(value.filter((x) => x !== v));
  }

  return (
    <div
      className={cn(
        "grid gap-1.5",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
        className,
      )}
    >
      {normalized.map((opt) => {
        const checked = value.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm transition-colors",
              checked ? "border-primary/50 bg-primary/10" : "hover:bg-muted",
            )}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(c) => toggle(opt.value, c === true)}
            />
            <span className="select-none">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}
