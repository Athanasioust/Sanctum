import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { format, formatDistanceToNow } from "date-fns";
import {
  Users,
  Skull,
  ClipboardList,
  Network,
  CalendarDays,
  StickyNote,
  ArrowRight,
  ScrollText,
  Monitor,
  ListTodo,
} from "lucide-react";
import { db } from "@/db";
import {
  campaigns,
  characters,
  npcs,
  sessionPreps,
  storyEvents,
  notes as notesTable,
  quests,
} from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CAMPAIGN_NAV } from "@/lib/nav";
import { STORY_EVENT_TYPES } from "@/lib/constants";
import { noteColorClasses } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));

  const [
    [{ value: charCount }],
    [{ value: npcCount }],
    [{ value: sessionCount }],
    [{ value: plotCount }],
    pinnedNotes,
    recentEvents,
    activeQuests,
  ] = await Promise.all([
    db.select({ value: count() }).from(characters).where(eq(characters.campaignId, id)),
    db
      .select({ value: count() })
      .from(npcs)
      .where(and(eq(npcs.campaignId, id), eq(npcs.isTemplate, false))),
    db
      .select({ value: count() })
      .from(sessionPreps)
      .where(eq(sessionPreps.campaignId, id)),
    db
      .select({ value: count() })
      .from(storyEvents)
      .where(
        and(
          eq(storyEvents.campaignId, id),
          eq(storyEvents.eventType, "plot_thread"),
          eq(storyEvents.status, "open"),
        ),
      ),
    db
      .select()
      .from(notesTable)
      .where(and(eq(notesTable.campaignId, id), eq(notesTable.isPinned, true)))
      .orderBy(desc(notesTable.updatedAt))
      .limit(6),
    db
      .select()
      .from(storyEvents)
      .where(eq(storyEvents.campaignId, id))
      .orderBy(desc(storyEvents.createdAt))
      .limit(6),
    db
      .select({ id: quests.id, title: quests.title, status: quests.status })
      .from(quests)
      .where(and(eq(quests.campaignId, id), eq(quests.status, "active")))
      .limit(5),
  ]);

  const stats = [
    { label: "Players", value: charCount, icon: Users, href: `/campaign/${id}/characters` },
    { label: "NPCs & Monsters", value: npcCount, icon: Skull, href: `/campaign/${id}/npcs` },
    { label: "Sessions", value: sessionCount, icon: ClipboardList, href: `/campaign/${id}/sessions` },
    { label: "Open Plot Threads", value: plotCount, icon: Network, href: `/campaign/${id}/story` },
  ];

  const quickLinks = CAMPAIGN_NAV.filter(
    (n) => n.segment !== null && n.segment !== "settings",
  );

  // For real-world calendars the current date comes straight from the system
  // clock; only custom in-world calendars use a DM-entered date.
  const inWorldDate =
    campaign?.inWorldCalendarType === "custom"
      ? campaign.currentInWorldDate || "Not set"
      : format(new Date(), "PPP");

  return (
    <PageContainer>
      {/* Hero */}
      <div className="mb-8 rounded-2xl border border-border bg-gradient-to-br from-primary/12 via-card to-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {campaign?.name}
            </h1>
            {campaign?.setting ? (
              <p className="mt-1 text-muted-foreground">{campaign.setting}</p>
            ) : null}
            {campaign?.description ? (
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                {campaign.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3.5 py-2.5">
              <CalendarDays className="size-4 text-primary" />
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">In-world date</p>
                <p className="font-medium">{inWorldDate}</p>
              </div>
            </div>
            <a
              href={`/screen/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Monitor className="size-3.5" /> Open player view
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-center gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <s.icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Active quests */}
      {activeQuests.length > 0 && (
        <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-blue-300">
              <ListTodo className="size-4" /> Active Quests
            </h2>
            <Link href={`/campaign/${id}/quests`} className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <ul className="flex flex-wrap gap-2">
            {activeQuests.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/campaign/${id}/quests`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300 hover:bg-blue-500/20 transition-colors"
                >
                  {q.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent events */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="size-4 text-primary" /> Recent Story Events
            </CardTitle>
            <Link
              href={`/campaign/${id}/story`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No story events yet. Log your first session on the Story page.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentEvents.map((ev) => {
                  const type = STORY_EVENT_TYPES.find((t) => t.key === ev.eventType);
                  return (
                    <li key={ev.id} className="flex items-start gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{ev.title}</p>
                        {ev.description ? (
                          <p className="line-clamp-1 text-sm text-muted-foreground">
                            {ev.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant="secondary">{type?.label ?? ev.eventType}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(ev.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Pinned notes */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="size-4 text-primary" /> Pinned Notes
            </CardTitle>
            <Link
              href={`/campaign/${id}/notes`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {pinnedNotes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No pinned notes. Pin notes to keep them here.
              </p>
            ) : (
              <ul className="space-y-2">
                {pinnedNotes.map((note) => (
                  <li
                    key={note.id}
                    className={`rounded-lg border p-3 ${noteColorClasses(note.color)}`}
                  >
                    <p className="truncate text-sm font-medium">
                      {note.title || "Untitled note"}
                    </p>
                    {note.content ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {note.content}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick access */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Quick access
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href(id)}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <item.icon className="size-5 text-primary" />
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
