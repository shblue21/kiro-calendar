import { Temporal } from "@js-temporal/polyfill";

export type CivilDate = Temporal.PlainDate;
export const civilDate = (value: string): CivilDate => Temporal.PlainDate.from(value);
export const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
export const monday = (date: CivilDate) => date.subtract({ days: date.dayOfWeek - 1 });
export const shift = (date: CivilDate, days: number) => date.add({ days });
export const dateKey = (date: CivilDate) => date.toString();
export function dayOffset(date: string, base: CivilDate) {
  try { return base.until(civilDate(date), { largestUnit: "day" }).days; }
  catch { return NaN; }
}
