import { dateKey, monday, shift } from "./dates.ts";
import { dayOffset } from "./editor.ts";
import type { CalendarView } from "./types.ts";

export function monthDates(date: Date) {
  const start = monday(new Date(date.getFullYear(), date.getMonth(), 1, 12));
  return Array.from({ length: 42 }, (_, day) => shift(start, day));
}
export function movePeriod(date: Date, view: CalendarView, direction: number) {
  if (view === "month") return new Date(date.getFullYear(), date.getMonth() + direction, 1, 12);
  if (view === "year") return new Date(date.getFullYear() + direction, date.getMonth(), 1, 12);
  return shift(date, direction * 7);
}
export function calendarRange(date: Date, view: CalendarView, base: Date, layout: "calendar" | "list" = "calendar") {
  let first: Date;
  let end: Date;
  if (view === "year") {
    first = new Date(date.getFullYear(), 0, 1, 12);
    end = new Date(date.getFullYear() + 1, 0, 1, 12);
  } else if (view === "month") {
    first = layout === "list" ? new Date(date.getFullYear(), date.getMonth(), 1, 12) : monthDates(date)[0];
    end = layout === "list" ? new Date(date.getFullYear(), date.getMonth() + 1, 1, 12) : shift(first, 42);
  } else {
    first = monday(date);
    end = shift(first, 7);
  }
  return { first: dayOffset(dateKey(first), base), end: dayOffset(dateKey(end), base) };
}
