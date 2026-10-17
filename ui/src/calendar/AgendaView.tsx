import type { RegisterEventButton } from "./EventButton";
import { EventButton } from "./EventButton";
import { calendarStyle } from "./color";
import { sourceLabel, deliveryLabel } from "./format";
import { Badge } from "@kirocrew/app-sdk/ui";
import { Fragment } from "react";
import { formatDate } from "../i18n/format.ts";
import { t } from "../i18n/index.ts";
import { ChevronRight } from "../platform/kiro/icons";
import { dateKey, shift } from "./dates";
import type { CivilDate } from "./dates.ts";
import { timeLabel } from "./format";
import { EventMark } from "./EventMark";
import type { CalendarViewItem } from "./types";
type Props = {
  items: readonly CalendarViewItem[];
  base: CivilDate;
  today: CivilDate;
  registerButton: RegisterEventButton;
  selectedId?: string;
  onSelect: (item: CalendarViewItem) => void;
};
export function AgendaView({
  items,
  base,
  today,
  registerButton,
  selectedId,
  onSelect,
}: Props) {
  const days = [...new Set(items.map((item) => item.day))].sort((a, b) => a - b);
  const monthOf = (day: number) => {
    const date = shift(base, day);
    return `${date.year}-${date.month}`;
  };
  // Month headings only when the listed days span more than one month.
  const multiMonth = new Set(days.map(monthOf)).size > 1;
  return (
    <div className="cc-agenda">
      {days.map((day, index) => {
        const date = shift(base, day);
        const monthHeading =
          multiMonth && (index === 0 || monthOf(days[index - 1]) !== monthOf(day));
        const list = items
          .filter((x) => x.day === day)
          .sort((a, b) => a.start - b.start);
        if (!list.length) return null;
        return (
          <Fragment key={day}>
            {monthHeading && (
              <h2 className="cc-agenda-month">
                {formatDate(date, { year: "numeric", month: "long" })}
              </h2>
            )}
            <section>
              <h3>
                {formatDate(date, {
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                })}
                {dateKey(date) === dateKey(today) && (
                  <Badge variant="aim">{t("common.today")}</Badge>
                )}
              </h3>
              {list.map((item) => (
                <EventButton
                  eventId={item.id}
                  registerButton={registerButton}
                  selected={selectedId === item.id}
                  key={item.id}
                  style={calendarStyle(item.calendarColor)}
                  className="cc-agenda-item cc-event"
                  onClick={() => onSelect(item)}
                >
                  <span className="cc-agenda-time">{timeLabel(item)}</span>
                  <span className="cc-agenda-title">
                    <EventMark />
                    {item.title}
                  </span>
                  <span className="cc-agenda-source">{sourceLabel(item)}</span>
                  {item.deliveryState && (
                    <span className="cc-agenda-delivery">
                      {deliveryLabel(item.deliveryState)}
                    </span>
                  )}
                  <ChevronRight size={14} />
                </EventButton>
              ))}
            </section>
          </Fragment>
        );
      })}
    </div>
  );
}
