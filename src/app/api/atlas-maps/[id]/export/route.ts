import { apiRoute, requireId } from "@/lib/api";
import { buildAtlasExport } from "@/lib/atlas/export";
import { getTranslation } from "@/lib/i18n/server";

type Params = { id: string };

/**
 * Export → Interactive HTML. `variant` is `dm` (everything) or `player` (what
 * the player view would show); `scope` is `map` or `tree` (the map and every
 * map beneath it, linked by their portals inside one file).
 */
export const GET = apiRoute<Params>(async (req, { params }) => {
  const id = requireId((await params).id);
  const url = new URL(req.url);
  const variant = url.searchParams.get("variant") === "player" ? "player" : "dm";
  const scope = url.searchParams.get("scope") === "tree" ? "tree" : "map";
  const { t } = await getTranslation();
  const { filename, html } = await buildAtlasExport({ mapId: id, variant, scope, t });
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
