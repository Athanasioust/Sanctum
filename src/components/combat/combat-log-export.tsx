"use client";

import { ClipboardCopy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";
import { formatCombatLog, logFileName, type LogFormat } from "@/lib/combat-log-export";
import type { CombatLogEntry } from "@/db/schema";

/** Clipboard with a fallback for plain-http origins (a LAN address), where the API is off. */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("copy failed");
  }
}

function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Copy or save an encounter's combat log. Pass `entries` when they're already
 * loaded (the live tracker); otherwise they're fetched on demand (a past fight).
 */
export function CombatLogExport({
  encounterId,
  encounterName,
  entries,
  size = "sm",
}: {
  encounterId: number;
  encounterName: string;
  entries?: CombatLogEntry[];
  size?: "sm" | "icon";
}) {
  const t = useT();

  async function load() {
    return entries ?? (await api.get<CombatLogEntry[]>(`/api/combat-log?encounterId=${encounterId}`));
  }

  async function copy() {
    try {
      await copyText(formatCombatLog(await load(), encounterName, "md"));
      toast.success(t("log.copied"));
    } catch {
      toast.error(t("log.failed"));
    }
  }

  async function save(as: LogFormat) {
    try {
      const text = formatCombatLog(await load(), encounterName, as);
      download(text, logFileName(encounterName, as), as === "md" ? "text/markdown" : "text/plain");
    } catch {
      toast.error(t("log.failed"));
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size={size}
        onClick={copy}
        aria-label={t("log.copy")}
        title={t("log.copy")}
      >
        <ClipboardCopy className="size-4" />
        {size === "sm" ? t("log.copyShort") : null}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size} aria-label={t("log.export")} title={t("log.export")}>
            <Download className="size-4" />
            {size === "sm" ? t("log.exportShort") : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => save("md")}>Markdown (.md)</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => save("txt")}>{t("log.plainText")} (.txt)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
