"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, User, Skull, MapPin, ListTodo, Sparkles, Image, MessageCircleQuestion, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/app/api/search/route";

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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
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
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
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

  function navigate(result: SearchResult) {
    router.push(result.href);
    close();
  }

  function onKeyDownInPalette(e: React.KeyboardEvent) {
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      navigate(results[activeIndex]);
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
            placeholder="Search characters, NPCs, locations, quests…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
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
          {loading && (
            <p className="py-6 text-center text-sm text-muted-foreground">Searching…</p>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
          {!loading && results.length > 0 && (
            <ul>
              {results.map((result, i) => {
                const Icon = TYPE_ICONS[result.type];
                return (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      onClick={() => navigate(result)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        i === activeIndex ? "bg-primary/10 text-primary" : "hover:bg-muted",
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
            <p className="py-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search across your campaign.
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
