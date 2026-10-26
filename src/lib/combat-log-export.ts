import { format } from "date-fns";
import type { CombatLogEntry } from "@/db/schema";

export type LogFormat = "md" | "txt";

/**
 * A combat log as a readable document, grouped by round with a timestamp on
 * every line — for pasting into session notes or a group chat after a fight.
 */
export function formatCombatLog(
  entries: Pick<CombatLogEntry, "round" | "actorName" | "action" | "details" | "createdAt">[],
  encounterName: string,
  as: LogFormat,
): string {
  const sorted = [...entries].sort(
    (a, b) => a.round - b.round || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const out: string[] = [];
  const title = `Combat log — ${encounterName}`;
  const stamp = format(new Date(), "yyyy-MM-dd HH:mm");
  if (as === "md") out.push(`# ${title}`, "", `_Exported ${stamp}_`);
  else out.push(title, `Exported ${stamp}`);

  if (sorted.length === 0) {
    out.push("", as === "md" ? "_No entries._" : "No entries.");
    return out.join("\n") + "\n";
  }

  let round = -1;
  for (const e of sorted) {
    if (e.round !== round) {
      round = e.round;
      out.push("", as === "md" ? `## Round ${round}` : `Round ${round}`);
    }
    const time = format(new Date(e.createdAt), "HH:mm:ss");
    const what = e.details ? `${e.action} — ${e.details}` : e.action;
    if (as === "md") {
      out.push(`- ${time} — ${e.actorName ? `**${e.actorName}**: ` : ""}${what}`);
    } else {
      out.push(`[${time}] ${e.actorName ? `${e.actorName}: ` : ""}${what}`);
    }
  }
  return out.join("\n") + "\n";
}

/** A filesystem-friendly name for the export, e.g. "ambush-in-the-crypt-log.md". */
export function logFileName(encounterName: string, as: LogFormat): string {
  const slug =
    encounterName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "encounter";
  return `${slug}-log.${as}`;
}
