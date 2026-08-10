"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/client";
import type { FeatEntry, HomebrewFeat } from "@/db/schema";

/**
 * Drops a feat from the campaign's homebrew library onto the sheet, copying its
 * text so later edits to the library don't rewrite an existing character.
 */
export function HomebrewFeatPicker({
  campaignId,
  value,
  onChange,
}: {
  campaignId: number;
  value: FeatEntry[];
  onChange: (next: FeatEntry[]) => void;
}) {
  const [feats, setFeats] = useState<HomebrewFeat[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (feats || loading) return;
    setLoading(true);
    try {
      setFeats(await api.get<HomebrewFeat[]>(`/api/homebrew-feats?campaignId=${campaignId}`));
    } catch {
      setFeats([]);
    } finally {
      setLoading(false);
    }
  }

  function add(id: string) {
    const feat = feats?.find((f) => String(f.id) === id);
    if (!feat) return;
    if (value.some((v) => v.name.toLowerCase() === feat.name.toLowerCase())) {
      toast.info(`${feat.name} is already on this sheet`);
      return;
    }
    onChange([
      ...value,
      {
        name: feat.name,
        description: feat.prerequisite
          ? `Prerequisite: ${feat.prerequisite}\n\n${feat.description}`
          : feat.description,
      },
    ]);
    toast.success(`Added ${feat.name}`);
  }

  return (
    <div className="flex items-center gap-2">
      <FlaskConical className="size-4 shrink-0 text-muted-foreground" />
      <Select value="" onValueChange={add} onOpenChange={(open) => open && load()}>
        <SelectTrigger className="h-8 w-64">
          <SelectValue
            placeholder={loading ? "Loading…" : "Add from your homebrew feats"}
          />
        </SelectTrigger>
        <SelectContent>
          {feats && feats.length > 0 ? (
            feats.map((feat) => (
              <SelectItem key={feat.id} value={String(feat.id)}>
                {feat.name}
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              {feats ? "No homebrew feats yet." : "Loading…"}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
