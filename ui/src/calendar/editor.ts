import { dateKey, shift } from "./dates.ts";
export type EditorDraft = {
  title: string;
  date: string;
  start: string;
  end: string;
  allDay: boolean;
  source: string;
  description: string;
  repeat: "none" | "daily" | "weekly";
  eventId: string;
};
export function minuteValue(time: string) {
  if (!/^\d{2}:\d{2}$/.test(time)) return NaN;
  const [h, m] = time.split(":").map(Number);
  return h < 24 && m < 60 ? h * 60 + m : NaN;
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
export function validateDraft(
  draft: EditorDraft,
  kind: "event" | "task",
  base: Date,
) {
  if (!draft.title.trim())
    return kind === "event"
      ? "일정 제목을 입력해 주세요."
      : "맡길 작업의 이름을 입력해 주세요.";
  if (!Number.isFinite(dayOffset(draft.date, base)))
    return "유효한 날짜를 선택해 주세요.";
  if (!draft.allDay || kind === "task") {
    if (!Number.isFinite(minuteValue(draft.start)))
      return "시작 시간을 입력해 주세요.";
    if (
      kind === "event" &&
      (!Number.isFinite(minuteValue(draft.end)) ||
        minuteValue(draft.end) <= minuteValue(draft.start))
    )
      return "종료 시간은 시작 시간보다 뒤여야 합니다. 여러 날 일정은 아직 지원하지 않습니다.";
  }
  if (kind === "task" && !draft.description.trim())
    return "Crew가 수행할 내용을 입력해 주세요.";
  return "";
}
export function blankDraft(base: Date, day: number): EditorDraft {
  return {
    title: "",
    date: dateKey(shift(base, day)),
    start: "10:00",
    end: "11:00",
    allDay: false,
    source: "개인 일정",
    description: "",
    repeat: "none",
    eventId: "",
  };
}
