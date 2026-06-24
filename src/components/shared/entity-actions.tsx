"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
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

/**
 * Reusable Edit/Delete actions menu for an entity. After deleting it either
 * redirects (e.g. back to a list) or refreshes the current route.
 */
export function EntityActions({
  editHref,
  deleteEndpoint,
  entityLabel,
  redirectTo,
  size = "icon",
  align = "end",
}: {
  editHref?: string;
  deleteEndpoint: string;
  entityLabel: string;
  redirectTo?: string;
  size?: "icon" | "sm";
  align?: "start" | "end";
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    try {
      await api.delete(deleteEndpoint);
      toast.success(`${entityLabel} deleted`);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {size === "icon" ? (
            <Button size="icon" variant="secondary" className="size-8" aria-label="Actions">
              <MoreVertical className="size-4" />
            </Button>
          ) : (
            <Button size="sm" variant="outline">
              <MoreVertical className="size-4" />
              Actions
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          {editHref ? (
            <DropdownMenuItem asChild>
              <Link href={editHref}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          ) : null}
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete this ${entityLabel.toLowerCase()}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  );
}
