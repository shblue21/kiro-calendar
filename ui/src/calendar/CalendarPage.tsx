import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Btn } from "@kirocrew/app-sdk/ui";
import { ArrowUpRight, CalendarDays, List } from "../platform/kiro/icons";
import type {
  CalendarViewItem,
  CalendarLayers,
  CalendarReferenceTime,
  CalendarView,
  Kind,
} from "./types";
import { DAYS, shift } from "./dates";
import { clock } from "./format";
import { CalendarToolbar } from "./CalendarToolbar";
import { WeekView } from "./WeekView";
import { AgendaView } from "./AgendaView";
import { DetailPanel } from "./DetailPanel";

type Props = {
  items: readonly CalendarViewItem[];
  weekStart: Date;
  referenceTime: CalendarReferenceTime;
  timeZone: string;
  previewControls?: ReactNode;
  notice?: ReactNode;
  onResetPreview: () => void;
  onOpenEvent: (id: string) => void;
};

export function CalendarPage({
  items: suppliedItems,
  weekStart,
  referenceTime,
  timeZone,
  previewControls,
  notice,
  onResetPreview,
  onOpenEvent,
}: Props) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [view, setView] = useState<CalendarView>("week");
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
  const effectiveView = narrow ? "agenda" : view;
  const inSampleWeek = offset === 0;
  const items = inSampleWeek
    ? suppliedItems.filter((item) => layers[item.kind])
    : [];
  const selected = inSampleWeek
    ? suppliedItems.find((item) => item.id === selectedId && layers[item.kind])
    : undefined;
  const filteredOut =
    inSampleWeek && suppliedItems.length > 0 && items.length === 0;
  const closeDetail = () => {
    setSelectedId(null);
    if (sourceButton.current?.isConnected) sourceButton.current.focus();
  };
  function select(item: CalendarViewItem, button: HTMLButtonElement) {
    // Keep the grid/list opener when following links inside the drawer.
    if (!button.closest(".cc-detail")) sourceButton.current = button;
    setSelectedId(item.id);
  }
  function moveWeek(next: number) {
    setOffset(next);
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
      if (event.key === "Escape") closeDetail();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <>
      <div className="cc-content">
        <div className="cc-calendar-controls">
          <Btn
            aria-expanded={sourcesOpen}
            onClick={() => setSourcesOpen((value) => !value)}
          >
            연결된 캘린더 · 예시
          </Btn>
          <div className="cc-view-switch" aria-label="달력 보기">
            <Btn
              onClick={() => setView("week")}
              aria-pressed={effectiveView === "week"}
              disabled={narrow}
            >
              <CalendarDays size={15} />
              주간
            </Btn>
            <Btn
              onClick={() => setView("agenda")}
              aria-pressed={effectiveView === "agenda"}
            >
              <List size={15} />
              목록
            </Btn>
          </div>
        </div>
        {sourcesOpen && (
          <div className="cc-source-panel">
            <strong>캘린더 연결 상태 예시</strong>
            <p>Google · 업무 일정 / 개인 일정 / Crew 예약과 실행</p>
            <p>실제 계정은 연결하지 않았으며, 아래 화면은 가상 데이터입니다.</p>
          </div>
        )}
        <CalendarToolbar
          dates={dates}
          offset={offset}
          timeZone={timeZone}
          layers={layers}
          onMove={moveWeek}
          onToggle={toggle}
          extra={previewControls}
        />
        {notice}
        <div className={`cc-workspace ${selected ? "cc-has-detail" : ""}`}>
          <section className="cc-main" aria-label="달력">
            {items.length === 0 ? (
              <div className="cc-empty">
                <div className="cc-empty-icon">
                  <CalendarDays size={32} />
                </div>
                <h3>
                  {filteredOut
                    ? "표시할 항목을 선택해 주세요"
                    : suppliedItems.length === 0
                      ? "일정과 AI 작업을 함께 만나보세요"
                      : "이 주에는 샘플 일정이 없습니다"}
                </h3>
                <p>
                  {filteredOut
                    ? "사람 일정, AI 예약, 실제 실행을 켜고 끌 수 있습니다."
                    : suppliedItems.length === 0
                      ? "연결된 일정과 예약된 작업이 이곳에 표시됩니다. 지금은 예시 화면으로 먼저 둘러볼 수 있습니다."
                      : "예시 데이터는 이번 주에만 준비되어 있습니다."}
                </p>
                <Btn
                  primary
                  onClick={() => {
                    setLayers({ event: true, trigger: true, run: true });
                    if (!filteredOut) {
                      setOffset(0);
                      onResetPreview();
                    }
                  }}
                >
                  {filteredOut ? "모두 표시" : "예시 일정 보기"}
                  <ArrowUpRight size={14} />
                </Btn>
              </div>
            ) : effectiveView === "week" ? (
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
                items={items}
                dates={dates}
                referenceTime={referenceTime}
                selectedId={selected?.id}
                onSelect={select}
              />
            )}
            <div className="cc-footer">
              <span>가상 일정 · 실제 예약/실행에 영향을 주지 않습니다</span>
              <span>
                예시 기준: {DAYS[referenceTime.day]}요일{" "}
                {clock(referenceTime.minute)} {timeZone}
              </span>
            </div>
          </section>
          {selected && (
            <DetailPanel
              item={selected}
              items={suppliedItems}
              dates={dates}
              referenceTime={referenceTime}
              timeZone={timeZone}
              onOpenEvent={onOpenEvent}
              onClose={closeDetail}
              onSelect={select}
            />
          )}
        </div>
      </div>
    </>
  );
}
