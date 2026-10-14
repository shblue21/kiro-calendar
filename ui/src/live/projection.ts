import { calendarColor, itemColor, itemLocation, locationLabel } from "./location.ts";
import type { CivilDate } from "../calendar/dates.ts";
import { dateKey, dayOffset, shift } from "../calendar/dates.ts";
import {
  dayBounds,
  intervalLabels,
  zonedInput,
  zonedISO,
} from "../calendar/time.ts";
import type { CalendarViewItem } from "../calendar/types.ts";
import { t } from "../i18n/index.ts";
import type { CalendarEvent, Connection, Draft } from "./types.ts";
import { can } from "./types.ts";
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
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || end <= start)
    return [];
  const startWall = zonedInput(start, zone);
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
      kind: "event",
      occurrenceKey,
      day,
      title: event.title,
      start: event.allDay ? 0 : (segmentStart - bounds.startMs) / 60000,
      end: event.allDay ? undefined : (segmentEnd - bounds.startMs) / 60000,
      timeLabels: event.allDay
        ? undefined
        : intervalLabels(segmentStart, segmentEnd, bounds),
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
      editable: false,
    });
  }
  return rows;
}
export function draftItems(
  drafts: Draft[],
  base: CivilDate,
  range: {
    first: number;
    end: number;
  },
  zone: string,
): CalendarViewItem[] {
  return drafts
    .filter((d) => d.status === "proposed" && d.delivery?.state !== "confirmed")
    .flatMap((d) => {
      if (!Number.isFinite(+new Date(d.start))) return [];
      const occurrenceKey = JSON.stringify(["draft", d.id]);
      const end = d.end || new Date(+new Date(d.start) + 3600000).toISOString();
      return eventItems(
        {
          eventId: d.id,
          calendarId: "drafts",
          title: d.title,
          start: d.start,
          end,
          allDay: false,
          startDate: "",
          endDate: "",
          timezone: d.timezone,
          calendarTitle: t("common.draft"),
          sourceTitle: "Crew",
          notes: d.notes || d.reason,
          recurring: false,
        },
        base,
        range,
        zone,
      ).map((item) => ({
        ...item,
        occurrenceKey,
        id: `draft:${d.id}@${item.day}`,
        source:
          d.source === "proactive"
            ? t("common.crewSuggestion")
            : "",
        calendarLocation: undefined,
        deliveryState: undefined,
        storage: "draft" as const,
        itemId: d.id,
        providerEvent: undefined,
        editable: can(d, "edit"),
      }));
    });
}
export function localInput(value: string, zone: string) {
  return zonedInput(value, zone);
}
export function inputISO(value: string, zone: string): string {
  return zonedISO(value, zone);
}
/** Record identity survives proposal acceptance; external confirmed events come from the provider. */
export function calendarItems(
  records: Draft[],
  base: CivilDate,
  range: {
    first: number;
    end: number;
  },
  zone: string,
  showCrew: boolean,
  connections: readonly Connection[] = [],
): CalendarViewItem[] {
  return records
    .filter((d) => !d.deletedAt && d.status !== "dismissed")
    .flatMap((d) => {
      if (d.status === "proposed") return draftItems([d], base, range, zone);
      const local = d.destination?.connectionId === "crew";
      if (local && !showCrew) return [];
      if (d.externalRef) return [];
      return eventItems(
        {
          eventId: d.id,
          calendarId: "default",
          title: d.title,
          start: d.start,
          end: d.end || new Date(+new Date(d.start) + 3600000).toISOString(),
          allDay: false,
          startDate: "",
          endDate: "",
          timezone: d.timezone,
          calendarTitle: "Crew Calendar",
          sourceTitle: "Crew",
          notes: d.notes || "",
          recurring: false,
        },
        base,
        range,
        zone,
      ).map((item) => ({
        ...item,
        id: `draft:${d.id}@${item.day}`,
        occurrenceKey: JSON.stringify(["draft", d.id]),
        storage: local ? ("local" as const) : ("pending" as const),
        itemId: d.id,
        providerEvent: undefined,
        editable: can(d, "edit"),
        source: "",
        calendarLocation: itemLocation(d, connections),
        calendarColor: itemColor(d, connections),
        deliveryState: local ? undefined : (d.delivery?.state ?? "unsubmitted"),
      }));
    });
}
