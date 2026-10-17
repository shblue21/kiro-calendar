import { calendarColor, itemColor, itemLocation, locationLabel } from "./location.ts";
import type { CivilDate } from "../calendar/dates.ts";
import { civilDate, dateKey, dayOffset, shift } from "../calendar/dates.ts";
import { dayBounds, intervalLabels, zonedInput } from "../calendar/time.ts";
import type { CalendarViewItem } from "../calendar/types.ts";
import { t } from "../i18n/index.ts";
import type { CalendarEvent, CalendarItem, Connection } from "./types.ts";
import { eventEnd } from "./eventFields.ts";
/** Split source intervals into day cells; provider identifiers never become relative dates. */
export function eventItems(
  event: CalendarEvent,
  base: CivilDate,
  range: {
    first: number;
    end: number;
  },
  zone: string,
): CalendarViewItem[] {
  const start = new Date(event.start),
    end = new Date(event.end);
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || end <= start) return [];
  const startWall = zonedInput(start, zone);
  const interval = {
    startDate: event.allDay ? event.startDate : startWall.slice(0, 10),
    endDate: event.allDay
      ? dateKey(shift(civilDate(event.endDate), -1))
      : zonedInput(end, zone).slice(0, 10),
    timeLabels: event.allDay ? undefined : intervalLabels(+start, +end, zone),
  };
  const first = event.allDay
    ? dayOffset(event.startDate, base)
    : dayOffset(startWall.slice(0, 10), base);
  const last = event.allDay
    ? dayOffset(event.endDate, base) - 1
    : dayOffset(zonedInput(new Date(+end - 1), zone).slice(0, 10), base);
  const occurrenceKey = JSON.stringify([
    "event",
    event.connectionId ?? null,
    event.calendarId,
    event.eventId,
    start.getTime(),
  ]);
  const rows: CalendarViewItem[] = [];
  for (
    let day = Math.max(first, range.first);
    day <= Math.min(last, range.end - 1);
    day++
  ) {
    const bounds = dayBounds(dateKey(shift(base, day)), zone);
    if (bounds.durationMinutes === 0) continue;
    const segmentStart = Math.max(+start, bounds.startMs),
      segmentEnd = Math.min(+end, bounds.endMs);
    if (!event.allDay && segmentEnd <= segmentStart) continue;
    rows.push({
      id: `event:${JSON.stringify([event.connectionId ?? null, event.calendarId, event.eventId, event.start, day])}`,
      occurrenceKey,
      day,
      title: event.title,
      start: event.allDay ? 0 : (segmentStart - bounds.startMs) / 60000,
      end: event.allDay ? undefined : (segmentEnd - bounds.startMs) / 60000,
      timeLabels: event.allDay
        ? undefined
        : intervalLabels(segmentStart, segmentEnd, zone, bounds.endMs),
      interval,
      allDay: event.allDay,
      source: "",
      calendarColor: calendarColor(event.calendarColor),
      calendarLocation: locationLabel(event.connectionName, {
        title: event.calendarTitle,
        sourceTitle: event.sourceTitle,
      }),
      description: event.notes,
      storage: "external",
      itemId: event.itemId,
      providerEvent: event,
    });
  }
  return rows;
}
/** Record identity survives proposal acceptance; confirmed external events come from the provider. */
export function calendarItems(
  records: CalendarItem[],
  base: CivilDate,
  range: { first: number; end: number },
  zone: string,
  showCrew: boolean,
  connections: readonly Connection[] = [],
): CalendarViewItem[] {
  return records
    .filter((d) => !d.deletedAt && d.status !== "dismissed")
    .flatMap((d) => {
      const proposed = d.status === "proposed";
      const local = d.destination.connectionId === "crew";
      if (
        proposed
          ? d.delivery?.state === "confirmed"
          : d.externalRef || (local && !showCrew)
      )
        return [];
      if (!Number.isFinite(Date.parse(d.start))) return [];
      return eventItems(
        {
          eventId: d.id,
          calendarId: proposed ? "drafts" : "default",
          title: d.title,
          start: d.start,
          end: eventEnd(d),
          allDay: false,
          startDate: "",
          endDate: "",
          timezone: d.timezone,
          calendarTitle: proposed ? t("common.draft") : "Crew Calendar",
          sourceTitle: "Crew",
          notes: d.notes || (proposed ? d.reason : ""),
          recurring: false,
        },
        base,
        range,
        zone,
      ).map((item) => ({
        ...item,
        id: `draft:${d.id}@${item.day}`,
        occurrenceKey: JSON.stringify(["draft", d.id]),
        storage: proposed ? "draft" : local ? "local" : "pending",
        itemId: d.id,
        providerEvent: undefined,
        source: proposed && d.source === "proactive" ? t("common.crewSuggestion") : "",
        calendarLocation: proposed ? undefined : itemLocation(d, connections),
        calendarColor: proposed ? item.calendarColor : itemColor(d, connections),
        deliveryState:
          proposed || local ? undefined : (d.delivery?.state ?? "unsubmitted"),
      }));
    });
}
