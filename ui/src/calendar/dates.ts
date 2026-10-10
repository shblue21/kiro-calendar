export const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

export function monday(date: Date) {
  const result = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
  );
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}
export function shift(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dayOffset(date: string, base: Date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return NaN;
  const [, y, m, d] = match.map(Number);
  const value = new Date(Date.UTC(y, m - 1, d));
  if (
    value.getUTCFullYear() !== y ||
    value.getUTCMonth() !== m - 1 ||
    value.getUTCDate() !== d
  )
    return NaN;
  return (
    (value.getTime() -
      Date.UTC(base.getFullYear(), base.getMonth(), base.getDate())) /
    86400000
  );
}
