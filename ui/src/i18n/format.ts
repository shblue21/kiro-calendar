import type { CivilDate } from "../calendar/dates.ts";
import type { Locale } from "./locale.ts";
import { locale } from "./locale.ts";
const formats = new Map<string, Intl.DateTimeFormat>();
const numbers = new Map<Locale, Intl.NumberFormat>();
const plurals = new Map<Locale, Intl.PluralRules>();
const days = new Map<Locale, readonly string[]>();
function dateFormatter(options: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify([locale(), options]);
  let formatter = formats.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale(), options);
    formats.set(key, formatter);
  }
  return formatter;
}
export function formatNumber(value: number): string {
  let formatter = numbers.get(locale());
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale());
    numbers.set(locale(), formatter);
  }
  return formatter.format(value);
}
export function pluralCategory(count: number): Intl.LDMLPluralRule {
  let rules = plurals.get(locale());
  if (!rules) {
    rules = new Intl.PluralRules(locale());
    plurals.set(locale(), rules);
  }
  return rules.select(count);
}
export const formatDate = (
  value: CivilDate,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) =>
  dateFormatter({ ...options, timeZone: "UTC" }).format(
    new Date(`${value.toString()}T12:00:00Z`),
  );
export const formatDateTime = (instant: string, zone: string) =>
  dateFormatter({
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: zone,
  }).format(new Date(instant));
export function weekdays(): readonly string[] {
  let labels = days.get(locale());
  if (!labels) {
    const formatter = dateFormatter({ weekday: "short", timeZone: "UTC" });
    labels = Object.freeze(
      Array.from({ length: 7 }, (_, i) =>
        formatter.format(new Date(Date.UTC(2026, 9, 5 + i))),
      ),
    );
    days.set(locale(), labels);
  }
  return labels;
}
