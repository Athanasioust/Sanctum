import { ExternalLink } from "lucide-react";

/**
 * The frame of a pop-out window: just a title strip and the panel, no sidebar.
 * Meant for a second monitor beside the main window.
 */
export function PopoutShell({
  campaignName,
  title,
  children,
}: {
  campaignName: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background px-3 py-3 sm:px-5">
      <header className="mb-4 flex items-center gap-2 border-b border-border pb-2 text-sm">
        <ExternalLink className="size-3.5 text-primary" />
        <span className="font-heading font-semibold">{title}</span>
        <span className="truncate text-muted-foreground">· {campaignName}</span>
      </header>
      {children}
    </main>
  );
}
