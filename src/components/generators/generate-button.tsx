"use client";

import { useState } from "react";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useT } from "@/components/i18n/i18n-provider";
import { generatorById } from "@/lib/generators/registry";
import { GeneratorPanel } from "@/components/generators/generator-panel";

/**
 * An inline "Generate …" entry point for a list page, opening one generator
 * in a dialog. Each open starts a fresh result.
 */
export function GenerateButton({
  campaignId,
  generatorId,
  variant = "outline",
  size = "default",
}: {
  campaignId: number;
  generatorId: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [nonce, setNonce] = useState(0);
  const def = generatorById(generatorId);
  if (!def) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setNonce((n) => n + 1);
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <WandSparkles className="size-4" /> {t("gen.generateLabel").replace("{name}", t(def.nameKey))}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <def.icon className="size-5 text-primary" /> {t(def.nameKey)}
          </DialogTitle>
          <DialogDescription>{t(def.descKey)}</DialogDescription>
        </DialogHeader>
        <GeneratorPanel key={nonce} campaignId={campaignId} generatorId={generatorId} />
      </DialogContent>
    </Dialog>
  );
}
