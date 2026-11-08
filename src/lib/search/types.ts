/**
 * Shared shape of a global-search hit. Lives outside the route so client
 * components can import the type without pulling in any server code.
 */

export const SEARCH_TYPES = [
  "character",
  "npc",
  "location",
  "map",
  "marker",
  "quest",
  "magic_item",
  "handout",
  "rumor",
  "shop",
  "shop_item",
  "faction",
  "note",
  "document",
  "session",
  "story_event",
  "calendar_event",
  "clock",
  "mind_map",
  "roll_table",
  "homebrew_spell",
  "homebrew_feat",
  "encounter",
  "battle_map",
] as const;

export type SearchType = (typeof SEARCH_TYPES)[number];

export type SearchResult = {
  id: number;
  type: SearchType;
  label: string;
  /** A short bit of record data (class, rarity, status…), shown under the label. */
  sublabel?: string;
  /** Text around the match when it was found in the body rather than the name. */
  snippet?: string;
  href: string;
};
