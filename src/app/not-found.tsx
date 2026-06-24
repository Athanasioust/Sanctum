import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="size-7" />
      </div>
      <div>
        <h1 className="font-heading text-2xl font-semibold">Lost in the mist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We couldn&apos;t find that page.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Back to campaigns</Link>
      </Button>
    </div>
  );
}
