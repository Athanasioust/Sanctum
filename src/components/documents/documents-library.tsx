"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { api } from "@/lib/client";
import type { Document } from "@/db/schema";

// pdf.js is heavy and only needed once a document is opened.
const PdfViewer = dynamic(
  () => import("@/components/documents/pdf-viewer").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border text-sm text-muted-foreground">
        Loading viewer…
      </div>
    ),
  },
);

export function DocumentsLibrary({
  campaignId,
  documents: initial,
}: {
  campaignId: number;
  documents: Document[];
}) {
  const [documents, setDocuments] = useState(initial);
  const [openId, setOpenId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const open = documents.find((d) => d.id === openId) ?? null;

  async function uploadFiles(files: FileList) {
    setUploading(true);
    let added = 0;
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", "document");
        const { url } = await api.upload<{ url: string }>("/api/upload", fd);
        const doc = await api.post<Document>("/api/documents", {
          campaignId,
          name: file.name.replace(/\.pdf$/i, "").slice(0, 200),
          url,
          fileSize: file.size,
        });
        setDocuments((prev) =>
          [...prev, doc].sort((a, b) => a.name.localeCompare(b.name)),
        );
        added++;
      }
      toast.success(`Added ${added} document${added === 1 ? "" : "s"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function rename(id: number, name: string) {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)));
    try {
      await api.patch(`/api/documents/${id}`, { name });
    } catch {
      toast.error("Failed to rename");
    }
  }

  async function remove(id: number) {
    try {
      await api.delete(`/api/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (openId === id) setOpenId(null);
      toast.success("Document removed");
    } catch {
      toast.error("Failed to remove the document");
    }
  }

  if (open) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setOpenId(null)}>
            <ArrowLeft className="size-4" /> All documents
          </Button>
          <h2 className="font-heading text-lg font-semibold">{open.name}</h2>
        </div>
        {/* Keyed by document: a different PDF mounts a fresh viewer. */}
        <PdfViewer key={open.id} url={open.url} name={open.name} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <label className="inline-flex">
          <input
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button asChild disabled={uploading}>
            <span>
              <Upload className="size-4" />
              {uploading ? "Uploading…" : "Upload PDF"}
            </span>
          </Button>
        </label>
        <p className="text-xs text-muted-foreground">
          Adventures, rules references, homebrew documents — read in-app, fully offline.
        </p>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload a PDF to read it inside Sanctum, with page navigation, zoom and search."
        />
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <FileText className="size-5 shrink-0 text-primary" />
              <Input
                value={doc.name}
                onChange={(e) => rename(doc.id, e.target.value)}
                className="h-8 min-w-40 flex-1"
                aria-label="Document name"
              />
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatSize(doc.fileSize)}
              </span>
              <Button size="sm" onClick={() => setOpenId(doc.id)}>
                Read
              </Button>
              <DeleteIconButton
                label="document"
                title={`Remove "${doc.name}"?`}
                description="The PDF file stays on disk; only the entry is removed."
                onConfirm={() => remove(doc.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
