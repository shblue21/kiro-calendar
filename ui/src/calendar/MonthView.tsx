import type { CalendarViewItem } from "./types";
import { dateKey, DAYS, shift } from "./dates";
import { monthDates } from "./period";
import { timeLabel } from "./format";

type Props = {
  date: Date;
  base: Date;
  sampleDate: Date;
  items: readonly CalendarViewItem[];
  selectedId?: string;
  onSelect: (item: CalendarViewItem, button: HTMLButtonElement) => void;
  onDay: (date: Date) => void;
};
export function MonthView({ date, base, sampleDate, items, selectedId, onSelect, onDay }: Props) {
  const byDate = new Map<string, CalendarViewItem[]>();
  for (const item of items) {
    const key = dateKey(shift(base, item.day));
    byDate.set(key, [...(byDate.get(key) ?? []), item]);
  }
  return <div className="cc-month-view">
    <div className="cc-month-weekdays">{DAYS.map((day) => <span key={day}>{day}</span>)}</div>
    <div className="cc-month-grid">
      {monthDates(date).map((day) => {
        const key = dateKey(day);
        const list = (byDate.get(key) ?? []).sort((a, b) => Number(!!b.allDay) - Number(!!a.allDay) || a.start - b.start);
        return <section key={key} aria-label={key} className={`cc-month-cell ${day.getMonth() !== date.getMonth() ? "cc-outside-month" : ""}`}>
          <button className={`cc-month-day ${key === dateKey(sampleDate) ? "cc-reference-day" : ""}`}
            aria-label={`${key} 주간 보기`} onClick={() => onDay(day)}>{day.getDate()}</button>
          {list.slice(0, 3).map((item) => <button key={item.id}
            className={`cc-month-item cc-${item.kind} ${item.id === selectedId ? "cc-month-selected" : ""}`}
            aria-label={`${item.title}, ${timeLabel(item)}`} title={`${item.title} · ${timeLabel(item)}`}
            onClick={(e) => onSelect(item, e.currentTarget)}>
            <span className="cc-month-item-time">{item.allDay ? "종일" : timeLabel(item).split("–")[0]}</span>
            <span>{item.title}</span>
          </button>)}
          {list.length > 3 && <button className="cc-month-more" onClick={() => onDay(day)} aria-label={`${key} 일정 ${list.length - 3}개 더 보기`}>+{list.length - 3}개 더</button>}
        </section>;
      })}
    </div>
  </div>;
}
