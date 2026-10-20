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

// Python str.split() uses Unicode White_Space plus the four information separators.
// FEFF is deliberately retained; JavaScript trim()/\s would remove it.
export function normalizeTitle(title: string): string {
  return title
    .split(/[\p{White_Space}\u001c-\u001f]+/u)
    .filter(Boolean)
    .join(" ");
}

// Match Python len and Swift unicodeScalars: limits count Unicode code points.
export function eventTextError(fields: Pick<EventFields, "title" | "notes">) {
  const title = normalizeTitle(fields.title);
  if (Array.from(title).length > TITLE_LIMIT) return "editor.titleTooLong";
  if (Array.from(fields.notes).length > NOTES_LIMIT) return "editor.notesTooLong";
  return null;
}
