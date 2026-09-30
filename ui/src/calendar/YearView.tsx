import type { CalendarViewItem } from "./types";
import { dateKey, DAYS, shift } from "./dates";
import { monthDates } from "./period";

export function YearView({ date, base, sampleDate, items, onMonth }: {
  date: Date; base: Date; sampleDate: Date; items: readonly CalendarViewItem[]; onMonth: (date: Date) => void;
}) {
  const occupied = new Set(items.map((item) => dateKey(shift(base, item.day))));
  return <div className="cc-year-view">
    <p className="cc-year-note">점은 표시 조건에 맞는 일정이 있는 날입니다. 월을 눌러 자세히 보세요.</p>
    <div className="cc-year-grid">{Array.from({ length: 12 }, (_, month) => {
      const first = new Date(date.getFullYear(), month, 1, 12);
      const count = items.filter((item) => shift(base, item.day).getMonth() === month).length;
      return <button className="cc-year-month" key={month} aria-label={`${date.getFullYear()}년 ${month + 1}월 보기, ${count}건`} onClick={() => onMonth(first)}>
        <span className="cc-year-month-heading"><strong>{month + 1}월</strong><small>{count ? `${count}건` : ""}</small></span>
        <span className="cc-mini-grid">{DAYS.map((day) => <span className="cc-mini-weekday" key={day}>{day}</span>)}
          {monthDates(first).map((day) => <span key={dateKey(day)} className={`${day.getMonth() === month && dateKey(day) === dateKey(sampleDate) ? "cc-reference-day" : ""} ${day.getMonth() === month && occupied.has(dateKey(day)) ? "cc-occupied-day" : ""}`}>
            {day.getMonth() === month ? day.getDate() : ""}
          </span>)}
        </span>
      </button>;
    })}</div>
  </div>;
}
