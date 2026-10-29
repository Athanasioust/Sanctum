import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import type { AtlasLinkType } from "@/db/schema";
import { atlasAppearances } from "@/lib/atlas/server";
import { atlasMapHref } from "@/lib/atlas/links";
import { getTranslation } from "@/lib/i18n/server";

/**
 * "Appears on the map" — the atlas markers linked to this record, each a link
 * back to its map. Renders nothing when the record isn't on any map.
 */
export async function AppearsOnMaps({
  campaignId,
  linkType,
  linkId,
  className,
}: {
  campaignId: number;
  linkType: AtlasLinkType;
  linkId: number;
  className?: string;
}) {
  const rows = await atlasAppearances(campaignId, linkType, linkId);
  if (rows.length === 0) return null;
  const { t } = await getTranslation();
  return (
    <div className={className ?? "mb-6 rounded-xl border border-border bg-card p-4"}>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
        <MapIcon className="size-4 text-primary" /> {t("atlas.appearsOn")}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {rows.map((r) => (
          <li key={r.markerId}>
            <Link
              href={atlasMapHref(campaignId, r.mapId)}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm hover:border-primary/50 hover:text-primary"
            >
              {r.mapName}
              {r.title ? <span className="text-muted-foreground">· {r.title}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
