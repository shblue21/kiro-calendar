import { ControlRow } from "../layout/Controls";
import { Input } from "@kirocrew/app-sdk/ui";
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
import { countItems } from "./count";
import { MonthView } from "./MonthView";
import { calendarRange, movePeriod } from "./period";
import type {
  CalendarLayout,
  CalendarReferenceTime,
  CalendarView,
  CalendarViewItem,
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
  status: "loading" | "ready";
  onAdd: (seed?: EventSeed) => void;
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
}: Props) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { ref: contentRef, width: contentWidth } = useElementWidth<HTMLDivElement>();
  const narrow = contentWidth > 0 && contentWidth < VIEW_LAYOUT.listBelowPx;
  const [showEvents, setShowEvents] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const eventButtons = useRef(new Map<string, HTMLButtonElement>());
  const registerButton = useCallback((id: string, button: HTMLButtonElement | null) => {
    if (button) eventButtons.current.set(id, button);
    else eventButtons.current.delete(id);
  }, []);
  const dates =
    view === "day"
      ? [focusDate]
      : weekdays().map((_, day) => shift(weekStart, offset * 7 + day));
  const gridFirst = dayOffset(dateKey(dates[0]), weekStart);
  const effectiveLayout = narrow && view === "week" ? "list" : layout;
  const isCurrentPeriod =
    referenceTime.day >= gridFirst && referenceTime.day < gridFirst + dates.length;
  const range = calendarRange(focusDate, view, weekStart, effectiveLayout);
  const periodItems = suppliedItems.filter(
    (item) => item.day >= range.first && item.day < range.end,
  );
  const matches = (item: CalendarViewItem) =>
    showEvents &&
    (!query.trim() ||
      `${item.title} ${item.description} ${sourceLabel(item)} ${deliveryLabel(item.deliveryState)} `
        .toLowerCase()
        .includes(query.trim().toLowerCase()));
  const canonicalItems = periodItems.filter(matches);
  const items = canonicalItems.map((item) => ({
    ...item,
    day: item.day - gridFirst,
  }));
  const selected = canonicalItems.find((item) => item.id === selectedId);
  const filteredOut = periodItems.length > 0 && items.length === 0;
  const rangeLabel =
    view === "day"
      ? formatDate(focusDate, {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
        })
      : view === "year"
        ? formatDate(focusDate, { year: "numeric" })
        : view === "month"
          ? formatDate(focusDate, { year: "numeric", month: "long" })
          : `${formatDate(dates[0])} – ${formatDate(dates[6])}`;
  useEffect(() => {
    if (jump) {
      setSelectedId(jump.id);
      setQuery("");
      setShowEvents(true);
    }
  }, [jump]);
  const closeDetail = () => {
    setSelectedId(null);
    if (selectedId) eventButtons.current.get(selectedId)?.focus();
  };
  function select(item: CalendarViewItem) {
    const canonical = suppliedItems.find((i) => i.id === item.id);
    if (canonical && (canonical.day < range.first || canonical.day >= range.end))
      onFocusDate(shift(weekStart, canonical.day));
    setSelectedId(item.id);
  }
  function moveDate(next: CivilDate) {
    onFocusDate(next);
    setSelectedId(null);
  }
  function toggleEvents() {
    setShowEvents((value) => !value);
    if (selected) closeDetail();
  }
  function closeSearch() {
    setQuery("");
    setSearchOpen(false);
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
          onPrevious={() => moveDate(movePeriod(focusDate, view, -1))}
          onNext={() => moveDate(movePeriod(focusDate, view, 1))}
          onReset={() => moveDate(shift(weekStart, referenceTime.day))}
          view={view}
          layout={effectiveLayout}
          onLayout={onLayout}
          narrow={narrow}
          onView={onView}
          showEvents={showEvents}
          onToggle={toggleEvents}
          searchOpen={searchOpen}
          onSearch={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
        />
        {searchOpen && (
          <div className="cc-search-row">
            <ControlRow
              fieldMaxWidth={430}
              field={
                <Input
                  autoFocus
                  aria-label={t("common.search")}
                  placeholder={t("calendar.searchPlaceholder", {
                    period:
                      view === "day"
                        ? t("common.thisDay")
                        : view === "year"
                          ? t("common.thisYear")
                          : view === "month"
                            ? t("common.theDisplayedCalendar")
                            : t("common.thisWeek"),
                  })}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              }
              meta={t("calendar.eventCount", { count: countItems(canonicalItems) })}
              action={<Btn onClick={closeSearch}>{t("common.close")}</Btn>}
            />
          </div>
        )}
        {notice}
        <div
          className={`cc-workspace ${selected ? "cc-has-detail" : ""} ${contentWidth >= VIEW_LAYOUT.dockDetailAbovePx ? "cc-detail-docked" : "cc-detail-overlay"}`}
        >
          <section className="cc-main" aria-label={t("common.calendarGrid")}>
            {status === "loading" ? (
              <div className="cc-state-panel" role="status">
                <h3>{t("common.loadingEvents")}</h3>
                <p>{t("calendar.loadingDescription")}</p>
                <Btn disabled>{t("common.loading")}</Btn>
              </div>
            ) : effectiveLayout === "calendar" && view === "month" ? (
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
            ) : effectiveLayout === "calendar" && view === "year" ? (
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
            ) : items.length === 0 && (effectiveLayout === "list" || filteredOut) ? (
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
                    setShowEvents(true);
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
              actions={eventActions(selected.id)}
              onClose={closeDetail}
            />
          )}
        </div>
      </div>
    </>
  );
}
