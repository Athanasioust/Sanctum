"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <TriangleAlert className="size-7" />
      </div>
      <div>
        <h1 className="font-heading text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
