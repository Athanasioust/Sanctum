"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api } from "@/lib/client";

export function DangerZone({
  campaignId,
  campaignName,
}: {
  campaignId: number;
  campaignName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function deleteCampaign() {
    try {
      await api.delete(`/api/campaigns/${campaignId}`);
      toast.success("Campaign deleted");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete campaign");
    }
  }

  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
      <h3 className="font-heading text-lg font-semibold text-destructive">Danger zone</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently delete this campaign and everything in it. Consider exporting first.
      </p>
      <Button variant="destructive" className="mt-4" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" /> Delete campaign
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete "${campaignName}"?`}
        description="This permanently deletes the campaign and all of its characters, NPCs, encounters, locations, story, factions, shops, sessions and notes. This cannot be undone."
        confirmLabel="Delete campaign"
        onConfirm={deleteCampaign}
      />
    </div>
  );
}
