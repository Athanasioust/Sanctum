import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { atlasCategories, atlasMaps, atlasMarkers, type AtlasMap } from "@/db/schema";
import { ApiError } from "@/lib/api";
import type { Translate } from "@/lib/i18n";
import { atlasIconSvg } from "@/lib/atlas/icons";
import { ATLAS_LINK_LABEL_KEYS, atlasDescendantIds } from "@/lib/atlas/links";
import { atlasPopupHtml } from "@/lib/atlas/popup";
import { loadAtlasLinkables, markerLook, markerVisibleToPlayers } from "@/lib/atlas/server";
import { uploadAsDataUri } from "@/lib/atlas/files";

export type AtlasExportVariant = "dm" | "player";

type ExportMarker = { x: number; y: number; title: string; icon: string; color: string; popup: string; portal: number | null };
type ExportMap = { id: number; name: string; image: string; width: number; height: number; parent: number | null; markers: ExportMarker[] };

async function leafletAssets() {
  // Staged by scripts/copy-leaflet.mjs; node_modules is the dev fallback.
  const dirs = [path.join(process.cwd(), "public", "vendor", "leaflet"), path.join(process.cwd(), "node_modules", "leaflet", "dist")];
  for (const dir of dirs) {
    try {
      const [js, css, license] = await Promise.all([
        fs.readFile(path.join(dir, "leaflet.js"), "utf8"),
        fs.readFile(path.join(dir, "leaflet.css"), "utf8"),
        fs.readFile(path.join(dir, dir.endsWith("dist") ? "../LICENSE" : "LICENSE"), "utf8"),
      ]);
      return { js, css, license };
    } catch {
      /* try the next location */
    }
  }
  throw new ApiError("Leaflet files are missing; run `npm run build` again", 500);
}

/**
 * A self-contained, offline HTML atlas: Leaflet inlined, every image embedded
 * as a data URI, markers and popups as data. Portals switch between the maps
 * inside the one file, so a whole hierarchy still works with no Sanctum and
 * no network. Record links become plain text — there's no app to open them in.
 *
 * The player variant applies the same rules as the player view: unrevealed
 * child maps, hidden or fogged markers and DM notes are left out, and a fogged
 * map ships only its fog-burned image.
 */
export async function buildAtlasExport(opts: {
  mapId: number;
  variant: AtlasExportVariant;
  scope: "map" | "tree";
  t: Translate;
}): Promise<{ filename: string; html: string }> {
  const { mapId, variant, scope, t } = opts;
  const [root] = await db.select().from(atlasMaps).where(eq(atlasMaps.id, mapId));
  if (!root) throw new ApiError("Not found", 404);
  const all = await db.select().from(atlasMaps).where(eq(atlasMaps.campaignId, root.campaignId));

  const inTree = scope === "tree" ? atlasDescendantIds(all, root.id) : new Set([root.id]);
  const included = all.filter((m) => {
    if (!inTree.has(m.id) || !m.imageUrl) return false;
    if (variant === "dm" || m.id === root.id) return true;
    return m.revealToPlayers;
  });
  const playerImage = (m: AtlasMap) => (variant === "player" && m.fogEnabled ? m.playerImageUrl : m.imageUrl);
  if (!playerImage(root)) {
    throw new ApiError(variant === "player" ? t("atlas.exportNeedsRender") : t("atlas.exportNeedsImage"), 409);
  }

  const ids = included.map((m) => m.id);
  const [markerRows, categoryRows, records] = await Promise.all([
    db.select().from(atlasMarkers).where(inArray(atlasMarkers.mapId, ids)).orderBy(asc(atlasMarkers.id)),
    db.select().from(atlasCategories).where(eq(atlasCategories.campaignId, root.campaignId)),
    variant === "dm" ? loadAtlasLinkables(root.campaignId) : Promise.resolve([]),
  ]);
  const categories = new Map(categoryRows.map((c) => [c.id, c]));
  const recordName = new Map(records.map((r) => [`${r.type}:${r.id}`, r.name]));

  const maps: ExportMap[] = [];
  for (const m of included) {
    const image = await uploadAsDataUri(playerImage(m));
    if (!image) continue; // fogged with no render yet, or the file is gone: leave it out
    maps.push({ id: m.id, name: m.name, image, width: m.width, height: m.height, parent: m.parentMapId, markers: [] });
  }
  const exported = new Map(maps.map((m) => [m.id, m]));
  const source = new Map(included.map((m) => [m.id, m]));

  for (const mk of markerRows) {
    const target = exported.get(mk.mapId);
    const map = source.get(mk.mapId);
    if (!target || !map) continue;
    if (variant === "player" && !markerVisibleToPlayers(mk, map)) continue;
    const look = markerLook(mk, categories);
    const portal = mk.portalMapId && exported.has(mk.portalMapId) ? mk.portalMapId : null;
    const linked = variant === "dm" && mk.linkType && mk.linkId ? recordName.get(`${mk.linkType}:${mk.linkId}`) : undefined;
    target.markers.push({
      x: mk.x,
      y: mk.y,
      title: mk.title,
      icon: atlasIconSvg(look.icon, 15, "#fff"),
      color: look.color,
      portal,
      popup: atlasPopupHtml({
        title: mk.title,
        description: mk.description,
        linkText: linked && mk.linkType ? `${t(ATLAS_LINK_LABEL_KEYS[mk.linkType])}: ${linked}` : null,
        portal: portal ? { id: portal, label: t("atlas.enterMap").replace("{name}", exported.get(portal)!.name) } : null,
        extraHtml:
          variant === "dm" && mk.dmNotes.trim()
            ? `<div class="atlas-popup-dm"><em>${escapeHtml(t("atlas.dmNotes"))}:</em> ${escapeHtml(mk.dmNotes)}${mk.hidden ? ` · ${escapeHtml(t("atlas.hiddenByDm"))}` : ""}</div>`
            : variant === "dm" && mk.hidden
              ? `<div class="atlas-popup-dm">${escapeHtml(t("atlas.hiddenByDm"))}</div>`
              : "",
      }),
    });
  }

  // A parent left out of the file isn't a breadcrumb step.
  for (const m of maps) if (m.parent && !exported.has(m.parent)) m.parent = null;

  const { js, css, license } = await leafletAssets();
  const title = `${root.name} — ${variant === "dm" ? t("atlas.exportDmLabel") : t("atlas.exportPlayerLabel")}`;
  const data = { start: root.id, maps, labels: { subMaps: t("atlas.tabSubMaps") } };
  const slug = root.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "map";

  return {
    filename: `${slug}-${variant === "dm" ? "dm" : "players"}.html`,
    html: page({ title, css, js, license, data }),
  };
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Text placed inside a <script> must not be able to close it. */
const scriptSafe = (s: string) => s.replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--");

function page({ title, css, js, license, data }: { title: string; css: string; js: string; license: string; data: unknown }) {
  return `<!doctype html>
<!--
Made with Sanctum. Map viewer: Leaflet (https://leafletjs.com), included below under its licence:

${license.replace(/--/g, "- -")}
-->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="Sanctum">
<title>${escapeHtml(title)}</title>
<style>${css}</style>
<style>
:root { --bg:#0f0f0f; --fg:#e8e8ec; --card:#161618; --muted:#9b9ba4; --border:#29292f; --primary:#7c3aed; }
* { box-sizing: border-box; }
html, body { margin:0; height:100%; background:var(--bg); color:var(--fg); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
body { display:flex; flex-direction:column; }
header { display:flex; flex-wrap:wrap; align-items:center; gap:8px 16px; padding:10px 16px; border-bottom:1px solid var(--border); }
#crumbs { display:flex; flex-wrap:wrap; align-items:center; gap:4px; font-weight:600; font-size:1.05rem; }
#crumbs a { color:var(--muted); text-decoration:none; cursor:pointer; }
#crumbs a:hover { color:var(--fg); }
#crumbs .sep { color:var(--muted); padding:0 2px; }
#subs { display:flex; flex-wrap:wrap; gap:6px; margin-left:auto; font-size:.8rem; align-items:center; color:var(--muted); }
#subs a { border:1px solid var(--border); border-radius:999px; padding:2px 10px; color:var(--fg); text-decoration:none; cursor:pointer; }
#subs a:hover { border-color:var(--primary); }
#map { flex:1; min-height:300px; background:#0b0b0c; }
.leaflet-container { font-family:inherit; background:#0b0b0c; }
.leaflet-control-zoom a { background:var(--card)!important; color:var(--fg)!important; border-color:var(--border)!important; }
.atlas-marker-icon { background:none; border:none; }
.atlas-pin { position:relative; width:30px; height:30px; border-radius:999px 999px 999px 2px; transform:rotate(-45deg); background:var(--pin); border:2px solid rgba(255,255,255,.85); box-shadow:0 2px 6px rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; }
.atlas-pin > svg { transform:rotate(45deg); }
.atlas-pin.is-portal::after { content:""; position:absolute; inset:-6px; border-radius:inherit; border:2px dashed rgba(255,255,255,.55); }
.leaflet-popup-content-wrapper, .leaflet-popup-tip { background:var(--card); color:var(--fg); border:1px solid var(--border); }
.leaflet-popup-content-wrapper { border-radius:12px; }
.leaflet-popup-content { margin:12px 14px; font-size:.875rem; line-height:1.45; }
.atlas-popup-title { font-weight:600; font-size:1rem; margin-bottom:4px; }
.atlas-popup-body { color:var(--muted); max-height:220px; overflow-y:auto; }
.atlas-popup-body p { margin:0 0 6px; }
.atlas-popup-link, .atlas-popup-dm { color:var(--muted); font-size:.8rem; margin-top:6px; border-top:1px solid var(--border); padding-top:6px; }
.atlas-popup-actions { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
.atlas-popup-actions a { border:1px solid var(--border); border-radius:999px; padding:2px 10px; color:var(--fg); text-decoration:none; cursor:pointer; }
.atlas-popup-actions a:hover { border-color:var(--primary); color:var(--primary); }
.leaflet-tooltip { background:var(--card); color:var(--fg); border:1px solid var(--border); box-shadow:none; }
</style>
</head>
<body>
<header><nav id="crumbs"></nav><div id="subs"></div></header>
<div id="map"></div>
<script>${scriptSafe(js)}</script>
<script type="application/json" id="atlas-data">${scriptSafe(JSON.stringify(data))}</script>
<script>
(function () {
  var data = JSON.parse(document.getElementById("atlas-data").textContent);
  var byId = {};
  data.maps.forEach(function (m) { byId[m.id] = m; });
  var map = L.map("map", { crs: L.CRS.Simple, minZoom: -6, maxZoom: 4, zoomSnap: 0.25, zoomDelta: 0.5, attributionControl: false });
  var layer = L.layerGroup().addTo(map);
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  function link(id, text) { return '<a data-go="' + id + '">' + esc(text) + "</a>"; }
  function show(id) {
    var m = byId[id] || byId[data.start];
    layer.clearLayers();
    document.title = m.name;
    var trail = [], cur = m, guard = 0;
    while (cur && guard++ < 64) { trail.unshift(cur); cur = cur.parent ? byId[cur.parent] : null; }
    document.getElementById("crumbs").innerHTML = trail.map(function (s) {
      return s.id === m.id ? "<span>" + esc(s.name) + "</span>" : link(s.id, s.name);
    }).join('<span class="sep">›</span>');
    var kids = data.maps.filter(function (k) { return k.parent === m.id; });
    document.getElementById("subs").innerHTML = kids.length ? esc(data.labels.subMaps) + ": " + kids.map(function (k) { return link(k.id, k.name); }).join("") : "";
    function draw(w, h) {
      var b = L.latLngBounds([-h, 0], [0, w]);
      L.imageOverlay(m.image, b).addTo(layer);
      m.markers.forEach(function (mk) {
        var icon = L.divIcon({ className: "atlas-marker-icon", html: '<div class="atlas-pin' + (mk.portal ? " is-portal" : "") + '" style="--pin:' + esc(mk.color) + '">' + mk.icon + "</div>", iconSize: [30, 36], iconAnchor: [15, 34], popupAnchor: [0, -32], tooltipAnchor: [0, -30] });
        var marker = L.marker([-mk.y * h, mk.x * w], { icon: icon, title: mk.title, riseOnHover: true }).bindPopup(mk.popup, { maxWidth: 320, minWidth: 200 });
        if (mk.title) marker.bindTooltip(esc(mk.title), { direction: "top" });
        marker.addTo(layer);
      });
      map.setMinZoom(Math.floor(map.getBoundsZoom(b, false)) - 1);
      map.setMaxBounds(b.pad(0.5));
      map.fitBounds(b, { animate: false });
    }
    if (m.width && m.height) draw(m.width, m.height);
    else { var img = new Image(); img.onload = function () { draw(img.naturalWidth, img.naturalHeight); }; img.src = m.image; }
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-go],[data-portal]");
    if (!a) return;
    e.preventDefault();
    location.hash = "map-" + (a.getAttribute("data-go") || a.getAttribute("data-portal"));
  });
  function fromHash() { var m = /^#map-(\\d+)$/.exec(location.hash); show(m ? Number(m[1]) : data.start); }
  window.addEventListener("hashchange", fromHash);
  fromHash();
})();
</script>
</body>
</html>
`;
}
