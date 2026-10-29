/**
 * Records an atlas marker can point at. Lives on its own (no imports) so the
 * schema and client components can both use it without dragging the DB
 * module into the browser bundle.
 */
export const ATLAS_LINK_TYPES = [
  "location",
  "npc",
  "quest",
  "shop",
  "faction",
  "handout",
  "rumor",
] as const;
export type AtlasLinkType = (typeof ATLAS_LINK_TYPES)[number];
