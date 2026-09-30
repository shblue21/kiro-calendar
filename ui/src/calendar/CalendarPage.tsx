import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Btn } from "@kirocrew/app-sdk/ui";
import { ArrowUpRight, CalendarDays } from "../platform/kiro/icons";
import type {
  CalendarViewItem,
  CalendarLayers,
  CalendarReferenceTime,
  CalendarView,
  CalendarLayout,
  Kind,
} from "./types";
import { STATUS_LABEL } from "./format";
import { MonthView } from "./MonthView";
import { YearView } from "./YearView";
import { calendarRange, movePeriod } from "./period";
import { DAYS, shift } from "./dates";
import { CalendarToolbar } from "./CalendarToolbar";
import { WeekView } from "./WeekView";
import { AgendaView } from "./AgendaView";
import { DetailPanel } from "./DetailPanel";

type Props = {
  items: readonly CalendarViewItem[];
  weekStart: Date;
  referenceTime: CalendarReferenceTime;
  view: CalendarView;
  layout: CalendarLayout;
  onLayout: (layout: CalendarLayout) => void;
  onView: (view: CalendarView) => void;
  notice?: ReactNode;
  onResetPreview: () => void;
  eventActions: (id: string) => ReactNode;
  focusDate: Date;
  onFocusDate: (date: Date) => void;
  offset: number;
  onOffset: (offset: number) => void;
  jump?: { id: string; serial: number };
  scene: string;
  onAdd: () => void;
  onEdit: (item: CalendarViewItem) => void;
};

export function CalendarPage({
  items: suppliedItems,
  weekStart,
  referenceTime,
  view,
  layout,
  onLayout,
  onView,
  notice,
  onResetPreview,
  eventActions,
  focusDate,
  onFocusDate,
  offset,
  onOffset,
  jump,
  scene,
  onAdd,
  onEdit,
}: Props) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const setOffset = onOffset;
  const [narrow, setNarrow] = useState(
    () => window.matchMedia("(max-width: 760px)").matches,
  );
  const [layers, setLayers] = useState<CalendarLayers>({
    event: true,
    trigger: true,
    run: true,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sourceButton = useRef<HTMLButtonElement | null>(null);
  const dates = DAYS.map((_, day) => shift(weekStart, offset * 7 + day));
  const effectiveView = view;
  const effectiveLayout = narrow && view === "week" ? "list" : layout;
  const inSampleWeek = offset === 0;
  const range = calendarRange(focusDate, effectiveView, weekStart, effectiveLayout);
  const periodItems = suppliedItems.filter((item) => item.day >= range.first && item.day < range.end);
  const matches = (item: CalendarViewItem) => layers[item.kind] &&
    (!query.trim() || `${item.title} ${item.description} ${item.source} ${item.status ? STATUS_LABEL[item.status] : ""} ${item.artifact ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const canonicalItems = periodItems.filter(matches);
  const items = canonicalItems.map((item) => ({ ...item, day: item.day - offset * 7 }));
  const selectedCanonical = canonicalItems.find((item) => item.id === selectedId);
  const selectedWeek = selectedCanonical ? Math.floor(selectedCanonical.day / 7) : offset;
  const detailDates = DAYS.map((_, day) => shift(weekStart, selectedWeek * 7 + day));
  const selected = selectedCanonical ? { ...selectedCanonical, day: selectedCanonical.day - selectedWeek * 7 } : undefined;
  const filteredOut = periodItems.length > 0 && items.length === 0;
  const rangeLabel = effectiveView === "year" ? `${focusDate.getFullYear()}년`
    : effectiveView === "month" ? `${focusDate.getFullYear()}년 ${focusDate.getMonth() + 1}월`
    : `${dates[0].getFullYear()}년 ${dates[0].getMonth() + 1}월 ${dates[0].getDate()}일–${dates[6].getFullYear() !== dates[0].getFullYear() ? `${dates[6].getFullYear()}년 ` : ""}${dates[6].getMonth() + 1}월 ${dates[6].getDate()}일`;
  useEffect(() => {
    if (jump) {
      setSelectedId(jump.id);
      setQuery("");
      setLayers({ event: true, trigger: true, run: true });
    }
  }, [jump]);
  const closeDetail = () => {
    setSelectedId(null);
    if (sourceButton.current?.isConnected) sourceButton.current.focus();
  };
  function select(item: CalendarViewItem, button: HTMLButtonElement) {
    // Keep the grid/list opener when following links inside the drawer.
    if (!button.closest(".cc-detail")) sourceButton.current = button;
    const canonical = suppliedItems.find((i) => i.id === item.id);
    if (canonical && (canonical.day < range.first || canonical.day >= range.end))
      onFocusDate(shift(weekStart, canonical.day));
    setSelectedId(item.id);
  }
  function moveDate(next: Date) {
    onFocusDate(next);
    setSelectedId(null);
  }
  function toggle(kind: Kind) {
    setLayers((previous) => ({ ...previous, [kind]: !previous[kind] }));
    if (selected?.kind === kind) closeDetail();
  }
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const listener = () => setNarrow(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) closeDetail();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <>
      <div className="cc-content">
        <CalendarToolbar
          range={rangeLabel}
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
              autoFocus
              aria-label="검색어"
              placeholder={`${effectiveView === "year" ? "이 해" : effectiveView === "month" ? "표시된 달력" : "이 주"}의 제목·설명·출처·상태 검색`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span>{items.length}건</span>
            <Btn
              onClick={() => {
                setQuery("");
                setSearchOpen(false);
              }}
            >
              닫기
            </Btn>
          </div>
        )}
        {notice}
        <div className={`cc-workspace ${selected ? "cc-has-detail" : ""}`}>
          <section className="cc-main" aria-label="달력">
            {scene === "loading" || scene === "error" ? (
              <div className="cc-state-panel" role="status">
                <h3>
                  {scene === "loading"
                    ? "일정을 불러오고 있습니다"
                    : "일정을 불러오지 못했습니다"}
                </h3>
                <p>
                  {scene === "loading"
                    ? "로딩 화면 예시입니다."
                    : "연결 상태를 확인한 후 다시 시도해 주세요. 실패 화면 예시입니다."}
                </p>
                <Btn onClick={onResetPreview}>
                  {scene === "loading"
                    ? "불러오기 완료 · 예시"
                    : "다시 시도 · 예시"}
                </Btn>
              </div>
            ) : effectiveLayout === "calendar" && effectiveView === "month" ? (
              <MonthView date={focusDate} base={weekStart} sampleDate={shift(weekStart, referenceTime.day)}
                items={canonicalItems} selectedId={selectedId ?? undefined} onSelect={select}
                onDay={(day) => { moveDate(day); onView("week"); }} />
            ) : effectiveLayout === "calendar" && effectiveView === "year" ? (
              <YearView date={focusDate} base={weekStart} sampleDate={shift(weekStart, referenceTime.day)}
                items={canonicalItems} onMonth={(month) => { moveDate(month); onView("month"); }} />
            ) : items.length === 0 ? (
              <div className="cc-empty">
                <div className="cc-empty-icon">
                  <CalendarDays size={32} />
                </div>
                <h3>
                  {filteredOut
                    ? "검색·표시 조건에 맞는 항목이 없습니다"
                    : suppliedItems.length === 0
                      ? "아직 표시할 일정이 없습니다"
                      : "이 기간에는 샘플 일정이 없습니다"}
                </h3>
                <p>
                  {filteredOut
                    ? "사람 일정, AI 예약, 실제 실행을 켜고 끌 수 있습니다."
                    : suppliedItems.length === 0
                      ? "연결된 일정과 예약된 작업이 이곳에 표시됩니다. 지금은 예시 화면으로 먼저 둘러볼 수 있습니다."
                      : "다른 기간을 선택하거나 예시 날짜로 돌아가세요."}
                </p>
                <Btn
                  primary
                  onClick={() => {
                    setQuery("");
                    setLayers({ event: true, trigger: true, run: true });
                    if (!filteredOut) {
                      setOffset(0);
                      onResetPreview();
                    }
                  }}
                >
                  {filteredOut ? "검색·필터 초기화" : "예시 일정 보기"}
                  <ArrowUpRight size={14} />
                </Btn>
                <Btn onClick={onAdd}>
                  <CalendarDays size={14} />
                  일정 추가
                </Btn>
              </div>
            ) : effectiveLayout === "calendar" ? (
              <WeekView
                items={items}
                dates={dates}
                referenceTime={referenceTime}
                inSampleWeek={inSampleWeek}
                selectedId={selected?.id}
                onSelect={select}
              />
            ) : (
              <AgendaView
                items={canonicalItems}
                base={weekStart}
                sampleDate={shift(weekStart, referenceTime.day)}
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
              referenceTime={referenceTime}
              actions={selected.kind === "event" ? eventActions(selected.id) : undefined}
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
