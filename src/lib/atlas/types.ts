/**
 * What the player view is given for the atlas. Built only on the server
 * (`loadPlayerAtlas`) from revealed maps, and carries nothing the players
 * aren't meant to see: no DM notes, no record links, no hidden or fogged
 * markers, and — while fog is on — only the image with the fog burned in.
 */
export type PlayerAtlasMarker = {
  id: number;
  x: number;
  y: number;
  title: string;
  /** Markdown, rendered by the client with the safe renderer. */
  description: string;
  icon: string;
  color: string;
  /** Set only when the target map is revealed too. */
  portalMapId: number | null;
};

export type PlayerAtlasMap = {
  id: number;
  name: string;
  /** Null while a fogged render is still being prepared by the DM's editor. */
  imageUrl: string | null;
  width: number;
  height: number;
  markers: PlayerAtlasMarker[];
  /** Revealed ancestors, root first, for the breadcrumb. */
  trail: { id: number; name: string }[];
};

export type PlayerAtlasState = {
  /** The map the DM is presenting (newest reveal), if any. */
  currentId: number | null;
  /** The map being shown — the current one, or one a player followed a portal to. */
  map: PlayerAtlasMap | null;
};

export const EMPTY_PLAYER_ATLAS: PlayerAtlasState = { currentId: null, map: null };
