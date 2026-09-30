import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { Btn } from "@kirocrew/app-sdk/ui";
import type { CalendarViewItem, CalendarReferenceTime } from "./types";
import { DAYS, dateKey } from "./dates";
import { clock, KIND_LABEL, STATUS_LABEL, timeLabel } from "./format";
import { place, spanEnd } from "./layout";
import { TypeMark } from "./TypeMark";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_PX = 64 / 60;

type Props = {
  items: readonly CalendarViewItem[];
  dates: Date[];
  referenceTime: CalendarReferenceTime;
  inSampleWeek: boolean;
  selectedId?: string;
  onSelect: (item: CalendarViewItem, button: HTMLButtonElement) => void;
};

export function WeekView({
  items,
  dates,
  referenceTime,
  inSampleWeek,
  selectedId,
  onSelect,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstDay = dateKey(dates[0]);
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    let positioned = false;
    // The host may lay out a newly mounted app after React effects run.
    // Wait for a genuinely scrollable viewport; then leave user scrolling alone.
    const position = () => {
      if (
        positioned ||
        element.clientHeight <= 0 ||
        element.scrollHeight <= element.clientHeight
      )
        return;
      element.scrollTop = 9 * 64;
      positioned = true;
      observer.disconnect();
    };
    const observer = new ResizeObserver(position);
    observer.observe(element);
    const frame = requestAnimationFrame(position);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [firstDay]);
  return (
    <>
      <div className="cc-grid-head">
        <div className="cc-grid-corner" />
        {dates.map((date, i) => (
          <div
            key={dateKey(date)}
            className={`cc-day-heading ${inSampleWeek && i === referenceTime.day ? "cc-sample-day" : ""}`}
          >
            <span>{DAYS[i]}</span>
            <span className="cc-date-number">{date.getDate()}</span>
          </div>
        ))}
      </div>
      <div className="cc-all-day">
        <span>종일</span>
        {dates.map((_, day) => (
          <div key={day}>
            {items
              .filter((x) => x.day === day && x.allDay)
              .map((item) => (
                <Btn
                  key={item.id}
                  className="cc-all-day-event"
                  onClick={(e) => onSelect(item, e.currentTarget)}
                >
                  {item.title}
                </Btn>
              ))}
          </div>
        ))}
      </div>
      <div className="cc-time-scroll" ref={scrollRef}>
        <div className="cc-time-grid">
          <div className="cc-hour-labels">
            {HOURS.map((h) => (
              <span key={h} style={{ top: h * 64 }}>
                {clock(h * 60)}
              </span>
            ))}
          </div>
          {dates.map((date, day) => (
            <div
              className={`cc-day-column ${day > 4 ? "cc-weekend" : ""}`}
              key={dateKey(date)}
              aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일 ${DAYS[day]}요일`}
            >
              {place(
                items.filter((x) => x.day === day),
                referenceTime.minute,
              ).map(({ item, lane, lanes }) => {
                const height =
                  (spanEnd(item, referenceTime.minute) - item.start) *
                  MINUTE_PX;
                const positioning = {
                  top: item.start * MINUTE_PX,
                  left: `calc(${(lane * 100) / lanes}% + 4px)`,
                  width: `calc(${100 / lanes}% - 8px)`,
                  ...(item.kind === "event" ? { height } : {}),
                  "--cc-span": `${height}px`,
                } as CSSProperties;
                return (
                  <Btn
                    key={item.id}
                    className={`cc-item cc-item-${item.kind} cc-status-${item.status ?? "event"} ${selectedId === item.id ? "cc-item-selected" : ""}`}
                    style={positioning}
                    onClick={(e) => onSelect(item, e.currentTarget)}
                    aria-label={`${KIND_LABEL[item.kind]} ${item.title}, ${timeLabel(item)}${item.status ? ", " + STATUS_LABEL[item.status] : ""}`}
                  >
                    {item.kind === "run" && (
                      <span className="cc-run-rail" aria-hidden="true" />
                    )}
                    <span className="cc-item-title">
                      <TypeMark item={item} />
                      <span>{item.title}</span>
                    </span>
                    <span className="cc-item-time">
                      {timeLabel(item)}
                      {item.automatic ? " · 자동" : ""}
                    </span>
                    {item.kind === "run" && (
                      <span className="cc-item-status">
                        {STATUS_LABEL[item.status!]}
                      </span>
                    )}
                  </Btn>
                );
              })}
              {inSampleWeek && day === referenceTime.day && (
                <div
                  className="cc-now-line"
                  style={{ top: referenceTime.minute * MINUTE_PX }}
                >
                  <span>예시 {clock(referenceTime.minute)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
