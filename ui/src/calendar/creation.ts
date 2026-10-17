import { DEFAULT_EVENT_DURATION_MS } from "../live/eventFields.ts";
import type { CivilDate } from "./dates.ts";
import { dateKey } from "./dates.ts";
import { dayBounds } from "./time.ts";
export type EventTimes = { start: string; end: string };
export type EventSeed = { date: CivilDate; times?: EventTimes };
/** Grid coordinates represent elapsed time, including repeated/missing DST hours. */
export function seedAtMinute(date: CivilDate, zone: string, minute: number): EventSeed {
  const day = dayBounds(dateKey(date), zone);
  const snapped = Math.max(
    0,
    Math.min(day.durationMinutes - 15, Math.floor(minute / 15) * 15),
  );
  const start = day.startMs + snapped * 60000;
  return {
    date,
    times: {
      start: new Date(start).toISOString(),
      end: new Date(start + DEFAULT_EVENT_DURATION_MS).toISOString(),
    },
  };
}
