"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Link2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";
import { ATLAS_LINK_LABEL_KEYS, type AtlasLinkable } from "@/lib/atlas/links";
import { ATLAS_LINK_TYPES, type AtlasLinkType } from "@/lib/atlas/link-types";
import { cn } from "@/lib/utils";

/** Search every linkable record in the campaign and pick one (or clear the link). */
export function RecordPicker({
  value,
  records,
  onChange,
}: {
  value: { type: AtlasLinkType; id: number } | null;
  records: AtlasLinkable[];
  onChange: (next: { type: AtlasLinkType; id: number } | null) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = value ? records.find((r) => r.type === value.type && r.id === value.id) : null;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ATLAS_LINK_TYPES.map((type) => ({
      type,
      rows: records
        .filter((r) => r.type === type && (!q || r.name.toLowerCase().includes(q)))
        .slice(0, 30),
    })).filter((g) => g.rows.length > 0);
  }, [records, query]);

  return (
    <div className="flex items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm hover:border-primary/50"
          >
            <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
            <span className={cn("truncate", !current && "text-muted-foreground")}>
              {current
                ? `${t(ATLAS_LINK_LABEL_KEYS[current.type])}: ${current.name}`
                : value
                  ? t("atlas.linkMissing")
                  : t("atlas.linkNone")}
            </span>
            <ChevronDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("atlas.searchRecords")}
            className="mb-2 h-8"
            autoFocus
          />
          <div className="max-h-72 overflow-y-auto">
            {groups.length === 0 ? (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">{t("atlas.noMatches")}</p>
            ) : (
              groups.map((g) => (
                <div key={g.type} className="mb-1">
                  <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t(ATLAS_LINK_LABEL_KEYS[g.type])}
                  </p>
                  {g.rows.map((r) => (
                    <button
                      key={`${r.type}:${r.id}`}
                      type="button"
                      onClick={() => {
                        onChange({ type: r.type, id: r.id });
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "block w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted",
                        value?.type === r.type && value.id === r.id && "bg-primary/15 text-primary",
                      )}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      {value ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-9"
          onClick={() => onChange(null)}
          aria-label={t("atlas.unlink")}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
