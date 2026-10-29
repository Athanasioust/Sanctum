"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { AtlasFogOp } from "@/db/schema";
import { applyFogOp, paintFog } from "@/lib/atlas/fog";
import { atlasIconSvg } from "@/lib/atlas/icons";

/**
 * A thin hand-written Leaflet wrapper for the atlas — no react-leaflet. A flat
 * map image is shown with `L.CRS.Simple`, one map unit per image pixel:
 * latitude runs from 0 at the top edge to −height at the bottom, longitude from
 * 0 to width. Everything crossing this boundary is in 0–1 image fractions.
 *
 * One Leaflet instance lives for the component's lifetime and is removed on
 * unmount; markers are diffed by id on every render rather than rebuilt, so the
 * player view's 4-second poll doesn't make the map flicker or lose its zoom.
 *
 * Load with `next/dynamic({ ssr: false })` — Leaflet touches `window` on import.
 */

export type AtlasViewMarker = {
  id: number;
  x: number;
  y: number;
  title: string;
  icon: string;
  color: string;
  /** Popup body (already-safe HTML). `[data-href]` and `[data-portal]` links are delegated. */
  popupHtml: string;
  /** Clicking goes straight through this portal instead of opening the popup. */
  portalMapId?: number | null;
  dim?: boolean;
};

export type AtlasTool = "select" | "add" | "reveal-brush" | "hide-brush" | "reveal-rect" | "hide-rect";

export type AtlasPopupAction = { href: string } | { portal: number };

type Props = {
  imageUrl: string;
  width: number;
  height: number;
  markers: AtlasViewMarker[];
  selectedId?: number | null;
  tool?: AtlasTool;
  /** Leaves dragging, adding and fog painting off. */
  readOnly?: boolean;
  /** Portals navigate on click (play mode and the player view). */
  followPortals?: boolean;
  /** DM-only shaded overlay. The player view never gets one. */
  fog?: { enabled: boolean; ops: AtlasFogOp[] } | null;
  /** Brush radius as a fraction of the image width. */
  brushRadius?: number;
  /** Fly to this marker whenever `focus.nonce` changes. */
  focus?: { id: number; nonce: number } | null;
  className?: string;
  onMeasured?: (width: number, height: number) => void;
  onMapClick?: (x: number, y: number) => void;
  onMarkerClick?: (id: number) => void;
  onMarkerMove?: (id: number, x: number, y: number) => void;
  onFogStroke?: (op: AtlasFogOp) => void;
  onPopupAction?: (action: AtlasPopupAction) => void;
};

const FOG_COLOR = "#05050a";
/** Fog canvases are drawn at most this many pixels across; CSS scales them up. */
const FOG_CANVAS_MAX = 2048;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * A custom overlay that shows a canvas stretched over the image bounds. It
 * borrows ImageOverlay's positioning and zoom animation (exactly how Leaflet's
 * own SVGOverlay is built) and swaps the <img> for a canvas we paint fog onto.
 */
const CanvasOverlay = L.ImageOverlay.extend({
  _initImage(this: L.ImageOverlay & { _image: HTMLElement; _canvas: HTMLCanvasElement }) {
    const el = (this._image = this._canvas);
    L.DomUtil.addClass(el, "leaflet-image-layer");
    if ((this as unknown as { _zoomAnimated: boolean })._zoomAnimated) L.DomUtil.addClass(el, "leaflet-zoom-animated");
    if (this.options.className) L.DomUtil.addClass(el, this.options.className);
    el.onselectstart = L.Util.falseFn;
    el.onmousemove = L.Util.falseFn;
  },
}) as unknown as new (
  canvas: HTMLCanvasElement,
  bounds: L.LatLngBoundsExpression,
  options?: L.ImageOverlayOptions,
) => L.ImageOverlay;

function makeCanvasOverlay(canvas: HTMLCanvasElement, bounds: L.LatLngBounds, opts: L.ImageOverlayOptions) {
  const layer = new CanvasOverlay(canvas, bounds, opts) as L.ImageOverlay & { _canvas: HTMLCanvasElement };
  layer._canvas = canvas;
  return layer;
}

function markerIcon(m: AtlasViewMarker, selected: boolean) {
  return L.divIcon({
    className: "atlas-marker-icon",
    html: `<div class="atlas-pin${selected ? " is-selected" : ""}${m.dim ? " is-dim" : ""}${m.portalMapId ? " is-portal" : ""}" style="--pin:${m.color}">${atlasIconSvg(m.icon, 15, "#fff")}</div>`,
    iconSize: [30, 36],
    iconAnchor: [15, 34],
    popupAnchor: [0, -32],
    tooltipAnchor: [0, -30],
  });
}

export default function LeafletAtlas(props: Props) {
  const {
    imageUrl,
    width,
    height,
    markers,
    selectedId = null,
    tool = "select",
    readOnly = false,
    followPortals = false,
    fog = null,
    brushRadius = 0.03,
    focus = null,
    className,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const imageRef = useRef<L.ImageOverlay | null>(null);
  const markerLayerRef = useRef<Map<number, { marker: L.Marker; key: string }>>(new Map());
  const fogRef = useRef<{ layer: L.ImageOverlay; canvas: HTMLCanvasElement; base: HTMLCanvasElement } | null>(null);
  const strokeRef = useRef<AtlasFogOp | null>(null);
  // Callbacks change every render; handlers read the latest through this ref.
  const cb = useRef(props);
  useEffect(() => {
    cb.current = props;
  });

  const sized = width > 0 && height > 0;
  const bounds = sized ? L.latLngBounds([-height, 0], [0, width]) : null;

  // Measure an image whose size isn't known yet (fresh upload, migrated map).
  useEffect(() => {
    if (sized) return;
    const img = new window.Image();
    img.onload = () => cb.current.onMeasured?.(img.naturalWidth, img.naturalHeight);
    img.src = imageUrl;
    return () => {
      img.onload = null;
    };
  }, [imageUrl, sized]);

  // Create the map once; tear it down on unmount so no instance leaks.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const map = L.map(el, {
      crs: L.CRS.Simple,
      minZoom: -6,
      maxZoom: 4,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
      attributionControl: false,
      zoomControl: true,
      boxZoom: false,
    });
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);

    // Delegate popup links to the parent so it can route without a page load.
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-href],[data-portal]");
      if (!target || !el.contains(target)) return;
      e.preventDefault();
      if (target.dataset.portal) cb.current.onPopupAction?.({ portal: Number(target.dataset.portal) });
      else if (target.dataset.href) cb.current.onPopupAction?.({ href: target.dataset.href });
    };
    el.addEventListener("click", onClick);

    const layers = markerLayerRef.current;
    return () => {
      el.removeEventListener("click", onClick);
      ro.disconnect();
      layers.clear();
      imageRef.current = null;
      fogRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Base image; refit whenever the image or its size changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bounds) return;
    if (imageRef.current) {
      imageRef.current.setUrl(imageUrl);
      imageRef.current.setBounds(bounds);
    } else {
      imageRef.current = L.imageOverlay(imageUrl, bounds, { className: "atlas-base-image" }).addTo(map);
    }
    const fit = map.getBoundsZoom(bounds, false);
    map.setMinZoom(Math.floor(fit) - 1);
    map.setMaxBounds(bounds.pad(0.5));
    map.fitBounds(bounds, { animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bounds is derived from width/height
  }, [imageUrl, width, height]);

  // DM fog overlay.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bounds) return;
    if (!fog?.enabled) {
      if (fogRef.current) {
        fogRef.current.layer.remove();
        fogRef.current = null;
      }
      return;
    }
    const scale = Math.min(1, FOG_CANVAS_MAX / Math.max(width, height));
    const cw = Math.max(1, Math.round(width * scale));
    const ch = Math.max(1, Math.round(height * scale));
    if (!fogRef.current || fogRef.current.canvas.width !== cw || fogRef.current.canvas.height !== ch) {
      fogRef.current?.layer.remove();
      const canvas = document.createElement("canvas");
      const base = document.createElement("canvas");
      canvas.width = base.width = cw;
      canvas.height = base.height = ch;
      const layer = makeCanvasOverlay(canvas, bounds, { className: "atlas-fog", interactive: false });
      layer.addTo(map);
      fogRef.current = { layer, canvas, base };
    } else {
      fogRef.current.layer.setBounds(bounds);
    }
    const { canvas, base } = fogRef.current;
    paintFog(base.getContext("2d")!, fog.ops, cw, ch, FOG_COLOR);
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(base, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bounds is derived from width/height
  }, [fog, width, height]);

  // Markers, diffed by id.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sized) return;
    const layers = markerLayerRef.current;
    const seen = new Set<number>();
    const draggable = !readOnly && tool === "select";
    for (const m of markers) {
      seen.add(m.id);
      const selected = m.id === selectedId;
      const key = JSON.stringify([m.x, m.y, m.title, m.icon, m.color, m.popupHtml, m.dim, m.portalMapId, selected, draggable, followPortals]);
      const existing = layers.get(m.id);
      if (existing && existing.key === key) continue;
      const latlng = L.latLng(-m.y * height, m.x * width);
      if (existing) {
        const mk = existing.marker;
        mk.setLatLng(latlng);
        mk.setIcon(markerIcon(m, selected));
        if (m.title && mk.getTooltip()) mk.setTooltipContent(escapeText(m.title));
        else if (m.title) mk.bindTooltip(escapeText(m.title), { direction: "top", className: "atlas-tooltip" });
        else mk.unbindTooltip();
        if (draggable) mk.dragging?.enable();
        else mk.dragging?.disable();
        mk.setPopupContent(m.popupHtml);
        existing.key = key;
        continue;
      }
      const mk = L.marker(latlng, {
        icon: markerIcon(m, selected),
        draggable,
        keyboard: true,
        title: m.title,
        riseOnHover: true,
        autoPan: true,
      });
      if (m.title) mk.bindTooltip(escapeText(m.title), { direction: "top", className: "atlas-tooltip" });
      mk.bindPopup(m.popupHtml, { className: "atlas-popup", maxWidth: 320, minWidth: 200 });
      mk.on("click", () => {
        const cur = cb.current.markers.find((x) => x.id === m.id);
        if (cb.current.followPortals && cur?.portalMapId) {
          mk.closePopup();
          cb.current.onPopupAction?.({ portal: cur.portalMapId });
          return;
        }
        cb.current.onMarkerClick?.(m.id);
      });
      mk.on("dragend", () => {
        const p = mk.getLatLng();
        cb.current.onMarkerMove?.(m.id, clamp01(p.lng / width), clamp01(-p.lat / height));
      });
      mk.addTo(map);
      layers.set(m.id, { marker: mk, key });
    }
    for (const [id, entry] of layers) {
      if (!seen.has(id)) {
        entry.marker.remove();
        layers.delete(id);
      }
    }
  }, [markers, selectedId, readOnly, tool, followPortals, width, height, sized]);

  // Fly to a marker picked from the list.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus || !sized) return;
    const entry = markerLayerRef.current.get(focus.id);
    if (!entry) return;
    map.flyTo(entry.marker.getLatLng(), Math.max(map.getZoom(), map.getMinZoom() + 2), { duration: 0.5 });
    entry.marker.openPopup();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new nonce should move the view
  }, [focus?.nonce]);

  // Tools: click to add, drag to paint fog.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sized || readOnly) return;
    const el = map.getContainer();
    const toFrac = (ll: L.LatLng): [number, number] => [ll.lng / width, -ll.lat / height];
    const painting = tool.endsWith("-brush") || tool.endsWith("-rect");
    el.classList.toggle("atlas-tool-paint", painting);
    el.classList.toggle("atlas-tool-add", tool === "add");

    const onClick = (e: L.LeafletMouseEvent) => {
      if (tool !== "add") return;
      const [x, y] = toFrac(e.latlng);
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      cb.current.onMapClick?.(x, y);
    };
    map.on("click", onClick);
    if (!painting) {
      map.dragging.enable();
      return () => {
        map.off("click", onClick);
      };
    }

    map.dragging.disable();
    const mode = tool.startsWith("reveal") ? "reveal" : "hide";
    const isRect = tool.endsWith("-rect");
    let start: [number, number] | null = null;

    const redraw = () => {
      const f = fogRef.current;
      if (!f) return;
      const ctx = f.canvas.getContext("2d")!;
      ctx.clearRect(0, 0, f.canvas.width, f.canvas.height);
      ctx.drawImage(f.base, 0, 0);
      if (strokeRef.current) applyFogOp(ctx, strokeRef.current, f.canvas.width, f.canvas.height, FOG_COLOR);
    };
    const down = (e: L.LeafletMouseEvent) => {
      const p = toFrac(e.latlng).map(clamp01) as [number, number];
      start = p;
      strokeRef.current = isRect
        ? { id: crypto.randomUUID(), mode, kind: "rect", x: p[0], y: p[1], w: 0, h: 0 }
        : { id: crypto.randomUUID(), mode, kind: "brush", radius: cb.current.brushRadius ?? brushRadius, points: [p] };
      redraw();
    };
    const move = (e: L.LeafletMouseEvent) => {
      const op = strokeRef.current;
      if (!op || !start) return;
      const p = toFrac(e.latlng).map(clamp01) as [number, number];
      if (op.kind === "rect") {
        op.x = Math.min(start[0], p[0]);
        op.y = Math.min(start[1], p[1]);
        op.w = Math.abs(p[0] - start[0]);
        op.h = Math.abs(p[1] - start[1]);
      } else {
        const last = op.points[op.points.length - 1];
        // Thin the stroke: skip points closer than a fifth of the radius.
        if (Math.hypot((p[0] - last[0]) * width, (p[1] - last[1]) * height) < op.radius * width * 0.2) return;
        if (op.points.length < 5000) op.points.push(p);
      }
      redraw();
    };
    const up = () => {
      const op = strokeRef.current;
      strokeRef.current = null;
      start = null;
      if (!op) return;
      if (op.kind === "rect" && (op.w <= 0 || op.h <= 0)) {
        redraw();
        return;
      }
      cb.current.onFogStroke?.(op);
    };
    map.on("mousedown", down);
    map.on("mousemove", move);
    map.on("mouseup", up);
    document.addEventListener("mouseup", up);
    return () => {
      map.off("click", onClick);
      map.off("mousedown", down);
      map.off("mousemove", move);
      map.off("mouseup", up);
      document.removeEventListener("mouseup", up);
      map.dragging.enable();
      strokeRef.current = null;
    };
  }, [tool, readOnly, sized, width, height, brushRadius]);

  return <div ref={containerRef} className={className ?? "atlas-map h-[70vh] min-h-[420px] w-full"} />;
}

function escapeText(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
