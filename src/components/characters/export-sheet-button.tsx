"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Pull the server's filename off the response, falling back to a safe one. */
function fileNameFrom(res: Response): string {
  const header = res.headers.get("Content-Disposition") ?? "";
  return /filename="([^"]+)"/.exec(header)?.[1] ?? "character-sheet.pdf";
}

/**
 * Download a character's PDF sheet. Fetched rather than linked so a failure
 * shows up as a toast instead of dumping a JSON error into a new tab.
 */
export function ExportSheetButton({ characterId }: { characterId: number }) {
  const [exporting, setExporting] = useState(false);

  async function exportSheet() {
    setExporting(true);
    try {
      const res = await fetch(`/api/characters/${characterId}/sheet`);
      if (!res.ok) {
        const message = await res
          .json()
          .then((body) => (typeof body?.error === "string" ? body.error : null))
          .catch(() => null);
        throw new Error(message ?? `Export failed (${res.status})`);
      }

      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameFrom(res);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Character sheet exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export the sheet");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button variant="outline" onClick={exportSheet} disabled={exporting}>
      <FileDown className="size-4" /> {exporting ? "Exporting…" : "Export PDF"}
    </Button>
  );
}
