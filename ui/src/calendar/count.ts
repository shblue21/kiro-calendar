import type { CivilDate } from "./dates.ts";
import { shift } from "./dates.ts";
import type { CalendarViewItem } from "./types.ts";

export function countItems(items: readonly CalendarViewItem[]): number {
  return new Set(items.map((item) => item.occurrenceKey)).size;
}

/** month is zero-based, for the twelve-month grid. An event spanning months counts once in each. */
export function countMonthlyItems(
  items: readonly CalendarViewItem[],
  base: CivilDate,
  year: number,
  month: number,
): number {
  return countItems(
    items.filter((item) => {
      const day = shift(base, item.day);
      return day.year === year && day.month === month + 1;
    }),
  );
}
