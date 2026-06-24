import { desc, eq } from "drizzle-orm";
import { Calendar as CalendarIcon } from "lucide-react";
import { db } from "@/db";
import { campaigns, calendarEvents } from "@/db/schema";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { CalendarClient } from "@/components/calendar/calendar-client";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaignId = Number((await params).id);
  const [[campaign], events] = await Promise.all([
    db.select().from(campaigns).where(eq(campaigns.id, campaignId)),
    db.select().from(calendarEvents).where(eq(calendarEvents.campaignId, campaignId)).orderBy(desc(calendarEvents.createdAt)),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        description="Festivals, deadlines and events across your world."
        icon={CalendarIcon}
      />
      <CalendarClient
        campaignId={campaignId}
        calendarType={campaign?.inWorldCalendarType ?? "real"}
        customConfig={campaign?.customCalendarConfig ?? null}
        initialEvents={events}
        initialInWorldDate={campaign?.currentInWorldDate ?? null}
      />
    </PageContainer>
  );
}
