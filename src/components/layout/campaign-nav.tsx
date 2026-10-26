"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Swords,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  Check,
  Menu,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BuiltByBadge } from "@/components/shared/built-by-badge";
import { openCommandPalette } from "@/components/search/command-palette";
import { useT } from "@/components/i18n/i18n-provider";
import type { TranslationKey } from "@/lib/i18n";
import { CAMPAIGN_NAV, NAV_GROUPS, navItemsInGroup, type NavGroupId, type NavItem } from "@/lib/nav";
import { useNavPreferences } from "@/components/layout/nav-preferences";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/db/schema";

/**
 * The campaign index is the only entry with no segment; it pins to the top.
 * Every other ungrouped entry (Settings) pins to the bottom.
 */
const PINNED_TOP = CAMPAIGN_NAV.filter((i) => i.group === null && i.segment === null);
const PINNED_BOTTOM = CAMPAIGN_NAV.filter((i) => i.group === null && i.segment !== null);

/** Shows ⌘K on macOS, Ctrl K elsewhere; renders a neutral placeholder on the
 *  server so hydration is stable. */
function useShortcutLabel() {
  return useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘K" : "Ctrl K"),
    () => "",
  );
}

/** The platform never changes while the page is open. */
function noopSubscribe() {
  return () => {};
}

/** Visible affordance for the global search palette (opened via ⌘K/Ctrl+K). */
function SearchTrigger({ onNavigate }: { onNavigate?: () => void }) {
  const shortcut = useShortcutLabel();
  const t = useT();
  return (
    <button
      onClick={() => {
        onNavigate?.();
        openCommandPalette();
      }}
      className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1">{t("nav.search")}</span>
      {shortcut ? (
        <kbd className="rounded border border-sidebar-border bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {shortcut}
        </kbd>
      ) : null}
    </button>
  );
}

type Props = {
  campaign: Campaign;
  campaigns: Pick<Campaign, "id" | "name" | "setting">[];
};

function CampaignSwitcher({ campaign, campaigns }: Props) {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-left transition-colors hover:bg-sidebar-accent">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary">
            <Swords className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {campaign.name}
            </p>
            {campaign.setting ? (
              <p className="truncate text-xs text-muted-foreground">
                {campaign.setting}
              </p>
            ) : (
              <p className="truncate text-xs text-muted-foreground">Campaign</p>
            )}
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
      >
        <DropdownMenuLabel>Switch campaign</DropdownMenuLabel>
        {campaigns.map((c) => (
          <DropdownMenuItem key={c.id} asChild>
            <Link href={`/campaign/${c.id}`}>
              <span className="truncate">{c.name}</span>
              {c.id === campaign.id ? (
                <Check className="ml-auto size-4 text-primary" />
              ) : null}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">
            <Home className="size-4" />
            {t("nav.allCampaigns")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLinks({
  campaign,
  onNavigate,
  iconsOnly = false,
}: {
  campaign: Campaign;
  onNavigate?: () => void;
  /** Icon-only rail: groups flatten away and labels become tooltips. */
  iconsOnly?: boolean;
}) {
  const pathname = usePathname();
  const t = useT();
  const { preferences, toggleGroup } = useNavPreferences();
  // Groups the DM has toggled by hand this session. Until they do, arriving in
  // a collapsed group opens it; once they've clicked its header, their choice
  // is respected for as long as they stay on the page.
  const [touched, setTouched] = useState<NavGroupId[]>([]);
  const base = `/campaign/${campaign.id}`;

  function isActive(item: NavItem): boolean {
    const href = item.href(campaign.id);
    if (item.segment === null) return pathname === base;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  /** The group holding the current route, so it can be opened automatically. */
  const activeGroup =
    CAMPAIGN_NAV.find((item) => item.group !== null && isActive(item))?.group ?? null;

  function renderLink(item: NavItem) {
    const href = item.href(campaign.id);
    const active = isActive(item);
    const Icon = item.icon;
    const label = t(item.labelKey as TranslationKey);
    return (
      <Link
        key={item.labelKey}
        href={href}
        onClick={onNavigate}
        title={iconsOnly ? label : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg py-1.5 text-sm font-medium transition-colors",
          iconsOnly ? "justify-center px-2" : "px-3",
          active
            ? "bg-primary/15 text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
        )}
      >
        <Icon className="size-4.5 shrink-0" />
        {iconsOnly ? <span className="sr-only">{label}</span> : label}
      </Link>
    );
  }

  // The icon rail has no room for group headers, so everything renders flat.
  if (iconsOnly) {
    return (
      <nav className="flex flex-col gap-0.5">
        {CAMPAIGN_NAV.map(renderLink)}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5">
      {PINNED_TOP.map(renderLink)}

      {NAV_GROUPS.map((group) => {
        const items = navItemsInGroup(group.id);
        if (items.length === 0) return null;

        const collapsed = preferences.collapsedGroups.includes(group.id);
        const expanded = touched.includes(group.id)
          ? !collapsed
          : !collapsed || group.id === activeGroup;

        return (
          <div key={group.id} className="mt-2 first:mt-1">
            <button
              type="button"
              onClick={() => {
                toggleGroup(group.id);
                setTouched((prev) =>
                  prev.includes(group.id) ? prev : [...prev, group.id],
                );
              }}
              aria-expanded={expanded}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              {expanded ? (
                <ChevronDown className="size-3.5 shrink-0" />
              ) : (
                <ChevronRight className="size-3.5 shrink-0" />
              )}
              {t(group.labelKey as TranslationKey)}
            </button>

            {expanded ? (
              <div className="mt-0.5 flex flex-col gap-0.5">{items.map(renderLink)}</div>
            ) : null}
          </div>
        );
      })}

      <div className="mt-2 flex flex-col gap-0.5 border-t border-sidebar-border pt-2">
        {PINNED_BOTTOM.map(renderLink)}
      </div>
    </nav>
  );
}

/** Full sidebar content, reused by the desktop rail and the mobile sheet. */
export function CampaignNavContent({
  campaign,
  campaigns,
  onNavigate,
  iconsOnly = false,
}: Props & { onNavigate?: () => void; iconsOnly?: boolean }) {
  return (
    // `min-h-0` on the flex children is what lets the nav list scroll instead of
    // growing past the rail and pushing the badge off-screen on short windows.
    // The icon rail is only 56px wide, so it trims its padding to leave room.
    <div className={cn("flex h-full min-h-0 flex-col gap-3", iconsOnly ? "p-2" : "p-3")}>
      {iconsOnly ? null : (
        <>
          <CampaignSwitcher campaign={campaign} campaigns={campaigns} />
          <SearchTrigger onNavigate={onNavigate} />
        </>
      )}
      <ScrollArea className="-mx-1 min-h-0 flex-1 px-1">
        <NavLinks campaign={campaign} onNavigate={onNavigate} iconsOnly={iconsOnly} />
      </ScrollArea>
      {iconsOnly ? null : (
        <BuiltByBadge className="shrink-0 border-t border-sidebar-border pt-3" />
      )}
    </div>
  );
}

/** Desktop sidebar rail (always visible at md+). */
export function DesktopSidebar(props: Props) {
  const t = useT();
  const { preferences, toggleRail } = useNavPreferences();
  const collapsed = preferences.railCollapsed;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar md:block",
        collapsed ? "w-14" : "w-56 lg:w-64",
      )}
    >
      <div className="flex h-full min-h-0 flex-col">
        {collapsed ? (
          <div className="flex justify-center p-2">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => openCommandPalette()}
              title={t("nav.search")}
              aria-label={t("nav.search")}
            >
              <Search className="size-4" />
            </Button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1">
          <CampaignNavContent {...props} iconsOnly={collapsed} />
        </div>

        <div
          className={cn(
            "shrink-0 border-t border-sidebar-border p-2",
            collapsed ? "flex justify-center" : "flex justify-end",
          )}
        >
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={toggleRail}
            title={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
            aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}

/** Mobile top bar with a sheet-based drawer. */
export function MobileNavBar(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Campaign navigation</SheetTitle>
          <CampaignNavContent {...props} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <span className="truncate font-heading text-sm font-semibold">
        {props.campaign.name}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="ml-auto"
        aria-label="Search"
        onClick={() => openCommandPalette()}
      >
        <Search className="size-5" />
      </Button>
    </div>
  );
}
