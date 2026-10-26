"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";

/** Loads the bundled sample campaign and opens it. */
export function SampleCampaignButton({
  variant = "outline",
}: {
  variant?: "default" | "outline" | "ghost";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function load() {
    setPending(true);
    try {
      const { id } = await api.post<{ id: number }>("/api/campaigns/sample");
      toast.success("Sample campaign loaded — delete it from Settings whenever you like");
      router.push(`/campaign/${id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't load the sample campaign");
      setPending(false);
    }
  }

  return (
    <Button variant={variant} onClick={load} disabled={pending}>
      <BookOpen className="size-4" />
      {pending ? "Loading…" : "Load the sample campaign"}
    </Button>
  );
}
