import type { CalendarViewItem } from "./types";
import { dateKey, DAYS, shift } from "./dates";
import { monthDates } from "./period";
import { countMonthlyItems } from "./count";
import { DateBadge } from "./DateBadge";

export function YearView({ date, base, today, items, onMonth }: {
  date: Date; base: Date; today: Date; items: readonly CalendarViewItem[]; onMonth: (date: Date) => void;
}) {
  const occupied = new Set(items.map((item) => dateKey(shift(base, item.day))));
  return <div className="cc-year-view">
    <p className="cc-year-note">점은 표시 조건에 맞는 일정이 있는 날입니다. 월을 눌러 자세히 보세요.</p>
    <div className="cc-year-grid">{Array.from({ length: 12 }, (_, month) => {
      const first = new Date(date.getFullYear(), month, 1, 12);
      const count = countMonthlyItems(items, base, date.getFullYear(), month);
      return <button className="cc-year-month" key={month} aria-label={`${date.getFullYear()}년 ${month + 1}월 보기, ${count}건`} onClick={() => onMonth(first)}>
        <span className="cc-year-month-heading"><strong>{month + 1}월</strong><small>{count ? `${count}건` : ""}</small></span>
        <span className="cc-mini-grid">{DAYS.map((day) => <span className="cc-mini-weekday" key={day}>{day}</span>)}
          {monthDates(first).map((day) => <DateBadge key={dateKey(day)} size="mini"
            day={day.getMonth() === month ? day.getDate() : ''}
            today={day.getMonth() === month && dateKey(day) === dateKey(today)}
            className={day.getMonth() === month && occupied.has(dateKey(day)) ? 'cc-occupied-day' : ''} />)}
        </span>
      </button>;
    })}</div>
  </div>;
}
