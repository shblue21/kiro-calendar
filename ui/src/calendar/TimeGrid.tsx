import type { RegisterEventButton } from "./EventButton";
import { EventButton } from "./EventButton";
import { calendarStyle } from "./color";
import { seedAtMinute } from "./creation";
import type { EventSeed } from "./creation";
import { formatDate } from "../i18n/format";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef } from "react";
import { weekdays } from "../i18n/format.ts";
import { t } from "../i18n/index.ts";
import { DateBadge } from "./DateBadge";
import { dateKey } from "./dates";
import type { CivilDate } from "./dates.ts";
import { statusLabel, timeLabel } from "./format";
import { place, minuteOffset, WEEK_LAYOUT } from "./layout";
import { dayTimeline, elapsedMinute, zonedInput } from "./time";
import type { CalendarReferenceTime, CalendarViewItem } from "./types";
type Props = {
  timezone: string;
  onDay: (date: CivilDate) => void;
  onAdd: (seed: EventSeed) => void;
  items: readonly CalendarViewItem[];
  dates: CivilDate[];
  referenceTime: CalendarReferenceTime;
  isCurrentPeriod: boolean;
  registerButton: RegisterEventButton;
  selectedId?: string;
  onSelect: (item: CalendarViewItem) => void;
};
export function TimeGrid({
  timezone,
  onDay,
  onAdd,
  items,
  dates,
  referenceTime,
  isCurrentPeriod,
  registerButton,
  selectedId,
  onSelect,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstDay = dateKey(dates[0]);
  const timelineKey = dates.map(dateKey).join("|");
  const timelines = useMemo(
    () => timelineKey.split("|").map((day) => dayTimeline(day, timezone)),
    [timelineKey, timezone],
  );
  const separateClocks = timelines.some((day) => day.clockChanges);
  const gridMinutes = Math.max(...timelines.map((day) => day.durationMinutes));
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
      <div
        className="cc-time-scroll"
        ref={scrollRef}
        style={{ "--cc-day-columns": dates.length } as CSSProperties}
      >
        <div className="cc-grid-head">
          <div className="cc-grid-corner" />
          {dates.map((date, i) => (
            <button
              type="button"
              key={dateKey(date)}
              className="cc-day-heading"
              onClick={() => onDay(date)}
              aria-label={t("calendar.openDay", { date: formatDate(date) })}
            >
              <span>{weekdays()[date.dayOfWeek - 1]}</span>
              <DateBadge
                className="cc-date-number"
                day={date.day}
                today={isCurrentPeriod && i === referenceTime.day}
              />
            </button>
          ))}
        </div>
        <div className="cc-all-day">
          <span>{t("common.allDay")}</span>
          {dates.map((_, day) => (
            <div key={day}>
              {items
                .filter((x) => x.day === day && x.allDay)
                .map((item) => (
                  <EventButton
                    eventId={item.id}
                    registerButton={registerButton}
                    selected={selectedId === item.id}
                    key={item.id}
                    className="cc-all-day-event"
                    style={calendarStyle(item.calendarColor)}
                    onClick={() => onSelect(item)}
                  >
                    {item.title}
                  </EventButton>
                ))}
            </div>
          ))}
        </div>
        {separateClocks && (
          <p className="cc-time-axis-note">{t("calendar.clockChangeNotice")}</p>
        )}
        <div
          className="cc-time-grid"
          style={
            {
              "--cc-hour-height": `${WEEK_LAYOUT.hourHeightPx}px`,
              "--cc-day-height": `${minuteOffset(gridMinutes)}px`,
            } as CSSProperties
          }
        >
          <div className="cc-hour-labels">
            {!separateClocks &&
              timelines[0].ticks.map((tick) => (
                <span key={tick.minute} style={{ top: minuteOffset(tick.minute) }}>
                  {tick.label}
                </span>
              ))}
          </div>
          {dates.map((date, day) => (
            <div
              className={`cc-day-column ${date.dayOfWeek >= 6 ? "cc-weekend" : ""}`}
              style={
                {
                  height: minuteOffset(timelines[day].durationMinutes),
                  "--cc-clock-gutter": separateClocks ? "60px" : "0px",
                } as CSSProperties
              }
              key={dateKey(date)}
              tabIndex={0}
              role="group"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  const y =
                    event.clientY - event.currentTarget.getBoundingClientRect().top;
                  onAdd(
                    seedAtMinute(date, timezone, (y / WEEK_LAYOUT.hourHeightPx) * 60),
                  );
                }
              }}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && event.key === "Enter") {
                  event.preventDefault();
                  onAdd({ date });
                }
              }}
              aria-label={t("calendar.dayLabel", {
                month: date.month,
                day: date.day,
                weekday: weekdays()[date.dayOfWeek - 1],
              })}
            >
              {separateClocks &&
                timelines[day].ticks.map((tick) => (
                  <span
                    key={tick.minute}
                    className="cc-day-clock"
                    style={{ top: minuteOffset(tick.minute) }}
                  >
                    {tick.label.split(" ").map((part) => (
                      <span key={part}>{part}</span>
                    ))}
                  </span>
                ))}
              {place(items.filter((x) => x.day === day)).map(
                ({ item, lane, lanes, geometry }) => {
                  const status = statusLabel(item);
                  const positioning = {
                    top: geometry.topPx,
                    "--cc-lane-width": `calc((100% - var(--cc-clock-gutter)) / ${lanes})`,
                    left: `calc(var(--cc-lane-width) * ${lane} + var(--cc-lane-gap))`,
                    width: "calc(var(--cc-lane-width) - 2 * var(--cc-lane-gap))",
                    height: geometry.heightPx,
                    "--cc-span": `${geometry.durationMarkHeightPx}px`,
                  } as CSSProperties;
                  return (
                    <EventButton
                      eventId={item.id}
                      registerButton={registerButton}
                      selected={selectedId === item.id}
                      key={item.id}
                      className={`cc-item cc-item-event ${geometry.compact ? "cc-item-event-short" : ""}`}
                      style={{
                        ...positioning,
                        ...calendarStyle(item.calendarColor),
                      }}
                      onClick={() => onSelect(item)}
                      aria-label={`${status || t("common.event")} ${item.title}, ${timeLabel(item)}`}
                      title={[status, item.title, timeLabel(item)]
                        .filter(Boolean)
                        .join(" · ")}
                    >
                      <span className="cc-item-title">
                        <span>{item.title}</span>
                      </span>
                      <span className="cc-item-meta">
                        {status && <span className="cc-event-status">{status}</span>}
                        <span className="cc-item-time">{timeLabel(item)}</span>
                      </span>
                    </EventButton>
                  );
                },
              )}
              {isCurrentPeriod && day === referenceTime.day && (
                <div
                  className="cc-now-line"
                  style={{
                    top: minuteOffset(
                      elapsedMinute(referenceTime.instant, timelines[day]),
                    ),
                  }}
                >
                  <span>
                    {t("common.now")}
                    {zonedInput(referenceTime.instant, timezone).slice(11)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
