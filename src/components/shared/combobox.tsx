"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ComboboxOption = { value: string; group?: string };

type Row =
  | { kind: "clear" }
  | { kind: "option"; option: ComboboxOption }
  | { kind: "custom" };

/**
 * A filterable single-value picker that still accepts anything you type, for
 * fields that have a well-known list (5e classes, races, backgrounds…) but must
 * never lock out homebrew. Built on Popover rather than a `<select>` so the
 * list can be searched and grouped.
 */
export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search or type your own…",
  emptyLabel = "No matches",
  allowCustom = true,
  disabled,
  id,
  className,
}: {
  value: string;
  onValueChange: (next: string) => void;
  options: (ComboboxOption | string)[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  allowCustom?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalized: ComboboxOption[] = useMemo(
    () => options.map((o) => (typeof o === "string" ? { value: o } : o)),
    [options],
  );

  // A stored value the catalog doesn't know about (homebrew, or an option from
  // a book this campaign no longer ticks) is pinned to the top so editing an
  // existing character can never silently drop it.
  const withCurrent: ComboboxOption[] = useMemo(() => {
    const current = value?.trim();
    if (!current) return normalized;
    if (normalized.some((o) => o.value === current)) return normalized;
    return [{ value: current, group: "Current" }, ...normalized];
  }, [normalized, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return withCurrent;
    return withCurrent.filter((o) => o.value.toLowerCase().includes(q));
  }, [withCurrent, query]);

  const typed = query.trim();
  const showCustom =
    allowCustom &&
    typed.length > 0 &&
    !withCurrent.some((o) => o.value.toLowerCase() === typed.toLowerCase());

  // Rows in visual order: clear, matches, then the "use what I typed" escape.
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    if (!typed) out.push({ kind: "clear" });
    for (const option of filtered) out.push({ kind: "option", option });
    if (showCustom) out.push({ kind: "custom" });
    return out;
  }, [filtered, showCustom, typed]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    setQuery("");
    setActive(0);
  }

  function handleQueryChange(next: string) {
    setQuery(next);
    setActive(0);
  }

  // Keep the highlighted row visible while arrowing through a long list.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function commit(next: string) {
    onValueChange(next);
    // Close via the same path as a dismiss so the filter is cleared for the
    // next open rather than reappearing with the last search still in it.
    handleOpenChange(false);
  }

  function choose(index: number) {
    const row = rows[index];
    if (!row) return;
    if (row.kind === "clear") commit("");
    else if (row.kind === "custom") commit(typed);
    else commit(row.option.value);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (rows.length ? (i + 1) % rows.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rows.length) choose(active);
      else if (allowCustom && typed) commit(typed);
    } else if (e.key === "Escape") {
      handleOpenChange(false);
    }
  }

  let lastGroup: string | undefined;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-left text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50",
            className,
          )}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronDown className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-56 gap-2 p-1.5"
        onOpenAutoFocus={(e) => {
          // Focus the filter, not the first row, so typing starts searching.
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
        <div ref={listRef} className="max-h-64 overflow-y-auto">
          {rows.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              {emptyLabel}
            </p>
          ) : null}
          {rows.map((row, i) => {
            const highlighted = i === active;
            const base =
              "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm";

            if (row.kind === "clear") {
              return (
                <button
                  key="__clear"
                  type="button"
                  data-row={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={cn(base, "text-muted-foreground", highlighted && "bg-muted")}
                >
                  —
                </button>
              );
            }

            if (row.kind === "custom") {
              return (
                <button
                  key="__custom"
                  type="button"
                  data-row={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={cn(base, highlighted && "bg-muted")}
                >
                  <span className="truncate">
                    Use <span className="font-medium">{typed}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">custom</span>
                </button>
              );
            }

            const { option } = row;
            const showHeader = option.group && option.group !== lastGroup;
            lastGroup = option.group;
            return (
              <div key={`${option.group ?? ""}-${option.value}`}>
                {showHeader ? (
                  <p className="px-2 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {option.group}
                  </p>
                ) : null}
                <button
                  type="button"
                  data-row={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={cn(base, highlighted && "bg-muted")}
                >
                  <span className="truncate">{option.value}</span>
                  {option.value === value ? (
                    <Check className="size-4 shrink-0 text-primary" />
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
