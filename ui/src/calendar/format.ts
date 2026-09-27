import type { CalendarViewItem as Item, Kind } from "./types";

export const KIND_LABEL: Record<Kind, string> = {
  event: "사람 일정",
  trigger: "AI 예약",
  run: "실제 실행",
};
export const STATUS_LABEL = {
  running: "실행 중",
  success: "완료",
  failed: "실패",
  scheduled: "예약",
};
export function clock(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
export function timeLabel(item: Item) {
  if (item.allDay) return "종일";
  if (item.kind === "trigger")
    return clock(item.start) + (item.flexible ? " 부근" : "");
  return `${clock(item.start)}–${item.end == null ? "현재" : clock(item.end)}`;
}
