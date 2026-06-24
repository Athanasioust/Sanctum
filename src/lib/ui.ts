/** Shared Tailwind class mappings for status/relationship/color tokens. */

export function noteColorClasses(color: string): string {
  switch (color) {
    case "purple":
      return "border-primary/40 bg-primary/10";
    case "red":
      return "border-destructive/40 bg-destructive/10";
    case "green":
      return "border-success/50 bg-success/10";
    case "blue":
      return "border-blue-500/40 bg-blue-500/10";
    case "amber":
      return "border-amber-500/40 bg-amber-500/10";
    default:
      return "border-border bg-card";
  }
}

export function relationshipClasses(rel: string): string {
  switch (rel) {
    case "allied":
      return "border-success/40 bg-success/15 text-green-300";
    case "hostile":
      return "border-destructive/40 bg-destructive/15 text-red-300";
    case "neutral":
      return "border-blue-500/40 bg-blue-500/15 text-blue-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function statusClasses(status: string): string {
  switch (status) {
    case "open":
    case "active":
    case "planned":
      return "border-primary/40 bg-primary/15 text-primary";
    case "resolved":
    case "completed":
      return "border-success/40 bg-success/15 text-green-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function rarityClasses(rarity: string): string {
  switch (rarity) {
    case "uncommon":
      return "text-green-400";
    case "rare":
      return "text-blue-400";
    case "very rare":
      return "text-purple-400";
    case "legendary":
      return "text-amber-400";
    case "artifact":
      return "text-orange-400";
    default:
      return "text-muted-foreground";
  }
}

/** HP bar color based on a fraction of max (1 = full). */
export function hpBarColor(fraction: number): string {
  if (fraction <= 0) return "bg-zinc-600";
  if (fraction <= 0.25) return "bg-destructive";
  if (fraction <= 0.5) return "bg-amber-500";
  return "bg-success";
}
