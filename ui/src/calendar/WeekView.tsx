import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { Btn } from "@kirocrew/app-sdk/ui";
import type { CalendarViewItem, CalendarReferenceTime } from "./types";
import { DAYS, dateKey } from "./dates";
import { KIND_LABEL, STATUS_LABEL, timeLabel } from "./format";
import { place, minuteOffset, WEEK_LAYOUT } from "./layout";
import { TypeMark } from "./TypeMark";
import { dayTimeline, elapsedMinute, zonedInput } from "./time";
import { DateBadge } from "./DateBadge";


type Props = {
  timezone: string;
  items: readonly CalendarViewItem[];
  dates: Date[];
  referenceTime: CalendarReferenceTime;
  isCurrentWeek: boolean;
  selectedId?: string;
  onSelect: (item: CalendarViewItem, button: HTMLButtonElement) => void;
};

export function WeekView({
  timezone,
  items,
  dates,
  referenceTime,
  isCurrentWeek,
  selectedId,
  onSelect,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstDay = dateKey(dates[0]);
  const timelineKey = dates.map(dateKey).join('|');
  const timelines = useMemo(()=>timelineKey.split('|').map(day=>dayTimeline(day,timezone)),[timelineKey,timezone]);
  const separateClocks = timelines.some(day=>day.clockChanges);
  const gridMinutes = Math.max(...timelines.map(day=>day.durationMinutes));
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
      element.scrollTop = minuteOffset(9 * 60);
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
            className="cc-day-heading"
          >
            <span>{DAYS[i]}</span>
            <DateBadge className="cc-date-number" day={date.getDate()} today={isCurrentWeek && i === ((referenceTime.day % 7) + 7) % 7} />
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
      {separateClocks && <p className="cc-time-axis-note">시각 변경이 있는 주입니다. 각 날짜 열의 시각을 기준으로 확인하세요.</p>}
      <div className="cc-time-scroll" ref={scrollRef}>
        <div className="cc-time-grid" style={{"--cc-hour-height": `${WEEK_LAYOUT.hourHeightPx}px`, "--cc-day-height": `${minuteOffset(gridMinutes)}px`} as CSSProperties}>
          <div className="cc-hour-labels">
            {!separateClocks && timelines[0].ticks.map((tick) => (
              <span key={tick.minute} style={{top:minuteOffset(tick.minute)}}>{tick.label}</span>
            ))}
          </div>
          {dates.map((date, day) => (
            <div
              className={`cc-day-column ${day > 4 ? "cc-weekend" : ""}`}
              style={{height:minuteOffset(timelines[day].durationMinutes), "--cc-clock-gutter": separateClocks ? "60px" : "0px"} as CSSProperties}
              key={dateKey(date)}
              aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일 ${DAYS[day]}요일`}
            >
              {separateClocks && timelines[day].ticks.map(tick=><span key={tick.minute} className="cc-day-clock" style={{top:minuteOffset(tick.minute)}}>{tick.label.split(" ").map(part=><span key={part}>{part}</span>)}</span>)}
              {place(
                items.filter((x) => x.day === day),
                elapsedMinute(referenceTime.instant,timelines[day]),
              ).map(({ item, lane, lanes, geometry }) => {
                const positioning = {
                  top: geometry.topPx,
                  left: `calc((100% - var(--cc-clock-gutter)) * ${lane / lanes} + 4px)`,
                  width: `calc((100% - var(--cc-clock-gutter)) / ${lanes} - 8px)`,
                  height: geometry.heightPx,
                  "--cc-span": `${geometry.durationMarkHeightPx}px`,
                } as CSSProperties;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`cc-item cc-item-${item.kind} ${geometry.compact ? "cc-item-event-short" : ""} cc-status-${item.status ?? "event"} ${selectedId === item.id ? "cc-item-selected" : ""}`}
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
                  </button>
                );
              })}
              {isCurrentWeek && day === ((referenceTime.day % 7) + 7) % 7 && (
                <div
                  className="cc-now-line"
                  style={{ top: minuteOffset(elapsedMinute(referenceTime.instant,timelines[day])) }}
                >
                  <span>현재 {zonedInput(referenceTime.instant,timezone).slice(11)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
