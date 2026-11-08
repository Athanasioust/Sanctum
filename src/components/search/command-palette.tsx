"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookMarked,
  CalendarDays,
  Dices,
  Eye,
  FileText,
  Flag,
  Grid3x3,
  Hourglass,
  Image,
  ListTodo,
  Map as MapIcon,
  MapPin,
  MessageCircleQuestion,
  Monitor,
  Network,
  Package,
  Plus,
  ScrollText,
  Search,
  Settings,
  Skull,
  Sparkles,
  StickyNote,
  Store,
  Swords,
  Table2,
  User,
  ClipboardList,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { OPEN_DICE_EVENT, rollDice } from "@/components/dice/dice-roller";
import { useT } from "@/components/i18n/i18n-provider";
import type { TranslationKey } from "@/lib/i18n";
import { api } from "@/lib/client";
import { formulaError } from "@/lib/dice";
import { ALL_DESTINATIONS } from "@/lib/nav";
import { GENERATORS } from "@/lib/generators/registry";
import { cn } from "@/lib/utils";
import type { SearchResult, SearchType } from "@/lib/search/types";

/** Pages shown as a jump-to list before anything has been typed. */
const PAGE_PREVIEW_COUNT = 6;
/** Quick actions shown before anything has been typed. */
const ACTION_PREVIEW_COUNT = 5;

/** Dispatched by visible triggers (sidebar, mobile nav) to open the palette. */
export const OPEN_SEARCH_EVENT = "sanctum:open-search";

/** Programmatically open the command palette from anywhere. */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

const TYPE_ICONS: Record<SearchType, React.ElementType> = {
  character: User,
  npc: Skull,
  location: MapPin,
  map: MapIcon,
  marker: MapPin,
  quest: ListTodo,
  magic_item: Sparkles,
  handout: Image,
  rumor: MessageCircleQuestion,
  shop: Store,
  shop_item: Package,
  faction: Flag,
  note: StickyNote,
  document: FileText,
  session: ClipboardList,
  story_event: ScrollText,
  calendar_event: CalendarDays,
  clock: Hourglass,
  mind_map: Network,
  roll_table: Table2,
  homebrew_spell: Zap,
  homebrew_feat: BookMarked,
  encounter: Swords,
  battle_map: Grid3x3,
};

/** Records that can be revealed to players straight from a search result. */
const REVEALABLE: Partial<Record<SearchType, { url: (id: number) => string; body: object }>> = {
  handout: { url: (id) => `/api/handouts/${id}`, body: { isRevealed: true } },
  clock: { url: (id) => `/api/clocks/${id}`, body: { revealToPlayers: true } },
};

type Action = {
  id: string;
  labelKey: TranslationKey;
  /** Extra words to match on (English), beyond the label in both languages. */
  keywords: string;
  icon: React.ElementType;
  /** A label template with a `{name}` slot the label fills ("Generate {name}"). */
  templateKey?: TranslationKey;
  run: (ctx: { campaignId: number; go: (href: string) => void }) => void;
};

const base = (id: number) => `/campaign/${id}`;

const ACTIONS: Action[] = [
  { id: "new-npc", labelKey: "palette.action.newNpc", keywords: "new create add npc person", icon: Plus, run: ({ campaignId, go }) => go(`${base(campaignId)}/npcs/new`) },
  { id: "new-character", labelKey: "palette.action.newCharacter", keywords: "new create add character pc player", icon: Plus, run: ({ campaignId, go }) => go(`${base(campaignId)}/characters/new`) },
  { id: "new-quest", labelKey: "palette.action.newQuest", keywords: "new create add quest", icon: Plus, run: ({ campaignId, go }) => go(`${base(campaignId)}/quests?new=1`) },
  { id: "new-rumor", labelKey: "palette.action.newRumor", keywords: "new create add rumor rumour", icon: Plus, run: ({ campaignId, go }) => go(`${base(campaignId)}/rumors?new=1`) },
  { id: "new-note", labelKey: "palette.action.newNote", keywords: "new create add note", icon: Plus, run: ({ campaignId, go }) => go(`${base(campaignId)}/notes?new=1`) },
  { id: "new-handout", labelKey: "palette.action.newHandout", keywords: "new create add handout", icon: Plus, run: ({ campaignId, go }) => go(`${base(campaignId)}/handouts?new=1`) },
  { id: "new-faction", labelKey: "palette.action.newFaction", keywords: "new create add faction", icon: Plus, run: ({ campaignId, go }) => go(`${base(campaignId)}/factions?new=1`) },
  { id: "new-item", labelKey: "palette.action.newMagicItem", keywords: "new create add magic item", icon: Plus, run: ({ campaignId, go }) => go(`${base(campaignId)}/magic-items?new=1`) },
  { id: "new-event", labelKey: "palette.action.newStoryEvent", keywords: "new create add story event timeline", icon: Plus, run: ({ campaignId, go }) => go(`${base(campaignId)}/story?new=1`) },
  { id: "roll-d20", labelKey: "palette.action.rollD20", keywords: "roll dice d20 check", icon: Dices, run: () => rollDice({ formula: "1d20" }) },
  { id: "open-dice", labelKey: "palette.action.openDice", keywords: "dice roller roll", icon: Dices, run: () => window.dispatchEvent(new Event(OPEN_DICE_EVENT)) },
  { id: "player-view", labelKey: "palette.action.openPlayerView", keywords: "player view screen tv share reveal", icon: Monitor, run: ({ campaignId }) => window.open(`/screen/${campaignId}`, "_blank", "noopener,noreferrer") },
  { id: "reveal-handout", labelKey: "palette.action.revealHandout", keywords: "reveal show players handout", icon: Eye, run: ({ campaignId, go }) => go(`${base(campaignId)}/handouts`) },
  { id: "show-map", labelKey: "palette.action.showBattleMap", keywords: "reveal show players battle map", icon: Grid3x3, run: ({ campaignId, go }) => go(`${base(campaignId)}/battle-map`) },
  { id: "settings", labelKey: "palette.action.openSettings", keywords: "settings preferences options language", icon: Settings, run: ({ campaignId, go }) => go(`${base(campaignId)}/settings`) },
  ...GENERATORS.map<Action>((g) => ({
    id: `gen-${g.id}`,
    labelKey: g.nameKey,
    templateKey: "gen.generateLabel",
    keywords: `generate generator random ${g.id}`,
    icon: g.icon,
    run: ({ campaignId, go }) => go(`${base(campaignId)}/generators?g=${g.id}`),
  })),
];

type Option =
  | { kind: "dice"; formula: string }
  | { kind: "action"; action: Action }
  | { kind: "page"; page: (typeof ALL_DESTINATIONS)[number] }
  | { kind: "result"; result: SearchResult };

export function CommandPalette({ campaignId }: { campaignId: number }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [fetchedResults, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
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
    if (!query || query.trim().length < 2) return;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&campaignId=${campaignId}`,
        );
        if (res.ok) {
          const data: SearchResult[] = await res.json();
          setResults(data);
          setActiveIndex(0);
        }
      } finally {
        setLoading(false);
      }
    }, 180);
  }, [query, campaignId]);

  const trimmedQuery = query.trim();
  // Results only count for a query long enough to have searched.
  const results = useMemo(
    () => (trimmedQuery.length >= 2 ? fetchedResults : []),
    [trimmedQuery, fetchedResults],
  );

  // A query that reads as dice notation ("2d6+3") becomes a roll option at the
  // top of the list. Requires an actual die term so plain numbers don't match.
  const diceFormula =
    /\d*d\d/i.test(trimmedQuery) && formulaError(trimmedQuery) === null
      ? trimmedQuery
      : null;

  const actionLabel = useCallback(
    (a: Action) => (a.templateKey ? t(a.templateKey).replace("{name}", t(a.labelKey)) : t(a.labelKey)),
    [t],
  );

  // Every word typed must appear in the action's label (either language) or keywords.
  const actions = useMemo(() => {
    if (!trimmedQuery) return ACTIONS.slice(0, ACTION_PREVIEW_COUNT);
    const words = trimmedQuery.toLowerCase().split(/\s+/);
    return ACTIONS.filter((a) => {
      const hay = `${actionLabel(a)} ${a.keywords}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [trimmedQuery, actionLabel]);

  // Every page in the app, including the ones that are no longer sidebar
  // entries (Bestiary, Relations, Shops, Homebrew, Import). Matched on both
  // the English name and the translated one so it works in any language.
  const pages = useMemo(() => {
    if (!trimmedQuery) return ALL_DESTINATIONS.slice(0, PAGE_PREVIEW_COUNT);
    const needle = trimmedQuery.toLowerCase();
    return ALL_DESTINATIONS.filter(
      (page) =>
        page.label.toLowerCase().includes(needle) ||
        t(page.labelKey as TranslationKey).toLowerCase().includes(needle),
    );
  }, [trimmedQuery, t]);

  const options: Option[] = useMemo(
    () => [
      ...(diceFormula ? [{ kind: "dice" as const, formula: diceFormula }] : []),
      ...results.map((result) => ({ kind: "result" as const, result })),
      ...actions.map((action) => ({ kind: "action" as const, action })),
      ...pages.map((page) => ({ kind: "page" as const, page })),
    ],
    [diceFormula, results, actions, pages],
  );

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-option-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const go = useCallback(
    (href: string) => {
      router.push(href);
      close();
    },
    [router, close],
  );

  function run(option: Option) {
    switch (option.kind) {
      case "dice":
        close();
        rollDice({ formula: option.formula });
        return;
      case "action":
        close();
        option.action.run({ campaignId, go });
        return;
      case "page":
        go(option.page.href(campaignId));
        return;
      case "result":
        go(option.result.href);
        return;
    }
  }

  async function reveal(result: SearchResult) {
    const how = REVEALABLE[result.type];
    if (!how) return;
    try {
      await api.patch(how.url(result.id), how.body);
      toast.success(t("palette.revealed"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("palette.revealFailed"));
    }
  }

  function onKeyDownInPalette(e: React.KeyboardEvent) {
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const option = options[activeIndex];
      if (!option) return;
      // Shift+Enter on a handout or clock reveals it to players.
      if (e.shiftKey && option.kind === "result" && REVEALABLE[option.result.type]) {
        e.preventDefault();
        void reveal(option.result);
        return;
      }
      run(option);
    }
  }

  if (!open) return null;

  const rowClass = (index: number) =>
    cn(
      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
      index === activeIndex ? "bg-primary/10 text-primary" : "hover:bg-muted",
    );

  const sectionTitle = (key: TranslationKey) => (
    <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase text-muted-foreground">{t(key)}</p>
  );

  // Indices are positions in `options`; each section knows where it starts.
  const resultStart = diceFormula ? 1 : 0;
  const actionStart = resultStart + results.length;
  const pageStart = actionStart + actions.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("palette.label")}
        className="relative z-10 mx-4 w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl"
        onKeyDown={onKeyDownInPalette}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder={t("palette.placeholder")}
            aria-label={t("palette.placeholder")}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground" aria-label={t("palette.clear")}>
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline">
              Esc
            </kbd>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {diceFormula && (
            <button
              data-option-index={0}
              onClick={() => run({ kind: "dice", formula: diceFormula })}
              onMouseEnter={() => setActiveIndex(0)}
              className={rowClass(0)}
            >
              <Dices className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t("palette.roll")} {diceFormula}</p>
                <p className="text-xs text-muted-foreground">{t("palette.rollHint")}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{t("palette.dice")}</span>
            </button>
          )}

          {loading && results.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("palette.searching")}</p>
          )}

          {results.length > 0 && (
            <>
              {sectionTitle("palette.sectionResults")}
              <ul>
                {results.map((result, i) => {
                  const Icon = TYPE_ICONS[result.type] ?? Search;
                  const index = resultStart + i;
                  const canReveal = Boolean(REVEALABLE[result.type]);
                  return (
                    <li key={`${result.type}-${result.id}`} className="group relative">
                      <button
                        data-option-index={index}
                        onClick={() => run({ kind: "result", result })}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={rowClass(index)}
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{result.label}</p>
                          {result.snippet ? (
                            <p className="line-clamp-2 text-xs text-muted-foreground">{result.snippet}</p>
                          ) : result.sublabel ? (
                            <p className="truncate text-xs capitalize text-muted-foreground">{result.sublabel}</p>
                          ) : null}
                        </div>
                        <span className={cn("shrink-0 text-xs text-muted-foreground", canReveal && "group-hover:invisible")}>
                          {t(`search.type.${result.type}` as TranslationKey)}
                        </span>
                      </button>
                      {canReveal ? (
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => reveal(result)}
                          title={t("palette.revealHint")}
                          className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted group-hover:flex"
                        >
                          <Eye className="size-3.5" /> {t("palette.reveal")}
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {!loading && !diceFormula && trimmedQuery.length >= 2 && results.length === 0 && actions.length === 0 && pages.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("palette.noResults").replace("{query}", trimmedQuery)}
            </p>
          )}

          {actions.length > 0 && (
            <>
              {sectionTitle("palette.sectionActions")}
              <ul>
                {actions.map((action, i) => {
                  const index = actionStart + i;
                  const Icon = action.icon;
                  return (
                    <li key={action.id}>
                      <button
                        data-option-index={index}
                        onClick={() => run({ kind: "action", action })}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={rowClass(index)}
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{actionLabel(action)}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {action.templateKey ? t("palette.generator") : t("palette.action")}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {pages.length > 0 && (
            <>
              {sectionTitle("palette.sectionPages")}
              <ul>
                {pages.map((page, i) => {
                  const index = pageStart + i;
                  const Icon = page.icon;
                  return (
                    <li key={page.labelKey}>
                      <button
                        data-option-index={index}
                        onClick={() => run({ kind: "page", page })}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={rowClass(index)}
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {t(page.labelKey as TranslationKey)}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{t("palette.page")}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {!query && (
            <p className="px-3 py-2 text-xs text-muted-foreground">{t("palette.hint")}</p>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span><kbd className="mr-1 rounded border border-border bg-muted px-1">↑↓</kbd>{t("palette.navigate")}</span>
          <span><kbd className="mr-1 rounded border border-border bg-muted px-1">↵</kbd>{t("palette.open")}</span>
          <span><kbd className="mr-1 rounded border border-border bg-muted px-1">⇧↵</kbd>{t("palette.revealKey")}</span>
          <span><kbd className="mr-1 rounded border border-border bg-muted px-1">Esc</kbd>{t("palette.close")}</span>
        </div>
      </div>
    </div>
  );
}
