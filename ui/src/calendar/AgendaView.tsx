import { Fragment } from "react";
import { Badge, Btn } from "@kirocrew/app-sdk/ui";
import { ChevronRight } from "../platform/kiro/icons";
import type { CalendarViewItem } from "./types";
import { DAYS, shift, dateKey } from "./dates";
import { STATUS_LABEL, timeLabel } from "./format";
import { TypeMark } from "./TypeMark";

type Props = {
  items: readonly CalendarViewItem[];
  base: Date;
  today: Date;
  selectedId?: string;
  onSelect: (item: CalendarViewItem, button: HTMLButtonElement) => void;
};

export function AgendaView({
  items,
  base,
  today,
  selectedId,
  onSelect,
}: Props) {
  const days = [...new Set(items.map((item) => item.day))].sort((a, b) => a - b);
  const monthOf = (day: number) => {
    const date = shift(base, day);
    return `${date.getFullYear()}-${date.getMonth()}`;
  };
  // Month headings only when the listed days span more than one month.
  const multiMonth = new Set(days.map(monthOf)).size > 1;
  return (
    <div className="cc-agenda">
      {days.map((day, index) => {
        const date = shift(base, day);
        const monthHeading = multiMonth && (index === 0 || monthOf(days[index - 1]) !== monthOf(day));
        const list = items
          .filter((x) => x.day === day)
          .sort((a, b) => a.start - b.start);
        if (!list.length) return null;
        return (
          <Fragment key={day}>
          {monthHeading && <h2 className="cc-agenda-month">{date.getFullYear()}년 {date.getMonth() + 1}월</h2>}
          <section>
            <h3>
              {date.getMonth() + 1}월 {date.getDate()}일{" "}
              <span>{DAYS[(date.getDay() + 6) % 7]}요일</span>
              {dateKey(date) === dateKey(today) && (
                <Badge variant="aim">오늘</Badge>
              )}
            </h3>
            {list.map((item) => (
              <Btn
                key={item.id}
                className={`cc-agenda-item cc-${item.kind} ${selectedId === item.id ? "cc-agenda-selected" : ""}`}
                onClick={(e) => onSelect(item, e.currentTarget)}
              >
                <span className="cc-agenda-time">{timeLabel(item)}</span>
                <span className="cc-agenda-title">
                  <TypeMark item={item} />
                  {item.title}
                </span>
                <span className="cc-agenda-source">{item.source}</span>
                {item.status && (
                  <Badge
                    variant={
                      item.status === "failed"
                        ? "err"
                        : item.status === "success"
                          ? "ok"
                          : item.status === "running"
                            ? "aim"
                            : "muted"
                    }
                  >
                    {STATUS_LABEL[item.status]}
                  </Badge>
                )}
                <ChevronRight size={14} />
              </Btn>
            ))}
          </section>
          </Fragment>
        );
      })}
    </div>
  );
}
