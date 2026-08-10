"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Swords } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useCampaignOptions } from "@/components/campaigns/campaign-options-context";
import { api } from "@/lib/client";
import { classLevels } from "@/lib/spell-slot-sync";
import {
  WEAPON_MASTERIES,
  hasWeaponMastery,
  masteryCount,
  uses2024Rules,
} from "@/lib/weapon-mastery";
import { cn } from "@/lib/utils";
import type { Character, MulticlassEntry } from "@/db/schema";

/**
 * 2024 weapon mastery picker.
 *
 * Renders only when the campaign has the 2024 Player's Handbook ticked in
 * settings and the character has a class with the Weapon Mastery feature, so a
 * 2014 table never sees it.
 */
export function WeaponMasterySection({ character }: { character: Character }) {
  const router = useRouter();
  const { rulebooks } = useCampaignOptions();
  const [pending, setPending] = useState(false);
  const [chosen, setChosen] = useState<string[]>(character.weaponMasteries ?? []);

  const classes = classLevels(
    character.class,
    character.level,
    (character.multiclassInfo ?? []) as MulticlassEntry[],
  ).filter((c) => hasWeaponMastery(c.className));

  if (!uses2024Rules(rulebooks) || classes.length === 0) return null;

  // Multiclassing grants Weapon Mastery from each class separately rather than
  // pooling, so the character's allowance is the largest single-class grant.
  const best = classes.reduce<{ count: number; className: string; level: number }>(
    (top, c) => {
      const count = masteryCount(c.className, c.level);
      return count > top.count ? { count, className: c.className, level: c.level } : top;
    },
    { count: 0, className: "", level: 0 },
  );

  if (best.count === 0) return null;

  async function toggle(name: string) {
    const next = chosen.includes(name)
      ? chosen.filter((m) => m !== name)
      : [...chosen, name];
    if (next.length > best.count) {
      toast.error(`${best.className} ${best.level} knows ${best.count} mastery properties.`);
      return;
    }
    setChosen(next);
    setPending(true);
    try {
      await api.patch(`/api/characters/${character.id}`, { weaponMasteries: next });
      router.refresh();
    } catch {
      setChosen(chosen);
      toast.error("Failed to save weapon masteries");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Swords className="size-4 text-primary" />
        <h3 className="font-medium">Weapon Mastery</h3>
        <Badge variant="secondary">2024</Badge>
        <span className="ml-auto text-sm text-muted-foreground">
          {chosen.length} / {best.count} chosen
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        {best.className} {best.level} knows {best.count} mastery{" "}
        {best.count === 1 ? "property" : "properties"}.
      </p>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {WEAPON_MASTERIES.map((mastery) => {
          const active = chosen.includes(mastery.name);
          const full = !active && chosen.length >= best.count;
          return (
            <button
              key={mastery.name}
              type="button"
              disabled={pending || full}
              onClick={() => toggle(mastery.name)}
              title={mastery.effect}
              className={cn(
                "rounded-lg border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                active ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
              )}
            >
              <p className="text-sm font-medium">{mastery.name}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{mastery.effect}</p>
              <p className="mt-1 truncate text-[10px] text-muted-foreground">
                {mastery.weapons.join(", ")}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
