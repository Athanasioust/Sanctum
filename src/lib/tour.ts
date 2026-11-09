import type { TranslationKey } from "@/lib/i18n";
import { atlasMapHref } from "@/lib/atlas/links";

/**
 * The guided highlights tour. Each stop names the page it lives on and a
 * stable `data-tour="…"` anchor on that page. Stops only point at things —
 * the overlay swallows every click, so the tour can never change data.
 */

/** What the tour needs to know about the sample campaign to build its routes. */
export type TourContext = {
  campaignId: number;
  characterId: number | null;
  atlasMapId: number | null;
};

export type TourStep = {
  id: string;
  /** Value of the `data-tour` attribute to spotlight. */
  anchor: string;
  /** The page to be on; null when the target's data is missing (stop is skipped). */
  path: (ctx: TourContext) => string | null;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "character",
    anchor: "character-sheet",
    path: (c) => (c.characterId ? `/campaign/${c.campaignId}/characters/${c.characterId}` : null),
    titleKey: "tour.character.title",
    bodyKey: "tour.character.body",
  },
  {
    id: "combat",
    anchor: "combat-tracker",
    path: (c) => `/campaign/${c.campaignId}/combat`,
    titleKey: "tour.combat.title",
    bodyKey: "tour.combat.body",
  },
  {
    id: "battle-map",
    anchor: "battle-map-reveal",
    path: (c) => `/campaign/${c.campaignId}/battle-map`,
    titleKey: "tour.battleMap.title",
    bodyKey: "tour.battleMap.body",
  },
  {
    id: "atlas",
    anchor: "atlas-map",
    path: (c) => (c.atlasMapId ? atlasMapHref(c.campaignId, c.atlasMapId) : null),
    titleKey: "tour.atlas.title",
    bodyKey: "tour.atlas.body",
  },
  {
    id: "generators",
    anchor: "generators",
    path: (c) => `/campaign/${c.campaignId}/generators`,
    titleKey: "tour.generators.title",
    bodyKey: "tour.generators.body",
  },
  {
    id: "search",
    anchor: "search",
    path: (c) => `/campaign/${c.campaignId}/generators`,
    titleKey: "tour.search.title",
    bodyKey: "tour.search.body",
  },
  {
    id: "done",
    anchor: "help",
    path: (c) => `/campaign/${c.campaignId}/generators`,
    titleKey: "tour.done.title",
    bodyKey: "tour.done.body",
  },
];

/** The pathname part of a route (atlas links may carry a query or hash). */
export function routePath(href: string): string {
  return href.split(/[?#]/)[0];
}

/** How long to wait for a stop's page and anchor before skipping it. */
export const TOUR_TARGET_TIMEOUT_MS = 8000;

/** The first visible element carrying this anchor (sidebars render it twice). */
export function findTourTarget(anchor: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${CSS.escape(anchor)}"]`);
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}
