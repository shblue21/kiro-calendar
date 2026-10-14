import { formatDate,weekdays } from "../i18n/format.ts";
import { t } from "../i18n/index.ts";
import { countMonthlyItems } from "./count";
import { DateBadge } from "./DateBadge";
import { dateKey,shift } from "./dates";
import type { CivilDate } from "./dates.ts";
import { monthDates } from "./period";
import type { CalendarViewItem } from "./types";
export function YearView({
  date,
  base,
  today,
  items,
  onMonth,
}: {
  date: CivilDate;
  base: CivilDate;
  today: CivilDate;
  items: readonly CalendarViewItem[];
  onMonth: (date: CivilDate) => void;
}) {
  const occupied = new Set(items.map((item) => dateKey(shift(base, item.day))));
  return (
    <div className="cc-year-view">
      <p className="cc-year-note">{t("calendar.yearLegend")}</p>
      <div className="cc-year-grid">
        {Array.from({ length: 12 }, (_, month) => {
          const first = date.with({ month: month + 1, day: 1 });
          const count = countMonthlyItems(items, base, date.year, month);
          return (
            <button
              className="cc-year-month"
              key={month}
              aria-label={t("calendar.monthSummary", {
                year: date.year,
                month: month + 1,
                count: count,
              })}
              onClick={() => onMonth(first)}
            >
              <span className="cc-year-month-heading">
                <strong>{formatDate(first, { month: "long" })}</strong>
                <small>
                  {count ? t("calendar.eventCount", { count: count }) : ""}
                </small>
              </span>
              <span className="cc-mini-grid">
                {weekdays().map((day) => (
                  <span className="cc-mini-weekday" key={day}>
                    {day}
                  </span>
                ))}
                {monthDates(first).map((day) => (
                  <DateBadge
                    key={dateKey(day)}
                    size="mini"
                    day={day.month === month + 1 ? day.day : ""}
                    today={
                      day.month === month + 1 && dateKey(day) === dateKey(today)
                    }
                    className={
                      day.month === month + 1 && occupied.has(dateKey(day))
                        ? "cc-occupied-day"
                        : ""
                    }
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
