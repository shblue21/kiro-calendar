import type { CalendarViewItem } from './types.ts';
import { shift } from './dates.ts';

/** month is zero-based, like Date.getMonth(). An event spanning months counts once in each. */
export function countMonthlyItems(items: readonly CalendarViewItem[], base: Date, year: number, month: number): number {
  const unique = new Set<string>();
  for (const item of items) {
    const day = shift(base, item.day);
    if (day.getFullYear() === year && day.getMonth() === month) unique.add(item.occurrenceKey);
  }
  return unique.size;
}
