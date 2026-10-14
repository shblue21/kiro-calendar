import type { EventSeed } from "./creation";
import { useElementWidth } from "./useElementWidth";
import { VIEW_LAYOUT } from "./layout";
import { sourceLabel, deliveryLabel } from "./format";
import { Btn } from "@kirocrew/app-sdk/ui";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatDate, weekdays } from "../i18n/format.ts";
import { t } from "../i18n/index.ts";
import { ArrowUpRight, CalendarDays } from "../platform/kiro/icons";
import { AgendaView } from "./AgendaView";
import { CalendarToolbar } from "./CalendarToolbar";
import { dateKey, dayOffset, shift } from "./dates";
import type { CivilDate } from "./dates.ts";
import { DetailPanel } from "./DetailPanel";
import { STATUS_LABEL } from "./format";
import { MonthView } from "./MonthView";
import { calendarRange, movePeriod } from "./period";
import { dayBounds, elapsedMinute } from "./time";
import type {
  CalendarLayers,
  CalendarLayout,
  CalendarReferenceTime,
  CalendarView,
  CalendarViewItem,
  Kind,
} from "./types";
import { TimeGrid } from "./TimeGrid";
import { YearView } from "./YearView";
type Props = {
  timezone: string;
  items: readonly CalendarViewItem[];
  weekStart: CivilDate;
  referenceTime: CalendarReferenceTime;
  view: CalendarView;
  layout: CalendarLayout;
  onLayout: (layout: CalendarLayout) => void;
  onView: (view: CalendarView) => void;
  notice?: ReactNode;
  onReload: () => void;
  eventActions: (id: string) => ReactNode;
  focusDate: CivilDate;
  onFocusDate: (date: CivilDate) => void;
  offset: number;
  jump?: {
    id: string;
    serial: number;
  };
  status: "loading" | "error" | "ready";
  onAdd: (seed?: EventSeed) => void;
  onEdit: (item: CalendarViewItem) => void;
};
export function CalendarPage({
  timezone,
  items: suppliedItems,
  weekStart,
  referenceTime,
  view,
  layout,
  onLayout,
  onView,
  notice,
  onReload,
  eventActions,
  focusDate,
  onFocusDate,
  offset,
  jump,
  status,
  onAdd,
  onEdit,
}: Props) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { ref: contentRef, width: contentWidth } =
    useElementWidth<HTMLDivElement>();
  const narrow = contentWidth > 0 && contentWidth < VIEW_LAYOUT.listBelowPx;
  const [layers, setLayers] = useState<CalendarLayers>({
    event: true,
    trigger: true,
    run: true,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const eventButtons = useRef(new Map<string, HTMLButtonElement>());
  const registerButton = useCallback(
    (id: string, button: HTMLButtonElement | null) => {
      if (button) eventButtons.current.set(id, button);
      else eventButtons.current.delete(id);
    },
    [],
  );
  const dates =
    view === "day"
      ? [focusDate]
      : weekdays().map((_, day) => shift(weekStart, offset * 7 + day));
  const gridFirst = dayOffset(dateKey(dates[0]), weekStart);
  const effectiveView = view;
  const effectiveLayout = narrow && view === "week" ? "list" : layout;
  const isCurrentPeriod =
    referenceTime.day >= gridFirst &&
    referenceTime.day < gridFirst + dates.length;
  const range = calendarRange(
    focusDate,
    effectiveView,
    weekStart,
    effectiveLayout,
  );
  const periodItems = suppliedItems.filter(
    (item) => item.day >= range.first && item.day < range.end,
  );
  const matches = (item: CalendarViewItem) =>
    layers[item.kind] &&
    (!query.trim() ||
      `${item.title} ${item.description} ${sourceLabel(item)} ${deliveryLabel(item.deliveryState)} ${item.status ? STATUS_LABEL[item.status] : ""} ${item.artifact ?? ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()));
  const canonicalItems = periodItems.filter(matches);
  const items = canonicalItems.map((item) => ({
    ...item,
    day: item.day - gridFirst,
  }));
  const selectedCanonical = canonicalItems.find(
    (item) => item.id === selectedId,
  );
  const selectedWeek = selectedCanonical
    ? Math.floor(selectedCanonical.day / 7)
    : offset;
  const detailDates = weekdays().map((_, day) =>
    shift(weekStart, selectedWeek * 7 + day),
  );
  const selected = selectedCanonical
    ? { ...selectedCanonical, day: selectedCanonical.day - selectedWeek * 7 }
    : undefined;
  const filteredOut = periodItems.length > 0 && items.length === 0;
  const rangeLabel =
    effectiveView === "day"
      ? formatDate(focusDate, {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
        })
      : effectiveView === "year"
        ? formatDate(focusDate, { year: "numeric" })
        : effectiveView === "month"
          ? formatDate(focusDate, { year: "numeric", month: "long" })
          : `${formatDate(dates[0])} – ${formatDate(dates[6])}`;
  useEffect(() => {
    if (jump) {
      setSelectedId(jump.id);
      setQuery("");
      setLayers({ event: true, trigger: true, run: true });
    }
  }, [jump]);
  const closeDetail = () => {
    setSelectedId(null);
    if (selectedId) eventButtons.current.get(selectedId)?.focus();
  };
  function select(item: CalendarViewItem) {
    const canonical = suppliedItems.find((i) => i.id === item.id);
    if (
      canonical &&
      (canonical.day < range.first || canonical.day >= range.end)
    )
      onFocusDate(shift(weekStart, canonical.day));
    setSelectedId(item.id);
  }
  function moveDate(next: CivilDate) {
    onFocusDate(next);
    setSelectedId(null);
  }
  function toggle(kind: Kind) {
    setLayers((previous) => ({ ...previous, [kind]: !previous[kind] }));
    if (selected?.kind === kind) closeDetail();
  }
  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]"))
        closeDetail();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);
  return (
    <>
      <div className="cc-content" ref={contentRef}>
        <CalendarToolbar
          range={rangeLabel}
          date={focusDate}
          onDate={moveDate}
          onPrevious={() => moveDate(movePeriod(focusDate, effectiveView, -1))}
          onNext={() => moveDate(movePeriod(focusDate, effectiveView, 1))}
          onReset={() => moveDate(shift(weekStart, referenceTime.day))}
          view={effectiveView}
          layout={effectiveLayout}
          onLayout={onLayout}
          narrow={narrow}
          onView={onView}
          layers={layers}
          onToggle={toggle}
          searchOpen={searchOpen}
          onSearch={() => setSearchOpen((value) => !value)}
        />
        {searchOpen && (
          <div className="cc-search-row">
            <input
              className="cc-control"
              autoFocus
              aria-label={t("common.search")}
              placeholder={t("calendar.searchPlaceholder", {
                period:
                  effectiveView === "day"
                    ? t("common.thisDay")
                    : effectiveView === "year"
                      ? t("common.thisYear")
                      : effectiveView === "month"
                        ? t("common.theDisplayedCalendar")
                        : t("common.thisWeek"),
              })}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span>{t("calendar.eventCount", { count: items.length })}</span>
            <Btn
              onClick={() => {
                setQuery("");
                setSearchOpen(false);
              }}
            >
              {t("common.close")}
            </Btn>
          </div>
        )}
        {notice}
        <div
          className={`cc-workspace ${selected ? "cc-has-detail" : ""} ${contentWidth >= VIEW_LAYOUT.dockDetailAbovePx ? "cc-detail-docked" : "cc-detail-overlay"}`}
        >
          <section className="cc-main" aria-label={t("common.calendarGrid")}>
            {status === "loading" || status === "error" ? (
              <div className="cc-state-panel" role="status">
                <h3>
                  {status === "loading"
                    ? t("common.loadingEvents")
                    : t("common.eventsLoadErrorHeading")}
                </h3>
                <p>
                  {status === "loading"
                    ? t("calendar.loadingDescription")
                    : t("calendar.connectionRetry")}
                </p>
                <Btn onClick={onReload} disabled={status === "loading"}>
                  {status === "loading"
                    ? t("common.loading")
                    : t("common.tryAgain")}
                </Btn>
              </div>
            ) : effectiveLayout === "calendar" && effectiveView === "month" ? (
              <MonthView
                date={focusDate}
                base={weekStart}
                today={shift(weekStart, referenceTime.day)}
                items={canonicalItems}
                registerButton={registerButton}
                selectedId={selectedId ?? undefined}
                onSelect={select}
                onAdd={(date) => onAdd({ date })}
                onDay={(day) => {
                  moveDate(day);
                  onView("day");
                }}
              />
            ) : effectiveLayout === "calendar" && effectiveView === "year" ? (
              <YearView
                date={focusDate}
                base={weekStart}
                today={shift(weekStart, referenceTime.day)}
                items={canonicalItems}
                onMonth={(month) => {
                  moveDate(month);
                  onView("month");
                }}
              />
            ) : items.length === 0 &&
              (effectiveLayout === "list" || filteredOut) ? (
              <div className="cc-empty">
                <div className="cc-empty-icon">
                  <CalendarDays size={32} />
                </div>
                <h3>
                  {filteredOut
                    ? t("calendar.noMatches")
                    : suppliedItems.length === 0
                      ? t("calendar.empty")
                      : t("calendar.periodEmpty")}
                </h3>
                <p>
                  {filteredOut
                    ? t("calendar.filtersHint")
                    : suppliedItems.length === 0
                      ? t("calendar.emptyDescription")
                      : t("calendar.periodEmptyDescription")}
                </p>
                <Btn
                  primary
                  onClick={() => {
                    setQuery("");
                    setLayers({ event: true, trigger: true, run: true });
                    if (!filteredOut) {
                      onAdd({ date: focusDate });
                    }
                  }}
                >
                  {filteredOut
                    ? t("common.resetSearchAndFilters")
                    : t("common.addEvent")}
                  <ArrowUpRight size={14} />
                </Btn>
                <Btn onClick={onReload}>{t("common.reload")}</Btn>
              </div>
            ) : effectiveLayout === "calendar" ? (
              <TimeGrid
                timezone={timezone}
                items={items}
                dates={dates}
                referenceTime={{
                  ...referenceTime,
                  day: referenceTime.day - gridFirst,
                }}
                isCurrentPeriod={isCurrentPeriod}
                onAdd={onAdd}
                onDay={(date) => {
                  moveDate(date);
                  onView("day");
                }}
                registerButton={registerButton}
                selectedId={selected?.id}
                onSelect={select}
              />
            ) : (
              <AgendaView
                items={canonicalItems}
                base={weekStart}
                today={shift(weekStart, referenceTime.day)}
                registerButton={registerButton}
                selectedId={selected?.id}
                onSelect={select}
              />
            )}
          </section>
          {selected && (
            <DetailPanel
              item={selected}
              items={suppliedItems}
              dates={detailDates}
              referenceMinute={elapsedMinute(
                referenceTime.instant,
                dayBounds(dateKey(detailDates[selected.day]), timezone),
              )}
              actions={
                selected.kind === "event"
                  ? eventActions(selected.id)
                  : undefined
              }
              onEdit={() =>
                onEdit(suppliedItems.find((item) => item.id === selected.id)!)
              }
              onClose={closeDetail}
              onSelect={select}
            />
          )}
        </div>
      </div>
    </>
  );
}
