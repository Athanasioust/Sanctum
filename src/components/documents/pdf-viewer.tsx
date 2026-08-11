"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * PDF viewer built on pdf.js.
 *
 * The worker is served from Sanctum's own origin — scripts/copy-pdf-worker.mjs
 * stages it into public/ at build time — because pdf.js otherwise reaches for a
 * CDN, which would break the offline guarantee.
 */
const WORKER_SRC = "/pdf.worker.min.mjs";

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

/** A page of extracted text, used by the in-document search. */
type PageText = { page: number; text: string };

export function PdfViewer({ url, name }: { url: string; name: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  // `destroy()` lives on the loading task, not on the document proxy, so the
  // task is what has to be kept around to tear the worker down on unmount.
  const taskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const renderTask = useRef<RenderTask | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [pageTexts, setPageTexts] = useState<PageText[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Load the document. pdf.js is imported lazily so its ~1MB bundle only
  // arrives when a document is actually opened.
  //
  // The caller keys this component by document, so a different PDF mounts a
  // fresh viewer and there is no state here to reset on the way in.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
        const task = pdfjs.getDocument({ url });
        taskRef.current = task;
        const doc = await task.promise;
        if (cancelled) {
          void task.destroy();
          return;
        }
        docRef.current = doc;
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not open this PDF");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      renderTask.current?.cancel();
      renderTask.current = null;
      // Destroying the task aborts any in-flight request and shuts the worker
      // down; the document proxy has no destroy of its own.
      void taskRef.current?.destroy().catch(() => {
        // A task torn down mid-load rejects its promise — nothing to do.
      });
      taskRef.current = null;
      docRef.current = null;
    };
  }, [url]);

  // Draw the current page whenever it or the zoom changes.
  useEffect(() => {
    if (loading || error) return;
    let cancelled = false;

    void (async () => {
      const doc = docRef.current;
      const canvas = canvasRef.current;
      if (!doc || !canvas) return;

      // Cancel any in-flight render so fast paging doesn't draw two pages onto
      // the same canvas.
      renderTask.current?.cancel();

      try {
        const pdfPage = await doc.getPage(page);
        if (cancelled) return;

        // Render at device pixel ratio so text stays sharp on high-DPI screens.
        const ratio = window.devicePixelRatio || 1;
        const viewport = pdfPage.getViewport({ scale: zoom * ratio });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / ratio}px`;
        canvas.style.height = `${viewport.height / ratio}px`;

        // pdf.js 6 takes the canvas itself; `canvasContext` is the deprecated
        // backwards-compatible path.
        const task = pdfPage.render({ canvas, viewport });
        renderTask.current = task;
        await task.promise;
        renderTask.current = null;
      } catch (err) {
        // A cancelled render is expected when paging quickly.
        if (err instanceof Error && err.name === "RenderingCancelledException") return;
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not render this page");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, error, page, zoom]);

  // Arrow keys page through the document.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        setPage((p) => Math.min(numPages, p + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setPage((p) => Math.max(1, p - 1));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [numPages]);

  /**
   * Extract every page's text once, then match against it. Whole-document
   * extraction is the price of jumping straight to a hit; it runs on first
   * search only and is cached for the rest of the session.
   */
  async function runSearch() {
    const doc = docRef.current;
    if (!doc || !query.trim()) return;

    let texts = pageTexts;
    if (!texts) {
      setSearching(true);
      try {
        texts = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const pdfPage = await doc.getPage(n);
          const content = await pdfPage.getTextContent();
          texts.push({
            page: n,
            // `items` mixes text runs with marked-content markers; only the
            // former carry a string.
            text: content.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" ")
              .toLowerCase(),
          });
        }
        setPageTexts(texts);
      } catch {
        setSearching(false);
        return;
      }
      setSearching(false);
    }

    const needle = query.trim().toLowerCase();
    const hits = texts.filter((t) => t.text.includes(needle));
    if (hits.length === 0) return;
    // Jump to the next hit after the current page, wrapping around.
    const next = hits.find((h) => h.page > page) ?? hits[0];
    setPage(next.page);
  }

  const matches =
    pageTexts && query.trim()
      ? pageTexts.filter((t) => t.text.includes(query.trim().toLowerCase())).length
      : null;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-1 text-sm">
          <Input
            type="number"
            min={1}
            max={numPages || 1}
            value={page}
            onChange={(e) => {
              const n = Number(e.target.value || 1);
              setPage(Math.max(1, Math.min(numPages || 1, n)));
            }}
            className="h-8 w-16 text-center tabular-nums"
            aria-label="Page number"
          />
          <span className="text-muted-foreground">/ {numPages || "—"}</span>
        </div>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => setPage((p) => Math.min(numPages, p + 1))}
          disabled={page >= numPages}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        <Button
          size="icon-sm"
          variant="outline"
          onClick={() =>
            setZoom((z) => ZOOM_STEPS[Math.max(0, ZOOM_STEPS.indexOf(z) - 1)] ?? z)
          }
          disabled={zoom <= ZOOM_STEPS[0]}
          aria-label="Zoom out"
        >
          <ZoomOut className="size-4" />
        </Button>
        <span className="w-12 text-center text-sm tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() =>
            setZoom(
              (z) => ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, ZOOM_STEPS.indexOf(z) + 1)] ?? z,
            )
          }
          disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
          aria-label="Zoom in"
        >
          <ZoomIn className="size-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        <div className="relative min-w-40 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch();
            }}
            placeholder="Search this document…"
            className="h-8 pl-8 pr-8"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => void runSearch()} disabled={!query.trim()}>
          {searching ? <Loader2 className="size-3.5 animate-spin" /> : "Find"}
        </Button>
        {matches !== null && (
          <span className="text-xs text-muted-foreground">
            {matches === 0 ? "No pages match" : `${matches} page${matches === 1 ? "" : "s"}`}
          </span>
        )}
      </div>

      {/* Page */}
      <div className="flex min-h-96 justify-center overflow-auto rounded-xl border border-border bg-[#0b0b0c] p-4">
        {loading && (
          <p className="flex items-center gap-2 self-center text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Opening {name}…
          </p>
        )}
        {error && (
          <p className="max-w-sm self-center text-center text-sm text-destructive">{error}</p>
        )}
        <canvas
          ref={canvasRef}
          className={cn("shadow-2xl", (loading || error) && "hidden")}
        />
      </div>
    </div>
  );
}
