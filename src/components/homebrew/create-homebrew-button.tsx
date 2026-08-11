import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Entry point to the homebrew tools from the places you'd actually want them —
 * the bestiary, the magic items list, the spell picker.
 *
 * Homebrew isn't a sidebar entry any more; it's reached from the content it
 * creates. The page itself is unchanged and still routed at /homebrew.
 */
export function CreateHomebrewButton({
  campaignId,
  label = "Create homebrew",
  variant = "outline",
  size = "default",
  className,
}: {
  campaignId: number;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  return (
    <Button variant={variant} size={size} className={className} asChild>
      <Link href={`/campaign/${campaignId}/homebrew`}>
        <FlaskConical className="size-4" /> {label}
      </Link>
    </Button>
  );
}
