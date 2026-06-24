"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Trash2, MapPin, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api } from "@/lib/client";
import type { Campaign } from "@/db/schema";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    try {
      await api.delete(`/api/campaigns/${campaign.id}`);
      toast.success("Campaign deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete campaign");
    }
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/50">
      <Link
        href={`/campaign/${campaign.id}`}
        className="flex flex-1 flex-col gap-3 p-5"
      >
        <div className="flex h-24 w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 via-primary/10 to-transparent">
          <span className="font-heading text-3xl font-semibold text-primary/80">
            {campaign.name.slice(0, 1).toUpperCase() || "?"}
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="line-clamp-1 font-heading text-lg font-semibold">
            {campaign.name}
          </h3>
          {campaign.setting ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              <span className="line-clamp-1">{campaign.setting}</span>
            </p>
          ) : null}
          {campaign.description ? (
            <p className="line-clamp-2 pt-1 text-sm text-muted-foreground">
              {campaign.description}
            </p>
          ) : null}
        </div>
        <p className="mt-auto pt-2 text-xs text-muted-foreground">
          Updated {formatDistanceToNow(campaign.updatedAt, { addSuffix: true })}
        </p>
      </Link>

      <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="size-8"
              aria-label="Campaign actions"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/campaign/${campaign.id}/settings`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                setConfirmOpen(true);
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${campaign.name}"?`}
        description="This permanently deletes the campaign and everything in it — characters, NPCs, encounters, locations, notes and more. This cannot be undone."
        confirmLabel="Delete campaign"
        onConfirm={handleDelete}
      />
    </div>
  );
}
