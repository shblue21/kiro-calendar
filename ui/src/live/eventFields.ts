import type { CalendarItem } from "./types.ts";
export const TITLE_LIMIT = 120;
export const NOTES_LIMIT = 2000;
export const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000;
export type EventFields = {
  title: string;
  start: string;
  end: string;
  timezone: string;
  notes: string;
};
export function eventEnd(item: Pick<CalendarItem, "start" | "end">): string {
  return (
    item.end ||
    new Date(Date.parse(item.start) + DEFAULT_EVENT_DURATION_MS).toISOString()
  );
}
