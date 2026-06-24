"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";

/** One-click import of the bundled SRD monster templates into the Bestiary. */
export function SeedBestiaryButton({
  campaignId,
  variant = "outline",
}: {
  campaignId: number;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function seed() {
    setPending(true);
    try {
      const res = await api.post<{ added: number; skipped: number }>(
        `/api/campaigns/${campaignId}/seed-bestiary`,
      );
      if (res.added > 0) {
        toast.success(`Added ${res.added} SRD monsters to your Bestiary`);
      } else {
        toast.info("All SRD monsters are already in your Bestiary");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add monsters");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant={variant} onClick={seed} disabled={pending}>
      <Sparkles className="size-4" /> {pending ? "Adding…" : "Add SRD Monsters"}
    </Button>
  );
}
