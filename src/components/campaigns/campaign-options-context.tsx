"use client";

import { createContext, useContext } from "react";

export type CampaignOptions = {
  /** `SOURCE_BOOKS` keys (plus homebrew book names) this campaign plays with. */
  rulebooks: string[];
  /** Values already typed on this campaign's characters and NPCs. */
  used: {
    classes: string[];
    subclasses: string[];
    races: string[];
    backgrounds: string[];
  };
};

const EMPTY: CampaignOptions = {
  rulebooks: [],
  used: { classes: [], subclasses: [], races: [], backgrounds: [] },
};

const CampaignOptionsContext = createContext<CampaignOptions>(EMPTY);

/**
 * Supplied once by the campaign layout so every form under it can offer the
 * right 5e picker options without threading props through each page.
 */
export function CampaignOptionsProvider({
  value,
  children,
}: {
  value: CampaignOptions;
  children: React.ReactNode;
}) {
  return (
    <CampaignOptionsContext.Provider value={value}>
      {children}
    </CampaignOptionsContext.Provider>
  );
}

/** Falls back to "no rulebooks, no history" outside a campaign layout. */
export function useCampaignOptions(): CampaignOptions {
  return useContext(CampaignOptionsContext);
}
