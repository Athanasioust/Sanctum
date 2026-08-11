import {
  LayoutDashboard,
  Swords,
  Grid3x3,
  Users,
  Skull,
  BookOpen,
  Map,
  ScrollText,
  Flag,
  Calendar,
  Coins,
  ClipboardList,
  StickyNote,
  Music,
  Settings,
  ListTodo,
  Sparkles,
  Image,
  MessageCircleQuestion,
  Network,
  Waypoints,
  FlaskConical,
  FileText,
  Upload,
  type LucideIcon,
} from "lucide-react";

/** Collapsible sections of the campaign sidebar, in the order they render. */
export type NavGroupId = "run" | "cast" | "world" | "story" | "resources";

export const NAV_GROUPS: { id: NavGroupId; label: string; labelKey: string }[] = [
  { id: "run", label: "Run", labelKey: "navGroup.run" },
  { id: "cast", label: "Cast", labelKey: "navGroup.cast" },
  { id: "world", label: "World", labelKey: "navGroup.world" },
  { id: "story", label: "Story", labelKey: "navGroup.story" },
  { id: "resources", label: "Resources", labelKey: "navGroup.resources" },
];

export type NavItem = {
  /** English label, and the fallback if a dictionary is missing the key. */
  label: string;
  /** Key into the i18n dictionaries; see src/lib/i18n/dictionaries. */
  labelKey: string;
  href: (campaignId: number) => string;
  icon: LucideIcon;
  /** Match the active state on sub-routes too. */
  segment: string | null;
  /** Which collapsible group this sits in; null pins it outside the groups. */
  group: NavGroupId | null;
};

/**
 * The sidebar.
 *
 * Dashboard and Settings are pinned (`group: null`) at the top and bottom;
 * everything else lives in a collapsible group. A handful of pages are
 * deliberately *not* here — Bestiary, Relations and Shops & Loot are tabs of
 * other pages, and Homebrew and Import are reached from context. They are all
 * still routes, and all still listed in `ALL_DESTINATIONS` below so the command
 * palette can find them.
 */
export const CAMPAIGN_NAV: NavItem[] = [
  {
    label: "Dashboard",
    labelKey: "nav.dashboard",
    href: (id) => `/campaign/${id}`,
    icon: LayoutDashboard,
    segment: null,
    group: null,
  },

  // Run — what's open while the game is actually being played.
  {
    label: "Combat",
    labelKey: "nav.combat",
    href: (id) => `/campaign/${id}/combat`,
    icon: Swords,
    segment: "combat",
    group: "run",
  },
  {
    label: "Battle Map",
    labelKey: "nav.battleMap",
    href: (id) => `/campaign/${id}/battle-map`,
    icon: Grid3x3,
    segment: "battle-map",
    group: "run",
  },
  {
    label: "Soundpad",
    labelKey: "nav.soundpad",
    href: (id) => `/campaign/${id}/soundpad`,
    icon: Music,
    segment: "soundpad",
    group: "run",
  },

  // Cast — the people and creatures.
  {
    label: "Characters",
    labelKey: "nav.characters",
    href: (id) => `/campaign/${id}/characters`,
    icon: Users,
    segment: "characters",
    group: "cast",
  },
  {
    label: "NPCs & Monsters",
    labelKey: "nav.npcs",
    href: (id) => `/campaign/${id}/npcs`,
    icon: Skull,
    segment: "npcs",
    group: "cast",
  },

  // World — where the campaign happens.
  {
    label: "World",
    labelKey: "nav.world",
    href: (id) => `/campaign/${id}/world`,
    icon: Map,
    segment: "world",
    group: "world",
  },
  {
    label: "Factions",
    labelKey: "nav.factions",
    href: (id) => `/campaign/${id}/factions`,
    icon: Flag,
    segment: "factions",
    group: "world",
  },
  {
    label: "Calendar",
    labelKey: "nav.calendar",
    href: (id) => `/campaign/${id}/calendar`,
    icon: Calendar,
    segment: "calendar",
    group: "world",
  },

  // Story — the plot and how it's prepped.
  {
    label: "Story",
    labelKey: "nav.story",
    href: (id) => `/campaign/${id}/story`,
    icon: ScrollText,
    segment: "story",
    group: "story",
  },
  {
    label: "Sessions",
    labelKey: "nav.sessions",
    href: (id) => `/campaign/${id}/sessions`,
    icon: ClipboardList,
    segment: "sessions",
    group: "story",
  },
  {
    label: "Quests",
    labelKey: "nav.quests",
    href: (id) => `/campaign/${id}/quests`,
    icon: ListTodo,
    segment: "quests",
    group: "story",
  },
  {
    label: "Rumors",
    labelKey: "nav.rumors",
    href: (id) => `/campaign/${id}/rumors`,
    icon: MessageCircleQuestion,
    segment: "rumors",
    group: "story",
  },
  {
    label: "Mind Map",
    labelKey: "nav.mindMap",
    href: (id) => `/campaign/${id}/mind-map`,
    icon: Waypoints,
    segment: "mind-map",
    group: "story",
  },

  // Resources — the reference material.
  {
    label: "Magic Items",
    labelKey: "nav.magicItems",
    href: (id) => `/campaign/${id}/magic-items`,
    icon: Sparkles,
    segment: "magic-items",
    group: "resources",
  },
  {
    label: "Handouts",
    labelKey: "nav.handouts",
    href: (id) => `/campaign/${id}/handouts`,
    icon: Image,
    segment: "handouts",
    group: "resources",
  },
  {
    label: "Documents",
    labelKey: "nav.documents",
    href: (id) => `/campaign/${id}/documents`,
    icon: FileText,
    segment: "documents",
    group: "resources",
  },
  {
    label: "Notes",
    labelKey: "nav.notes",
    href: (id) => `/campaign/${id}/notes`,
    icon: StickyNote,
    segment: "notes",
    group: "resources",
  },

  {
    label: "Settings",
    labelKey: "nav.settings",
    href: (id) => `/campaign/${id}/settings`,
    icon: Settings,
    segment: "settings",
    group: null,
  },
];

/**
 * Pages that exist but aren't sidebar entries: three that became tabs of
 * another page, and two utilities reached from context. They keep their own
 * routes (the old ones redirect to the tabbed URLs), and listing them here is
 * what keeps them findable from the command palette and the dashboard.
 */
export const OFF_SIDEBAR_NAV: NavItem[] = [
  {
    label: "Bestiary",
    labelKey: "nav.bestiary",
    href: (id) => `/campaign/${id}/npcs?tab=bestiary`,
    icon: BookOpen,
    segment: "npcs",
    group: "cast",
  },
  {
    label: "Relations",
    labelKey: "nav.relations",
    href: (id) => `/campaign/${id}/npcs?tab=relations`,
    icon: Network,
    segment: "npcs",
    group: "cast",
  },
  {
    label: "Shops & Loot",
    labelKey: "nav.shops",
    href: (id) => `/campaign/${id}/magic-items?tab=shops`,
    icon: Coins,
    segment: "magic-items",
    group: "resources",
  },
  {
    label: "Homebrew",
    labelKey: "nav.homebrew",
    href: (id) => `/campaign/${id}/homebrew`,
    icon: FlaskConical,
    segment: "homebrew",
    group: "resources",
  },
  {
    label: "Import",
    labelKey: "nav.import",
    href: (id) => `/campaign/${id}/import`,
    icon: Upload,
    segment: "import",
    group: null,
  },
];

/** Everything navigable, sidebar or not — the command palette's page index. */
export const ALL_DESTINATIONS: NavItem[] = [...CAMPAIGN_NAV, ...OFF_SIDEBAR_NAV];

/** The sidebar items belonging to a group, in declaration order. */
export function navItemsInGroup(group: NavGroupId): NavItem[] {
  return CAMPAIGN_NAV.filter((item) => item.group === group);
}
