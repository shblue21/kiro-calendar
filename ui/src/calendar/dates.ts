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
