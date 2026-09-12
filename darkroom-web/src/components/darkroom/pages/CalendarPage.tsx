import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calendarApi } from "@/services/api/calendar";
import { CALENDAR_EVENT_TYPE_LABELS, type CalendarEntry, type CalendarEventType } from "@/types";

import { AppShell } from "../AppShell";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricBlock,
  PageHeader,
  Panel,
  formatDate,
} from "../Primitives";
import { normalizeId } from "../workbench/shared";
import { calendarQueryKey } from "./page-query-keys";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthRange(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  return {
    start,
    end,
    from: toDateInputValue(start),
    to: toDateInputValue(end),
  };
}

function shiftMonth(month: Date, offset: number) {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1);
}

function monthTitle(month: Date) {
  return month.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function calendarGridDays(month: Date) {
  const { start, end } = monthRange(month);
  const firstVisible = new Date(start);
  firstVisible.setDate(start.getDate() - start.getDay());
  const lastVisible = new Date(end);
  lastVisible.setDate(end.getDate() + (6 - end.getDay()));

  const days: Date[] = [];
  for (const day = new Date(firstVisible); day <= lastVisible; day.setDate(day.getDate() + 1)) {
    days.push(new Date(day));
  }

  return days;
}

export function CalendarPage() {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const range = useMemo(() => monthRange(visibleMonth), [visibleMonth]);
  const days = useMemo(() => calendarGridDays(visibleMonth), [visibleMonth]);
  const calendar = useQuery({
    queryKey: calendarQueryKey(range.from, range.to),
    queryFn: () => calendarApi.getCalendar(range.from, range.to),
  });
  const entries = useMemo(() => calendar.data ?? [], [calendar.data]);
  const entriesByDate = useMemo(() => groupCalendarEntriesByDate(entries), [entries]);
  const releaseCount = entries.filter((entry) => entry.eventType === "ReleaseDate").length;
  const dueCount = entries.filter((entry) => entry.eventType === "ContentDue").length;
  const scheduledCount = entries.filter((entry) => entry.eventType === "ContentScheduled").length;

  return (
    <AppShell>
      <PageHeader eyebrow="Calendar" title="Campaign schedule">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => setVisibleMonth((current) => shiftMonth(current, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setVisibleMonth(shiftMonth(new Date(), 0))}>
            Current month
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricBlock label="This month" value={String(entries.length)} />
        <MetricBlock label="Releases" value={String(releaseCount)} />
        <MetricBlock label="Content due" value={String(dueCount)} />
        <MetricBlock label="Scheduled content" value={String(scheduledCount)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <Panel title={monthTitle(visibleMonth)} label="Real backend data">
          {calendar.isLoading ? (
            <LoadingState label="Loading calendar" />
          ) : calendar.isError ? (
            <ErrorState
              detail="Calendar entries could not be loaded from the backend."
              onRetry={() => calendar.refetch()}
            />
          ) : (
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                <p key={dayName} className="label-tech px-1 py-2 text-center">
                  {dayName}
                </p>
              ))}
              {days.map((day) => {
                const dateKey = toDateInputValue(day);
                const dayEntries = entriesByDate.get(dateKey) ?? [];
                const inMonth = day.getMonth() === visibleMonth.getMonth();

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "min-h-28 border border-border bg-background p-2 text-left",
                      !inMonth && "opacity-40",
                    )}
                  >
                    <p className="meta-tech">{day.getDate()}</p>
                    <div className="mt-2 space-y-1">
                      {dayEntries.slice(0, 3).map((entry) => (
                        <CalendarEntryChip key={calendarEntryKey(entry)} entry={entry} />
                      ))}
                      {dayEntries.length > 3 ? (
                        <p className="text-[10px] text-muted-foreground">
                          +{dayEntries.length - 3} more
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
        <Panel title="Agenda" label="Real backend data">
          {calendar.isLoading ? (
            <LoadingState label="Loading agenda" />
          ) : calendar.isError ? (
            <ErrorState
              detail="Agenda could not be loaded from the backend."
              onRetry={() => calendar.refetch()}
            />
          ) : entries.length ? (
            <div className="space-y-3">
              {entries.map((entry) => (
                <Link
                  key={calendarEntryKey(entry)}
                  to="/songs/$songId"
                  params={{ songId: normalizeId(entry.songId) }}
                  className="block border-b border-border pb-3 last:border-0"
                >
                  <p className="label-tech">{calendarEventLabel(entry.eventType)}</p>
                  <p className="mt-1 text-sm font-medium">{entry.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(entry.date)} / {entry.songTitle}
                    {entry.platform ? ` / ${entry.platform}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.status} / Open Song</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No planning dates this month"
              detail="Release dates and Content due, scheduled, or published dates will appear here when they exist."
            />
          )}
          <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
            Calendar reads Release and Content metadata. Google Calendar sync, reminders, and
            drag/drop rescheduling are planned for later milestones.
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}

function CalendarEntryChip({ entry }: { entry: CalendarEntry }) {
  return (
    <Link
      to="/songs/$songId"
      params={{ songId: normalizeId(entry.songId) }}
      className={cn(
        "block truncate border px-1.5 py-1 text-[10px] uppercase text-foreground",
        entry.eventType === "ReleaseDate"
          ? "border-foreground bg-foreground text-background"
          : "border-border",
      )}
      title={`${calendarEventLabel(entry.eventType)} / ${entry.title} / ${entry.songTitle}`}
    >
      {calendarEventLabel(entry.eventType)}
    </Link>
  );
}

function groupCalendarEntriesByDate(entries: CalendarEntry[]) {
  return entries.reduce((grouped, entry) => {
    const dateEntries = grouped.get(entry.date) ?? [];
    dateEntries.push(entry);
    grouped.set(entry.date, dateEntries);
    return grouped;
  }, new Map<string, CalendarEntry[]>());
}

function calendarEntryKey(entry: CalendarEntry) {
  return `${entry.sourceType}-${entry.sourceId}-${entry.eventType}-${entry.date}`;
}

function calendarEventLabel(eventType: CalendarEventType) {
  return CALENDAR_EVENT_TYPE_LABELS[eventType];
}
