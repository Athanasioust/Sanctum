"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, User, Skull, MapPin, ListTodo, Sparkles, Image, MessageCircleQuestion, X, Dices } from "lucide-react";
import { rollDice } from "@/components/dice/dice-roller";
import { useT } from "@/components/i18n/i18n-provider";
import type { TranslationKey } from "@/lib/i18n";
import { formulaError } from "@/lib/dice";
import { ALL_DESTINATIONS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/app/api/search/route";

/** Pages shown as a jump-to list before anything has been typed. */
const PAGE_PREVIEW_COUNT = 8;

/** Dispatched by visible triggers (sidebar, mobile nav) to open the palette. */
export const OPEN_SEARCH_EVENT = "sanctum:open-search";

/** Programmatically open the command palette from anywhere. */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

const TYPE_ICONS: Record<SearchResult["type"], React.ElementType> = {
  character: User,
  npc: Skull,
  location: MapPin,
  quest: ListTodo,
  magic_item: Sparkles,
  handout: Image,
  rumor: MessageCircleQuestion,
};

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  character: "Character",
  npc: "NPC / Monster",
  location: "Location",
  quest: "Quest",
  magic_item: "Magic Item",
  handout: "Handout",
  rumor: "Rumor",
};

export function CommandPalette({ campaignId }: { campaignId: number }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [fetchedResults, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const t = useT();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(0);
  }, []);

  // Cmd+K / Ctrl+K to open — plus a custom event so visible triggers
  // (sidebar search button, mobile nav) can open the palette too.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Too short to search: `results` below is empty, no state to clear.
    if (!query || query.length < 2) return;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&campaignId=${campaignId}`,
        );
        if (res.ok) {
          const data: SearchResult[] = await res.json();
          setResults(data);
          setActiveIndex(0);
        }
      } finally {
        setLoading(false);
      }
    }, 220);
  }, [query, campaignId]);

  // Results only count for a query long enough to have searched.
  const results = query.length >= 2 ? fetchedResults : [];

  // A query that reads as dice notation ("2d6+3") becomes a roll option at the
  // top of the list. Requires an actual die term so plain numbers don't match.
  const trimmedQuery = query.trim();
  const diceFormula =
    /\d*d\d/i.test(trimmedQuery) && formulaError(trimmedQuery) === null
      ? trimmedQuery
      : null;
  const diceOffset = diceFormula ? 1 : 0;

  // Every page in the app, including the ones that are no longer sidebar
  // entries (Bestiary, Relations, Shops, Homebrew, Import) — this is what keeps
  // them reachable now that they live behind tabs or in Settings. Matched on
  // both the English name and the translated one so it works in any language.
  const pages = useMemo(() => {
    if (!trimmedQuery) return ALL_DESTINATIONS.slice(0, PAGE_PREVIEW_COUNT);
    const needle = trimmedQuery.toLowerCase();
    return ALL_DESTINATIONS.filter(
      (page) =>
        page.label.toLowerCase().includes(needle) ||
        t(page.labelKey as TranslationKey).toLowerCase().includes(needle),
    );
  }, [trimmedQuery, t]);

  const pageOffset = diceOffset;
  const resultOffset = diceOffset + pages.length;
  const optionCount = resultOffset + results.length;

  function navigate(result: SearchResult) {
    router.push(result.href);
    close();
  }

  function navigateTo(href: string) {
    router.push(href);
    close();
  }

  function roll(formula: string) {
    close();
    rollDice({ formula });
  }

  function onKeyDownInPalette(e: React.KeyboardEvent) {
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, optionCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (diceFormula && activeIndex === 0) {
        roll(diceFormula);
      } else if (activeIndex >= resultOffset) {
        const result = results[activeIndex - resultOffset];
        if (result) navigate(result);
      } else {
        const page = pages[activeIndex - pageOffset];
        if (page) navigateTo(page.href(campaignId));
      }
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl"
        onKeyDown={onKeyDownInPalette}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a page, or search your campaign…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground" aria-label="Clear search">
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline">
              Esc
            </kbd>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {diceFormula && (
            <button
              onClick={() => roll(diceFormula)}
              onMouseEnter={() => setActiveIndex(0)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                activeIndex === 0 ? "bg-primary/10 text-primary" : "hover:bg-muted",
              )}
            >
              <Dices className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">Roll {diceFormula}</p>
                <p className="text-xs text-muted-foreground">Open the dice roller</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">Dice</span>
            </button>
          )}
          {pages.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase text-muted-foreground">
                Pages
              </p>
              <ul>
                {pages.map((page, i) => {
                  const index = i + pageOffset;
                  const Icon = page.icon;
                  return (
                    <li key={page.labelKey}>
                      <button
                        onClick={() => navigateTo(page.href(campaignId))}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                          index === activeIndex ? "bg-primary/10 text-primary" : "hover:bg-muted",
                        )}
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {t(page.labelKey as TranslationKey)}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">Page</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {loading && (
            <p className="py-6 text-center text-sm text-muted-foreground">Searching…</p>
          )}
          {!loading && !diceFormula && pages.length === 0 && query.length >= 2 && results.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
          {!loading && results.length > 0 && (
            <ul>
              {results.map((result, i) => {
                const Icon = TYPE_ICONS[result.type];
                const index = i + resultOffset;
                return (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      onClick={() => navigate(result)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        index === activeIndex ? "bg-primary/10 text-primary" : "hover:bg-muted",
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{result.label}</p>
                        {result.sublabel && (
                          <p className="text-xs text-muted-foreground">{result.sublabel}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {TYPE_LABELS[result.type]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!query && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Keep typing to search characters, NPCs, locations and quests.
            </p>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground flex gap-4">
          <span><kbd className="mr-1 rounded border border-border bg-muted px-1">↑↓</kbd>navigate</span>
          <span><kbd className="mr-1 rounded border border-border bg-muted px-1">↵</kbd>open</span>
          <span><kbd className="mr-1 rounded border border-border bg-muted px-1">Esc</kbd>close</span>
        </div>
      </div>
    </div>
  );
}
