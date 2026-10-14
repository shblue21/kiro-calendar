import type { CivilDate } from "./dates.ts";
import { shift } from './dates.ts';
import type { CalendarViewItem } from './types.ts';

/** month is zero-based, for the twelve-month grid. An event spanning months counts once in each. */
export function countMonthlyItems(items: readonly CalendarViewItem[], base: CivilDate, year: number, month: number): number {
  const unique = new Set<string>();
  for (const item of items) {
    const day = shift(base, item.day);
    if (day.year === year && day.month === month + 1) unique.add(item.occurrenceKey);
  }
  return unique.size;
}
