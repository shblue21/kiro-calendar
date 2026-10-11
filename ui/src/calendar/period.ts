import { dateKey, monday, shift } from "./dates.ts";
import { dayOffset } from "./dates.ts";
import type { CivilDate } from "./dates.ts";
import type { CalendarView } from "./types.ts";

export function monthDates(date: CivilDate) {
  const start = monday(date.with({ day: 1 }));
  return Array.from({ length: 42 }, (_, day) => shift(start, day));
}
export function movePeriod(date: CivilDate, view: CalendarView, direction: number) {
  if (view === "month") return date.with({ day: 1 }).add({ months: direction });
  if (view === "year") return date.with({ day: 1 }).add({ years: direction });
  return shift(date, direction * 7);
}
export function calendarRange(date: CivilDate, view: CalendarView, base: CivilDate, layout: "calendar" | "list" = "calendar") {
  let first: CivilDate;
  let end: CivilDate;
  if (view === "year") {
    first = date.with({ month: 1, day: 1 });
    end = first.add({ years: 1 });
  } else if (view === "month") {
    first = layout === "list" ? date.with({ day: 1 }) : monthDates(date)[0];
    end = layout === "list" ? first.add({ months: 1 }) : shift(first, 42);
  } else {
    first = monday(date);
    end = shift(first, 7);
  }
  return { first: dayOffset(dateKey(first), base), end: dayOffset(dateKey(end), base) };
}
