import type { RegisterEventButton } from "./EventButton";
import { EventButton } from "./EventButton";
import { calendarStyle } from "./color";
import { Plus } from "../platform/kiro/icons";
import { weekdays } from "../i18n/format.ts";
import { t } from "../i18n/index.ts";
import { DateBadge } from "./DateBadge";
import { dateKey, shift } from "./dates";
import type { CivilDate } from "./dates.ts";
import { timeLabel } from "./format";
import { monthDates } from "./period";
import type { CalendarViewItem } from "./types";
type Props = {
  date: CivilDate;
  base: CivilDate;
  today: CivilDate;
  items: readonly CalendarViewItem[];
  registerButton: RegisterEventButton;
  selectedId?: string;
  onSelect: (item: CalendarViewItem) => void;
  onDay: (date: CivilDate) => void;
  onAdd: (date: CivilDate) => void;
};
export function MonthView({
  date,
  base,
  today,
  items,
  registerButton,
  selectedId,
  onSelect,
  onDay,
  onAdd,
}: Props) {
  const byDate = new Map<string, CalendarViewItem[]>();
  for (const item of items) {
    const key = dateKey(shift(base, item.day));
    byDate.set(key, [...(byDate.get(key) ?? []), item]);
  }
  return (
    <div className="cc-month-view">
      <div className="cc-month-weekdays">
        {weekdays().map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="cc-month-grid">
        {monthDates(date).map((day) => {
          const key = dateKey(day);
          const list = (byDate.get(key) ?? []).sort(
            (a, b) => Number(!!b.allDay) - Number(!!a.allDay) || a.start - b.start,
          );
          return (
            <section
              key={key}
              aria-label={key}
              onClick={(e) => {
                if (e.target === e.currentTarget) onAdd(day);
              }}
              className={`cc-month-cell ${day.month !== date.month ? "cc-outside-month" : ""}`}
            >
              <button
                className="cc-month-day"
                aria-label={t("calendar.openDay", { date: key })}
                onClick={() => onDay(day)}
              >
                <DateBadge day={day.day} today={key === dateKey(today)} />
              </button>
              <button
                type="button"
                className="cc-month-add"
                aria-label={t("calendar.addOnDate", { date: key })}
                onClick={() => onAdd(day)}
              >
                <Plus size={14} />
              </button>
              {list.slice(0, 3).map((item) => (
                <EventButton
                  eventId={item.id}
                  registerButton={registerButton}
                  selected={selectedId === item.id}
                  key={item.id}
                  style={calendarStyle(item.calendarColor)}
                  className="cc-month-item cc-event"
                  aria-label={`${item.title}, ${timeLabel(item)}`}
                  title={`${item.title} · ${timeLabel(item)}`}
                  onClick={() => onSelect(item)}
                >
                  <span className="cc-month-item-time">
                    {item.allDay ? t("common.allDay") : timeLabel(item).split("–")[0]}
                  </span>
                  <span>{item.title}</span>
                </EventButton>
              ))}
              {list.length > 3 && (
                <button
                  className="cc-month-more"
                  onClick={() => onDay(day)}
                  aria-label={t("calendar.dayOverflow", {
                    date: key,
                    count: list.length - 3,
                  })}
                >
                  {t("common.moreEvents", { count: list.length - 3 })}
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
