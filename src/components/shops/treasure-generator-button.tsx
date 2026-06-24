"use client";

import { useState } from "react";
import { Coins, Dices, Gem, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  generateTreasure,
  TREASURE_TIERS,
  type GeneratedTreasure,
  type TreasureTier,
} from "@/lib/generators";

/** Quick treasure hoard by party tier — coins, valuables and the odd item. */
export function TreasureGeneratorButton() {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<TreasureTier>("1-4");
  const [result, setResult] = useState<GeneratedTreasure | null>(null);

  function gen(t: TreasureTier) {
    setTier(t);
    setResult(generateTreasure(t));
  }

  const coins = result
    ? (["pp", "gp", "sp", "cp"] as const)
        .filter((k) => result.coins[k] > 0)
        .map((k) => `${result.coins[k].toLocaleString()} ${k}`)
    : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && !result) gen(tier);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Gem className="size-4" /> Generate treasure
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Treasure hoard</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <Select value={tier} onValueChange={(v) => gen(v as TreasureTier)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TREASURE_TIERS.map((t) => (
                <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {result ? (
            <div className="space-y-3 text-sm">
              <Section icon={Coins} title="Coins">
                {coins.length ? (
                  <p className="font-medium tabular-nums">{coins.join(" · ")}</p>
                ) : (
                  <p className="text-muted-foreground">No coins.</p>
                )}
              </Section>
              <Section icon={Gem} title="Valuables">
                {result.valuables.length ? (
                  <ul className="list-inside list-disc space-y-0.5">
                    {result.valuables.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">None this time.</p>
                )}
              </Section>
              <Section icon={Sparkles} title="Items">
                {result.items.length ? (
                  <ul className="list-inside list-disc space-y-0.5">
                    {result.items.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">None this time.</p>
                )}
              </Section>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button onClick={() => gen(tier)}>
            <Dices className="size-4" /> Reroll hoard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
        <Icon className="size-3.5" /> {title}
      </p>
      {children}
    </div>
  );
}
