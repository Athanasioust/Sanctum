import {
  LayoutDashboard,
  Swords,
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
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: (campaignId: number) => string;
  icon: LucideIcon;
  /** Match the active state on sub-routes too. */
  segment: string | null;
};

export const CAMPAIGN_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: (id) => `/campaign/${id}`,
    icon: LayoutDashboard,
    segment: null,
  },
  {
    label: "Combat",
    href: (id) => `/campaign/${id}/combat`,
    icon: Swords,
    segment: "combat",
  },
  {
    label: "Characters",
    href: (id) => `/campaign/${id}/characters`,
    icon: Users,
    segment: "characters",
  },
  {
    label: "NPCs & Monsters",
    href: (id) => `/campaign/${id}/npcs`,
    icon: Skull,
    segment: "npcs",
  },
  {
    label: "Bestiary",
    href: (id) => `/campaign/${id}/bestiary`,
    icon: BookOpen,
    segment: "bestiary",
  },
  {
    label: "World",
    href: (id) => `/campaign/${id}/world`,
    icon: Map,
    segment: "world",
  },
  {
    label: "Story",
    href: (id) => `/campaign/${id}/story`,
    icon: ScrollText,
    segment: "story",
  },
  {
    label: "Factions",
    href: (id) => `/campaign/${id}/factions`,
    icon: Flag,
    segment: "factions",
  },
  {
    label: "Calendar",
    href: (id) => `/campaign/${id}/calendar`,
    icon: Calendar,
    segment: "calendar",
  },
  {
    label: "Shops & Loot",
    href: (id) => `/campaign/${id}/shops`,
    icon: Coins,
    segment: "shops",
  },
  {
    label: "Sessions",
    href: (id) => `/campaign/${id}/sessions`,
    icon: ClipboardList,
    segment: "sessions",
  },
  {
    label: "Notes",
    href: (id) => `/campaign/${id}/notes`,
    icon: StickyNote,
    segment: "notes",
  },
  {
    label: "Settings",
    href: (id) => `/campaign/${id}/settings`,
    icon: Settings,
    segment: "settings",
  },
];
