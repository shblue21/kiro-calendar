import { CalendarDays } from "../platform/kiro/icons";
export function EventMark() {
  return (
    <CalendarDays
      style={{ color: "var(--cc-calendar-color)" }}
      size={13}
      aria-hidden="true"
    />
  );
}
