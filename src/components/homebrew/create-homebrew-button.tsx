import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A contextual shortcut to the homebrew tools. Homebrew has its own sidebar
 * entry (Resources), so this is only used where leaving for it mid-task is the
 * point — the character spell picker's "Write your own".
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
