"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, FolderOpen, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/shared/form";
import { EmptyState } from "@/components/shared/empty-state";
import { api } from "@/lib/client";
import {
  IMPORT_TARGETS,
  describeDoc,
  importTargetLabel,
  parseMarkdownDoc,
  type ImportTarget,
  type ParsedDoc,
} from "@/lib/markdown-import";
import { cn } from "@/lib/utils";

type Row = ParsedDoc & { content: string; target: ImportTarget };

type ImportResult = {
  path: string;
  name: string;
  target: ImportTarget;
  status: "created" | "skipped" | "failed";
  message?: string;
};

const MAX_FILES = 1000;
const MAX_FILE_BYTES = 400_000;
const BATCH_SIZE = 25;
const MD_EXTENSION = /\.(md|markdown|txt)$/i;

export type OwnerOption = { id: number; name: string; type: "character" | "npc" };

export function MarkdownImport({
  campaignId,
  owners,
}: {
  campaignId: number;
  owners: OwnerOption[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [spellOwner, setSpellOwner] = useState<string>("");
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [results, setResults] = useState<ImportResult[] | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  // `webkitdirectory` isn't in React's DOM typings, so set it on the element.
  useEffect(() => {
    const el = folderInput.current;
    if (!el) return;
    el.setAttribute("webkitdirectory", "");
    el.setAttribute("directory", "");
  }, []);

  const counts = useMemo(() => {
    const map = new Map<ImportTarget, number>();
    for (const row of rows) map.set(row.target, (map.get(row.target) ?? 0) + 1);
    return map;
  }, [rows]);

  const spellCount = counts.get("spell") ?? 0;
  const importable = rows.filter((r) => r.target !== "skip");
  const needsOwner = spellCount > 0 && !spellOwner;

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) || r.path.toLowerCase().includes(needle),
    );
  }, [rows, filter]);

  async function readFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setReading(true);
    setResults(null);

    const rejected: string[] = [];
    const next: Row[] = [];
    const files = Array.from(fileList);

    for (const file of files.slice(0, MAX_FILES)) {
      const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      if (!MD_EXTENSION.test(file.name)) continue; // silently ignore vault assets
      if (file.size > MAX_FILE_BYTES) {
        rejected.push(`${path} — larger than 400 KB`);
        continue;
      }
      try {
        const content = await file.text();
        const doc = parseMarkdownDoc(path, content);
        next.push({ ...doc, content, target: doc.detected });
      } catch {
        rejected.push(`${path} — could not be read`);
      }
    }

    if (files.length > MAX_FILES) {
      rejected.push(`Only the first ${MAX_FILES} files were loaded.`);
    }

    setRows(next);
    setSkipped(rejected);
    setReading(false);
    if (next.length === 0) {
      toast.error("No markdown files found in that selection");
    } else {
      toast.success(`Loaded ${next.length} markdown file${next.length === 1 ? "" : "s"}`);
    }
  }

  function setTarget(path: string, target: ImportTarget) {
    setRows((prev) => prev.map((r) => (r.path === path ? { ...r, target } : r)));
  }

  function setAll(target: ImportTarget) {
    const paths = new Set(visible.map((r) => r.path));
    setRows((prev) => prev.map((r) => (paths.has(r.path) ? { ...r, target } : r)));
  }

  function resetDetected() {
    setRows((prev) => prev.map((r) => ({ ...r, target: r.detected })));
  }

  async function runImport() {
    if (importable.length === 0) return;
    if (needsOwner) {
      toast.error("Choose who owns the imported spells");
      return;
    }

    setProgress(0);
    setResults(null);
    const collected: ImportResult[] = [];
    const owner = spellOwner ? JSON.parse(spellOwner) : null;

    try {
      for (let i = 0; i < importable.length; i += BATCH_SIZE) {
        const batch = importable.slice(i, i + BATCH_SIZE);
        const response = await api.post<{ results: ImportResult[] }>("/api/import/markdown", {
          campaignId,
          skipDuplicates,
          spellOwnerId: owner?.id ?? null,
          spellOwnerType: owner?.type ?? null,
          files: batch.map((r) => ({ path: r.path, content: r.content, target: r.target })),
        });
        collected.push(...response.results);
        setProgress(Math.round(((i + batch.length) / importable.length) * 100));
      }

      setResults(collected);
      const created = collected.filter((r) => r.status === "created").length;
      const failed = collected.filter((r) => r.status === "failed").length;
      if (created > 0) {
        toast.success(`Imported ${created} record${created === 1 ? "" : "s"}`);
        router.refresh();
      }
      if (failed > 0) toast.error(`${failed} file${failed === 1 ? "" : "s"} failed`);
      if (created === 0 && failed === 0) toast.info("Everything was already in this campaign");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Import markdown</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring in notes from Obsidian or any other markdown folder. Sanctum reads YAML
          frontmatter and stat-block layouts to guess what each note is — check the guesses
          below and change any that are wrong. This is a one-way copy: your vault is never
          modified, and re-running it later only adds what&apos;s new.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            ref={fileInput}
            type="file"
            accept=".md,.markdown,.txt,text/markdown"
            multiple
            className="hidden"
            onChange={(e) => {
              void readFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={folderInput}
            type="file"
            className="hidden"
            onChange={(e) => {
              void readFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button variant="outline" disabled={reading} onClick={() => fileInput.current?.click()}>
            <FileText className="size-4" /> Choose .md files
          </Button>
          <Button variant="outline" disabled={reading} onClick={() => folderInput.current?.click()}>
            <FolderOpen className="size-4" /> Choose a folder / vault
          </Button>
        </div>
        {reading ? (
          <p className="mt-3 text-sm text-muted-foreground">Reading files…</p>
        ) : null}
      </div>

      {skipped.length > 0 ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-500">
            <AlertTriangle className="size-4" /> {skipped.length} file
            {skipped.length === 1 ? "" : "s"} skipped
          </p>
          <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
            {skipped.slice(0, 10).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="Nothing loaded yet"
          description="Pick individual .md files or point Sanctum at a whole vault folder. Files are read in your browser first so you can review everything before anything is saved."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
            <Field label="Filter" className="min-w-48 flex-1">
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by name or folder…"
              />
            </Field>
            <Field label="Set filtered to">
              <Select onValueChange={(v) => setAll(v as ImportTarget)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Change type…" />
                </SelectTrigger>
                <SelectContent>
                  {IMPORT_TARGETS.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Button variant="ghost" onClick={resetDetected}>
              Reset to detected
            </Button>
            <div className="flex items-center gap-2 pb-1.5">
              <Switch
                id="skip-duplicates"
                checked={skipDuplicates}
                onCheckedChange={setSkipDuplicates}
              />
              <label htmlFor="skip-duplicates" className="text-sm text-muted-foreground">
                Skip names that already exist
              </label>
            </div>
          </div>

          {spellCount > 0 ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <Field
                label="Spells belong to"
                hint="Spells in Sanctum live on a character or NPC, so imported spells need an owner."
                className="max-w-sm"
              >
                <Select value={spellOwner} onValueChange={setSpellOwner}>
                  <SelectTrigger className={cn("w-full", needsOwner && "border-destructive")}>
                    <SelectValue placeholder="Choose a character or NPC…" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem
                        key={`${owner.type}-${owner.id}`}
                        value={JSON.stringify({ id: owner.id, type: owner.type })}
                      >
                        {owner.name} · {owner.type === "character" ? "Character" : "NPC"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {owners.length === 0 ? (
                <p className="mt-2 text-xs text-destructive">
                  This campaign has no characters or NPCs yet — create one first, or import
                  those spell notes as Notes instead.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="max-h-[28rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Note</th>
                    <th className="px-3 py-2 font-medium">Detected</th>
                    <th className="px-3 py-2 font-medium">Import as</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr
                      key={row.path}
                      className={cn(
                        "border-t border-border align-top",
                        row.target === "skip" && "opacity-50",
                      )}
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium">{row.title}</div>
                        <div className="truncate text-xs text-muted-foreground" title={row.path}>
                          {row.path}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {describeDoc(row, row.target)}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={row.confidence === "high" ? "default" : "outline"}>
                          {importTargetLabel(row.detected)}
                        </Badge>
                        <div className="mt-1 text-xs text-muted-foreground">{row.reason}</div>
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={row.target}
                          onValueChange={(v) => setTarget(row.path, v as ImportTarget)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {IMPORT_TARGETS.map((t) => (
                              <SelectItem key={t.key} value={t.key}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {importable.length} of {rows.length} will be imported
              {counts.size > 0 ? (
                <>
                  {" — "}
                  {[...counts.entries()]
                    .filter(([target]) => target !== "skip")
                    .map(([target, n]) => `${n} ${importTargetLabel(target).toLowerCase()}`)
                    .join(", ")}
                </>
              ) : null}
            </p>
            <Button onClick={runImport} disabled={progress !== null || importable.length === 0}>
              <Upload className="size-4" />
              {progress !== null ? "Importing…" : `Import ${importable.length} file${importable.length === 1 ? "" : "s"}`}
            </Button>
          </div>

          {progress !== null ? <Progress value={progress} /> : null}
        </div>
      )}

      {results ? <ImportResults results={results} /> : null}
    </div>
  );
}

function ImportResults({ results }: { results: ImportResult[] }) {
  const created = results.filter((r) => r.status === "created");
  const problems = results.filter((r) => r.status !== "created");

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 font-heading text-lg font-semibold">
        <CheckCircle2 className="size-5 text-primary" /> Import finished
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {created.length} created · {results.filter((r) => r.status === "skipped").length} skipped ·{" "}
        {results.filter((r) => r.status === "failed").length} failed
      </p>
      {problems.length > 0 ? (
        <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-xs">
          {problems.map((r) => (
            <li key={`${r.path}-${r.status}`} className="flex gap-2">
              <span
                className={cn(
                  "shrink-0 font-medium",
                  r.status === "failed" ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {r.status}
              </span>
              <span className="text-muted-foreground">
                {r.name || r.path}
                {r.message ? ` — ${r.message}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
