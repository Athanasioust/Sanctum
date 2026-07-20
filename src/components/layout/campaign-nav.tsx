"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Swords,
  ChevronsUpDown,
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
import { CAMPAIGN_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/db/schema";

/** Shows ⌘K on macOS, Ctrl K elsewhere; renders a neutral placeholder on the
 *  server so hydration is stable. */
function useShortcutLabel() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    setLabel(isMac ? "⌘K" : "Ctrl K");
  }, []);
  return label;
}

/** Visible affordance for the global search palette (opened via ⌘K/Ctrl+K). */
function SearchTrigger({ onNavigate }: { onNavigate?: () => void }) {
  const shortcut = useShortcutLabel();
  return (
    <button
      onClick={() => {
        onNavigate?.();
        openCommandPalette();
      }}
      className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1">Search…</span>
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
            All campaigns
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLinks({
  campaign,
  onNavigate,
}: {
  campaign: Campaign;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const base = `/campaign/${campaign.id}`;

  return (
    <nav className="flex flex-col gap-0.5">
      {CAMPAIGN_NAV.map((item) => {
        const href = item.href(campaign.id);
        const active =
          item.segment === null
            ? pathname === base
            : pathname === href || pathname.startsWith(`${href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4.5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Full sidebar content, reused by the desktop rail and the mobile sheet. */
export function CampaignNavContent({
  campaign,
  campaigns,
  onNavigate,
}: Props & { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <CampaignSwitcher campaign={campaign} campaigns={campaigns} />
      <SearchTrigger onNavigate={onNavigate} />
      <ScrollArea className="-mx-1 flex-1 px-1">
        <NavLinks campaign={campaign} onNavigate={onNavigate} />
      </ScrollArea>
      <BuiltByBadge className="border-t border-sidebar-border pt-3" />
    </div>
  );
}

/** Desktop sidebar rail (always visible at md+). */
export function DesktopSidebar(props: Props) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
      <CampaignNavContent {...props} />
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
