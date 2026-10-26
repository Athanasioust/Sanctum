"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/components/i18n/i18n-provider";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

/**
 * A round portrait with upload / remove. The same image becomes the creature's
 * battle-map token and its avatar in the initiative list.
 */
export function PortraitUpload({
  name,
  url,
  endpoint,
  size = "md",
}: {
  name: string;
  url: string | null;
  /** PATCH target, e.g. `/api/characters/12`. */
  endpoint: string;
  size?: "md" | "lg";
}) {
  const t = useT();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  async function save(portraitUrl: string | null) {
    await api.patch(endpoint, { portraitUrl });
    startRefresh(() => router.refresh());
  }

  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url: uploaded } = await api.upload<{ url: string }>("/api/upload", fd);
      await save(uploaded);
      toast.success(t("portrait.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("portrait.failed"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await save(null);
    } catch {
      toast.error(t("portrait.failed"));
    } finally {
      setBusy(false);
    }
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const dims = size === "lg" ? "size-20" : "size-16";

  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy || refreshing}
        className={cn(
          dims,
          "relative flex items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-muted text-lg font-semibold text-muted-foreground transition-colors hover:border-primary",
        )}
        aria-label={url ? t("portrait.replace") : t("portrait.upload")}
        title={url ? t("portrait.replace") : t("portrait.upload")}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="size-full object-cover" />
        ) : (
          <span>{initials || "?"}</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <ImagePlus className="size-5 text-white" />
        </span>
      </button>
      {url ? (
        <button
          type="button"
          onClick={remove}
          disabled={busy || refreshing}
          className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={t("portrait.remove")}
          title={t("portrait.remove")}
        >
          <X className="size-3" />
        </button>
      ) : null}
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
