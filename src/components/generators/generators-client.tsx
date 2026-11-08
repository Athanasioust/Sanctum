"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useT } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { GENERATORS, generatorById } from "@/lib/generators/registry";

// Results are random, so they're rolled in the browser only — a server-rendered
// roll would never match the client's and React would throw away the HTML.
const GeneratorPanel = dynamic(
  () => import("@/components/generators/generator-panel").then((m) => m.GeneratorPanel),
  { ssr: false },
);

/** The Generators page: the list of generators beside the selected one. */
export function GeneratorsClient({
  campaignId,
  initialId,
}: {
  campaignId: number;
  initialId?: string | null;
}) {
  const t = useT();
  const [activeId, setActiveId] = useState(
    initialId && generatorById(initialId) ? initialId : GENERATORS[0].id,
  );
  const active = generatorById(activeId)!;

  return (
    <div className="grid gap-5 md:grid-cols-[14rem_1fr]">
      <nav aria-label={t("gen.listLabel")} className="flex gap-1 overflow-x-auto md:flex-col">
        {GENERATORS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActiveId(g.id)}
            aria-current={g.id === activeId ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              g.id === activeId ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted",
            )}
          >
            <g.icon className="size-4 shrink-0" />
            {t(g.nameKey)}
          </button>
        ))}
      </nav>
      <section className="min-w-0 space-y-3">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold">
            <active.icon className="size-5 text-primary" /> {t(active.nameKey)}
          </h2>
          <p className="text-sm text-muted-foreground">{t(active.descKey)}</p>
        </div>
        {/* Keyed so switching generator starts a fresh result. */}
        <GeneratorPanel key={active.id} campaignId={campaignId} generatorId={active.id} />
      </section>
    </div>
  );
}
