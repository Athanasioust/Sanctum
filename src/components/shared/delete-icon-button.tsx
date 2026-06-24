"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";

/**
 * Standard destructive icon button: a ghost trash button that always asks for
 * confirmation before running `onConfirm`. Use this for inline row/list deletes
 * so every destructive action across the app behaves and looks the same.
 */
export function DeleteIconButton({
  onConfirm,
  label = "item",
  title,
  description = "This cannot be undone.",
  buttonClassName,
}: {
  onConfirm: () => void | Promise<void>;
  /** Lowercase noun used in the default confirm title and aria-label. */
  label?: string;
  title?: string;
  description?: React.ReactNode;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={cn("size-8 text-muted-foreground hover:text-destructive", buttonClassName)}
        onClick={() => setOpen(true)}
        aria-label={`Delete ${label}`}
      >
        <Trash2 className="size-4" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title ?? `Delete this ${label}?`}
        description={description}
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />
    </>
  );
}
