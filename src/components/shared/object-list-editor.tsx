"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Entry = { name: string; description: string };

let keyCounter = 0;
const nextKey = () => `entry-${keyCounter++}`;

/** Editor for a list of { name, description } objects (features, actions, traits). */
export function ObjectListEditor({
  value,
  onChange,
  namePlaceholder = "Name",
  descriptionPlaceholder = "Description",
  addLabel = "Add entry",
}: {
  value: Entry[];
  onChange: (next: Entry[]) => void;
  namePlaceholder?: string;
  descriptionPlaceholder?: string;
  addLabel?: string;
}) {
  // Stable per-row keys so editing/removing a middle row doesn't shuffle React's
  // reconciliation (which with index keys can drop input focus). Kept in sync
  // with `value`, and rebuilt if the array is replaced from outside (form reset).
  const [keys, setKeys] = useState<string[]>(() => value.map(nextKey));
  useEffect(() => {
    setKeys((k) => (k.length === value.length ? k : value.map(nextKey)));
  }, [value.length]);

  function update(index: number, patch: Partial<Entry>) {
    onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }
  function remove(index: number) {
    setKeys((k) => k.filter((_, i) => i !== index));
    onChange(value.filter((_, i) => i !== index));
  }
  function add() {
    setKeys((k) => [...k, nextKey()]);
    onChange([...value, { name: "", description: "" }]);
  }

  return (
    <div className="space-y-3">
      {value.map((entry, i) => (
        <div
          key={keys[i] ?? i}
          className="space-y-2 rounded-lg border border-border bg-muted/30 p-3"
        >
          <div className="flex items-center gap-2">
            <Input
              value={entry.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder={namePlaceholder}
              className="font-medium"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => remove(i)}
              aria-label="Remove"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <Textarea
            value={entry.description}
            onChange={(e) => update(i, { description: e.target.value })}
            placeholder={descriptionPlaceholder}
            rows={2}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </div>
  );
}
