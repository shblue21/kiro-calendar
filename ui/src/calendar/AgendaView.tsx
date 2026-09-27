import { Badge, Btn } from "@kirocrew/app-sdk/ui";
import { ChevronRight } from "../platform/kiro/icons";
import type { CalendarViewItem, CalendarReferenceTime } from "./types";
import { DAYS } from "./dates";
import { STATUS_LABEL, timeLabel } from "./format";
import { TypeMark } from "./TypeMark";

type Props = {
  items: readonly CalendarViewItem[];
  dates: Date[];
  referenceTime: CalendarReferenceTime;
  selectedId?: string;
  onSelect: (item: CalendarViewItem, button: HTMLButtonElement) => void;
};

export function AgendaView({
  items,
  dates,
  referenceTime,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div className="cc-agenda">
      {dates.map((date, day) => {
        const list = items
          .filter((x) => x.day === day)
          .sort((a, b) => a.start - b.start);
        if (!list.length) return null;
        return (
          <section key={day}>
            <h3>
              {date.getMonth() + 1}월 {date.getDate()}일{" "}
              <span>{DAYS[day]}요일</span>
              {day === referenceTime.day && (
                <Badge variant="aim">예시 현재 날짜</Badge>
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
        );
      })}
    </div>
  );
}
