"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";

export function ImportCampaignButton({
  variant = "outline",
}: {
  variant?: "outline" | "ghost";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleFile(file: File) {
    setPending(true);
    try {
      const text = await file.text();
      let bundle: unknown;
      try {
        bundle = JSON.parse(text);
      } catch {
        throw new Error("That file isn't valid JSON.");
      }
      const { id } = await api.post<{ id: number }>("/api/campaigns/import", bundle);
      toast.success("Campaign imported");
      router.push(`/campaign/${id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import campaign");
    } finally {
      setPending(false);
    }
  }

  return (
    <label className="inline-flex">
      <input
        type="file"
        accept="application/json,.json"
        className="hidden"
        disabled={pending}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <Button asChild variant={variant} disabled={pending}>
        <span>
          <Upload className="size-4" /> {pending ? "Importing…" : "Import"}
        </span>
      </Button>
    </label>
  );
}
