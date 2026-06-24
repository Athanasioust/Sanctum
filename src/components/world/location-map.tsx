"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Upload, Trash2, Save, Grid3x3, ImageIcon, Eraser, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/shared/form";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";
import { GRID_CELL_COLORS } from "@/components/world/grid-builder";
import type { Location, MapPin, GridData } from "@/db/schema";

const ImageMap = dynamic(() => import("@/components/world/image-map"), { ssr: false });
const GridBuilder = dynamic(() => import("@/components/world/grid-builder"), { ssr: false });

const PIN_COLORS = ["#7c3aed", "#dc2626", "#16a34a", "#2563eb", "#a16207"];
const GRID_TOOLS = [
  { key: "floor", label: "Floor" },
  { key: "wall", label: "Wall" },
  { key: "door", label: "Door" },
  { key: "water", label: "Water" },
  { key: "difficult", label: "Difficult" },
];

export function LocationMap({ location }: { location: Location }) {
  const [imageUrl, setImageUrl] = useState<string | null>(location.mapImageUrl);
  const [pins, setPins] = useState<MapPin[]>(location.mapPins);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [grid, setGrid] = useState<GridData | null>(location.gridData);
  const [tool, setTool] = useState<string>("floor");
  const [savingGrid, setSavingGrid] = useState(false);

  const selectedPin = pins.find((p) => p.id === selectedPinId) ?? null;

  async function persist(patch: Partial<Location>) {
    try {
      await api.patch(`/api/locations/${location.id}`, patch);
    } catch {
      toast.error("Failed to save map");
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = (await res.json()) as { url: string };
      setImageUrl(url);
      await persist({ mapImageUrl: url });
      toast.success("Map image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function savePins(next: MapPin[]) {
    setPins(next);
    persist({ mapPins: next });
  }

  function addPin(xFrac: number, yFrac: number) {
    const pin: MapPin = {
      id: crypto.randomUUID(),
      x: xFrac,
      y: yFrac,
      label: `Pin ${pins.length + 1}`,
      description: "",
      color: "#7c3aed",
    };
    savePins([...pins, pin]);
    setSelectedPinId(pin.id);
  }

  function updatePin(id: string, patch: Partial<MapPin>) {
    savePins(pins.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removePin(id: string) {
    savePins(pins.filter((p) => p.id !== id));
    setSelectedPinId(null);
  }

  function createGrid() {
    const cols = 20;
    const rows = 15;
    setGrid({ cols, rows, cellSize: 28, cells: Array(cols * rows).fill(null) });
  }

  function resizeGrid(nextCols: number, nextRows: number, nextCellSize: number) {
    if (!grid) return;
    const cells: (GridData["cells"][number])[] = Array(nextCols * nextRows).fill(null);
    for (let r = 0; r < Math.min(nextRows, grid.rows); r++) {
      for (let c = 0; c < Math.min(nextCols, grid.cols); c++) {
        cells[r * nextCols + c] = grid.cells[r * grid.cols + c] ?? null;
      }
    }
    setGrid({ cols: nextCols, rows: nextRows, cellSize: nextCellSize, cells });
  }

  function paintCell(index: number) {
    if (!grid) return;
    const cells = [...grid.cells];
    const existing = cells[index];
    if (tool === "erase") {
      cells[index] = null;
    } else if (tool === "label") {
      const label = window.prompt("Room label", existing?.label ?? "");
      if (label === null) return;
      cells[index] = { type: existing?.type ?? "floor", label, color: existing?.color };
    } else {
      cells[index] = { type: tool, label: existing?.label };
    }
    setGrid({ ...grid, cells });
  }

  async function saveGrid() {
    if (!grid) return;
    setSavingGrid(true);
    await persist({ gridData: grid });
    setSavingGrid(false);
    toast.success("Grid saved");
  }

  return (
    <Tabs defaultValue="image">
      <TabsList className="mb-4">
        <TabsTrigger value="image"><ImageIcon className="size-4" /> Image Map</TabsTrigger>
        <TabsTrigger value="grid"><Grid3x3 className="size-4" /> Grid Builder</TabsTrigger>
      </TabsList>

      {/* Image map */}
      <TabsContent value="image">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="inline-flex">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = "";
              }}
            />
            <Button asChild variant="outline" disabled={uploading}>
              <span><Upload className="size-4" /> {uploading ? "Uploading…" : imageUrl ? "Replace image" : "Upload image"}</span>
            </Button>
          </label>
          {imageUrl ? (
            <span className="text-sm text-muted-foreground">Click the map to drop a pin.</span>
          ) : null}
        </div>

        {imageUrl ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
            <ImageMap
              imageUrl={imageUrl}
              pins={pins}
              editable
              selectedPinId={selectedPinId}
              onStageClick={addPin}
              onPinClick={setSelectedPinId}
            />
            <div className="space-y-3">
              {selectedPin ? (
                <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <h3 className="font-medium">Edit pin</h3>
                  <Field label="Label">
                    <Input value={selectedPin.label} onChange={(e) => updatePin(selectedPin.id, { label: e.target.value })} />
                  </Field>
                  <Field label="Description">
                    <Textarea value={selectedPin.description ?? ""} onChange={(e) => updatePin(selectedPin.id, { description: e.target.value })} rows={3} />
                  </Field>
                  <Field label="Color">
                    <div className="flex gap-2">
                      {PIN_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => updatePin(selectedPin.id, { color: c })}
                          className={cn("size-6 rounded-full border-2", selectedPin.color === c ? "border-foreground" : "border-transparent")}
                          style={{ backgroundColor: c }}
                          aria-label={c}
                        />
                      ))}
                    </div>
                  </Field>
                  <Button variant="destructive" size="sm" onClick={() => removePin(selectedPin.id)}>
                    <Trash2 className="size-4" /> Delete pin
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  {pins.length === 0 ? "No pins yet. Click the map to add one." : "Select a pin to edit it."}
                </div>
              )}

              {pins.length > 0 ? (
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Pins</p>
                  <ul className="space-y-1">
                    {pins.map((p, i) => (
                      <li key={p.id}>
                        <button
                          onClick={() => setSelectedPinId(p.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm",
                            p.id === selectedPinId ? "bg-primary/15 text-primary" : "hover:bg-muted",
                          )}
                        >
                          <span className="size-3 rounded-full" style={{ backgroundColor: p.color || "#7c3aed" }} />
                          {p.label || `Pin ${i + 1}`}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 py-16 text-center">
            <ImageIcon className="mb-3 size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Upload a map image to start placing pins.</p>
          </div>
        )}
      </TabsContent>

      {/* Grid builder */}
      <TabsContent value="grid">
        {grid ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
              <Field label="Columns" className="w-24">
                <Input type="number" min={1} max={60} value={grid.cols} onChange={(e) => resizeGrid(Number(e.target.value || 1), grid.rows, grid.cellSize)} />
              </Field>
              <Field label="Rows" className="w-24">
                <Input type="number" min={1} max={60} value={grid.rows} onChange={(e) => resizeGrid(grid.cols, Number(e.target.value || 1), grid.cellSize)} />
              </Field>
              <Field label="Cell size" className="w-24">
                <Input type="number" min={12} max={64} value={grid.cellSize} onChange={(e) => resizeGrid(grid.cols, grid.rows, Number(e.target.value || 12))} />
              </Field>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" onClick={() => setGrid(null)}>Clear</Button>
                <Button onClick={saveGrid} disabled={savingGrid}>
                  <Save className="size-4" /> {savingGrid ? "Saving…" : "Save grid"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {GRID_TOOLS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTool(t.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm",
                    tool === t.key ? "border-primary bg-primary/15 text-primary" : "border-border hover:bg-muted",
                  )}
                >
                  <span className="size-3.5 rounded-sm" style={{ backgroundColor: GRID_CELL_COLORS[t.key] }} />
                  {t.label}
                </button>
              ))}
              <button
                onClick={() => setTool("label")}
                className={cn("flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm", tool === "label" ? "border-primary bg-primary/15 text-primary" : "border-border hover:bg-muted")}
              >
                <TagIcon className="size-3.5" /> Label
              </button>
              <button
                onClick={() => setTool("erase")}
                className={cn("flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm", tool === "erase" ? "border-primary bg-primary/15 text-primary" : "border-border hover:bg-muted")}
              >
                <Eraser className="size-3.5" /> Erase
              </button>
            </div>

            <GridBuilder data={grid} onCellPointer={paintCell} />
            <p className="text-xs text-muted-foreground">
              Click or drag to paint. Use the Label tool to name rooms. Remember to save.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 py-16 text-center">
            <Grid3x3 className="mb-3 size-10 text-muted-foreground" />
            <p className="mb-4 text-sm text-muted-foreground">Build a dungeon grid from scratch.</p>
            <Button onClick={createGrid}>
              <Grid3x3 className="size-4" /> Create grid
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
