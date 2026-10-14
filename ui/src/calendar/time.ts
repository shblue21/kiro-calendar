import { Temporal } from "@js-temporal/polyfill";
import { notice, NoticeError } from "../i18n/notice.ts";
const MINUTE_MS = 60000;
const HOUR_MS = 60 * MINUTE_MS;
/** Human-entered local time: ambiguity must never silently pick an occurrence. */
export function zonedISO(value: string, zone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new NoticeError(notice("common.checkTheDateAndTime"));
  try {
    const local = Temporal.PlainDateTime.from(value, { overflow: "reject" });
    return local
      .toZonedDateTime(zone, { disambiguation: "reject" })
      .toString({ timeZoneName: "never", calendarName: "never" });
  } catch {
    throw new NoticeError(notice("time.ambiguousOrMissing"));
  }
}
function zoned(value: string | Date, zone: string) {
  return Temporal.Instant.from(
    value instanceof Date ? value.toISOString() : value,
  ).toZonedDateTimeISO(zone);
}
export function zonedInput(value: string | Date, zone: string): string {
  return zoned(value, zone)
    .toPlainDateTime()
    .toString({ smallestUnit: "minute" });
}
export function zonedDay(
  value: string | Date,
  zone: string,
): Temporal.PlainDate {
  return zoned(value, zone).toPlainDate();
}
export type DayBounds = Readonly<{
  date: string;
  zone: string;
  startMs: number;
  endMs: number;
  durationMinutes: number;
  clockChanges: boolean;
}>;
const dayCache = new Map<string, DayBounds>();
/** Half-open local date interval. Repeated midnight starts at its first occurrence;
 * a missing midnight starts at the first actual time, and a skipped date is empty. */
export function dayBounds(date: string, zone: string): DayBounds {
  const key = JSON.stringify([date, zone]);
  const cached = dayCache.get(key);
  if (cached) return cached;
  const civil = Temporal.PlainDate.from(date);
  const start = civil.toZonedDateTime(zone),
    end = civil.add({ days: 1 }).toZonedDateTime(zone);
  const result = Object.freeze({
    date,
    zone,
    startMs: start.epochMilliseconds,
    endMs: end.epochMilliseconds,
    durationMinutes:
      (end.epochMilliseconds - start.epochMilliseconds) / MINUTE_MS,
    clockChanges:
      start.offset !== end.offset ||
      start.hour !== 0 ||
      start.minute !== 0 ||
      end.epochMilliseconds - start.epochMilliseconds !== 24 * HOUR_MS,
  });
  if (dayCache.size >= 800) dayCache.clear();
  dayCache.set(key, result);
  return result;
}
export function dateRangeInstants(
  firstDate: string,
  exclusiveEndDate: string,
  zone: string,
) {
  if (Temporal.PlainDate.compare(firstDate, exclusiveEndDate) >= 0)
    throw new NoticeError(notice("common.checkTheDateRange"));
  return {
    start: new Date(dayBounds(firstDate, zone).startMs).toISOString(),
    end: new Date(dayBounds(exclusiveEndDate, zone).startMs).toISOString(),
  };
}
export function elapsedMinute(
  instant: string | number,
  day: DayBounds,
): number {
  const ms =
    typeof instant === "number"
      ? instant
      : Temporal.Instant.from(instant).epochMilliseconds;
  return Math.max(
    0,
    Math.min(day.durationMinutes, (ms - day.startMs) / MINUTE_MS),
  );
}
export function dayTimeline(date: string, zone: string) {
  const day = dayBounds(date, zone);
  const ticks = [];
  for (let ms = day.startMs; ms < day.endMs; ms += HOUR_MS) {
    const local = zoned(new Date(ms), zone);
    ticks.push({
      minute: (ms - day.startMs) / MINUTE_MS,
      label: local.toPlainTime().toString({ smallestUnit: "minute" }),
      offset: local.offset,
    });
  }
  const counts = new Map<string, number>();
  for (const t of ticks) counts.set(t.label, (counts.get(t.label) || 0) + 1);
  return {
    ...day,
    ticks: ticks.map((t) => ({
      ...t,
      label: counts.get(t.label)! > 1 ? `${t.label} UTC${t.offset}` : t.label,
    })),
  };
}
/** Labels retain wall-clock meaning; geometry uses elapsed time independently. */
export function intervalLabels(startMs: number, endMs: number, day: DayBounds) {
  const start = zoned(new Date(startMs), day.zone),
    end = zoned(new Date(endMs), day.zone);
  const offsetChanges = start.offset !== end.offset;
  const label = (z: typeof start) =>
    z.toPlainTime().toString({ smallestUnit: "minute" }) +
    (offsetChanges ? ` UTC${z.offset}` : "");
  return {
    start: label(start),
    end:
      endMs === day.endMs
        ? "24:00" + (offsetChanges ? ` UTC${end.offset}` : "")
        : label(end),
  };
}
/** Editor state retains a known instant, including offset/seconds, independently of its wall label. */
export type TimeSelection = {
  wall: string;
  instant: string | null;
};
export function timeSelection(instant: string, zone: string): TimeSelection {
  const canonical = Temporal.Instant.from(instant)
    .round({ smallestUnit: "second", roundingMode: "floor" })
    .toString();
  return { wall: zonedInput(canonical, zone), instant: canonical };
}
/** Known instants move with the display zone; unresolved input remains a user choice. */
export function rezoneTime(value: TimeSelection, zone: string): TimeSelection {
  return value.instant ? timeSelection(value.instant, zone) : value;
}
export function timeChoices(
  wall: string,
  zone: string,
): {
  instant: string;
  offset: string;
}[] {
  try {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(wall)) return [];
    const local = Temporal.PlainDateTime.from(wall, { overflow: "reject" });
    const candidates = (["earlier", "later"] as const)
      .map((disambiguation) => local.toZonedDateTime(zone, { disambiguation }))
      .filter((candidate) => candidate.toPlainDateTime().equals(local));
    return [
      ...new Map(
        candidates.map((candidate) => [
          candidate.epochMilliseconds,
          {
            instant: candidate.toString({
              timeZoneName: "never",
              calendarName: "never",
            }),
            offset: candidate.offset,
          },
        ]),
      ).values(),
    ];
  } catch {
    return [];
  }
}
export function editTime(wall: string, zone: string): TimeSelection {
  const choices = timeChoices(wall, zone);
  return { wall, instant: choices.length === 1 ? choices[0].instant : null };
}
export function selectedOffset(value: TimeSelection, zone: string): string {
  return value.instant ? zoned(value.instant, zone).offset : "";
}
export function resolveTime(value: TimeSelection, zone: string): string {
  if (value.instant && zonedInput(value.instant, zone) === value.wall)
    return zoned(value.instant, zone).toString({
      timeZoneName: "never",
      calendarName: "never",
      smallestUnit: "second",
      roundingMode: "floor",
    });
  const choices = timeChoices(value.wall, zone);
  if (choices.length === 1) return choices[0].instant;
  throw new NoticeError(
    notice(choices.length > 1 ? "time.offsetRequired" : "time.invalid"),
  );
}
