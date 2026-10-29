"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronRight, Map as MapIcon } from "lucide-react";
import { useT } from "@/components/i18n/i18n-provider";
import { atlasPopupHtml } from "@/lib/atlas/popup";
import type { PlayerAtlasState } from "@/lib/atlas/types";
import type { AtlasViewMarker } from "@/components/atlas/leaflet-atlas";

const LeafletAtlas = dynamic(() => import("@/components/atlas/leaflet-atlas"), { ssr: false });

/**
 * The revealed world map on the player view: pan, zoom and popups, nothing
 * editable. Everything here came from `/api/screen/atlas`, which has already
 * dropped whatever the players mustn't see.
 */
export function PlayerAtlas({
  atlas,
  following,
  onFollow,
}: {
  atlas: PlayerAtlasState;
  /** A player has walked through a portal away from the DM's map. */
  following: boolean;
  /** Show another revealed map (null = back to the one the DM is presenting). */
  onFollow: (mapId: number | null) => void;
}) {
  const t = useT();
  const map = atlas.map;
  // Older maps may not have been measured yet; the player can measure locally.
  const [measured, setMeasured] = useState<{ url: string; w: number; h: number } | null>(null);

  const markers: AtlasViewMarker[] = useMemo(
    () =>
      (map?.markers ?? []).map((m) => ({
        id: m.id,
        x: m.x,
        y: m.y,
        title: m.title,
        icon: m.icon,
        color: m.color,
        portalMapId: m.portalMapId,
        popupHtml: atlasPopupHtml({
          title: m.title,
          description: m.description,
          portal: m.portalMapId ? { id: m.portalMapId, label: t("atlas.enterMapShort") } : null,
        }),
      })),
    [map?.markers, t],
  );

  if (!map) return null;
  const w = map.width || (measured?.url === map.imageUrl ? measured.w : 0);
  const h = map.height || (measured?.url === map.imageUrl ? measured.h : 0);

  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <MapIcon className="size-4 text-muted-foreground" aria-hidden />
        <nav className="flex flex-wrap items-center gap-1 font-heading text-lg font-semibold" aria-label={t("atlas.breadcrumb")}>
          {map.trail.map((step, i) => (
            <span key={step.id} className="flex items-center gap-1">
              {i > 0 ? <ChevronRight className="size-4 text-muted-foreground" /> : null}
              {step.id === map.id ? (
                <span aria-current="page">{step.name}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onFollow(step.id === atlas.currentId ? null : step.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {step.name}
                </button>
              )}
            </span>
          ))}
        </nav>
        {following ? (
          <button
            type="button"
            onClick={() => onFollow(null)}
            className="ml-auto rounded-full border border-border px-3 py-1 text-sm hover:bg-muted"
          >
            {t("atlas.backToDmMap")}
          </button>
        ) : null}
      </div>
      {map.imageUrl ? (
        <LeafletAtlas
          imageUrl={map.imageUrl}
          width={w}
          height={h}
          markers={markers}
          readOnly
          followPortals
          className="atlas-map h-[60vh] min-h-[360px] w-full"
          onMeasured={(mw, mh) => setMeasured({ url: map.imageUrl!, w: mw, h: mh })}
          onPopupAction={(a) => {
            if ("portal" in a) onFollow(a.portal === atlas.currentId ? null : a.portal);
          }}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/40 py-16 text-center text-muted-foreground">
          {t("atlas.preparingMap")}
        </div>
      )}
    </section>
  );
}
