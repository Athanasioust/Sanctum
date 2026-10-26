"use client";

import Link from "next/link";
import { Shield, Heart } from "lucide-react";
import { HpBar } from "@/components/shared/hp-bar";
import { EntityActions } from "@/components/shared/entity-actions";
import {
  BulkToolbar,
  SelectOverlay,
  useBulkDelete,
  useBulkSelection,
} from "@/components/shared/bulk-select";
import { Badge } from "@/components/ui/badge";
import type { Character } from "@/db/schema";

/** The character cards, with select mode for deleting several at once. */
export function CharacterGrid({
  campaignId,
  characters,
}: {
  campaignId: number;
  characters: Character[];
}) {
  const selection = useBulkSelection(characters.map((c) => c.id));
  const deleteMany = useBulkDelete({ entity: "characters", campaignId });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <BulkToolbar selection={selection} total={characters.length} onDelete={deleteMany} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map((c) => {
          const classLine = [c.race, c.class && `${c.class}${c.subclass ? ` (${c.subclass})` : ""}`]
            .filter(Boolean)
            .join(" · ");
          return (
            <div
              key={c.id}
              className="group relative rounded-xl border border-border bg-card transition-colors hover:border-primary/50"
            >
              <Link href={`/campaign/${campaignId}/characters/${c.id}`} className="block p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    {c.portraitUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.portraitUrl}
                        alt=""
                        className="size-10 shrink-0 rounded-full border border-border object-cover"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <h3 className="truncate font-heading text-lg font-semibold">{c.name}</h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {classLine || "Adventurer"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Lv {c.level}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  <HpBar current={c.hpCurrent} max={c.hpMax} temp={c.hpTemp} />
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Shield className="size-4 text-primary" /> AC {c.armorClass}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="size-4 text-destructive" /> {c.hpMax} HP
                    </span>
                  </div>
                </div>
              </Link>
              {selection.selecting ? null : (
                <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <EntityActions
                    editHref={`/campaign/${campaignId}/characters/${c.id}/edit`}
                    deleteEndpoint={`/api/characters/${c.id}`}
                    entityLabel="Character"
                  />
                </div>
              )}
              <SelectOverlay selection={selection} id={c.id} label={c.name} />
            </div>
          );
        })}
      </div>
    </>
  );
}
