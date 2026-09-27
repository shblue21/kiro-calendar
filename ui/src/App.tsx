import { useMemo, useReducer, useState } from "react";
import { Badge, Btn, PageHeader } from "@kirocrew/app-sdk/ui";
import { CalendarPage } from "./calendar/CalendarPage";
import type { CalendarViewItem } from "./calendar/types";
import { ITEMS, SAMPLE_NOW } from "./preview/fixtures";
import { PreviewControls, PreviewNotice } from "./preview/PreviewControls";
import type { PreviewScene } from "./preview/PreviewControls";
import {
  PREVIEW_TASKS,
  calendarTasks,
  workspaceReducer,
} from "./preview/workspace";
import { EventWorkspace } from "./work/EventWorkspace";
import { AutoSchedulePage } from "./work/AutoSchedulePage";
import { CalendarDays, MessageSquare, Sparkles } from "./platform/kiro/icons";
import styles from "./styles.css?inline";
const EMPTY_ITEMS: readonly CalendarViewItem[] = [];
const PAGES = [
  { id: "calendar", label: "캘린더", icon: CalendarDays },
  { id: "work", label: "연결된 작업", icon: MessageSquare },
  { id: "auto", label: "자동 예약", icon: Sparkles },
] as const;
export default function CalendarPreview() {
  const [weekStart] = useState(() => new Date(2026, 8, 28, 12));
  const [scene, setScene] = useState<PreviewScene>("sample");
  const [page, setPage] = useState<"calendar" | "work" | "auto">("calendar");
  const [eventId, setEventId] = useState("review");
  const [state, dispatch] = useReducer(workspaceReducer, {
    autoOn: true,
    tasks: PREVIEW_TASKS,
  });
  const items = useMemo(
    () => [...ITEMS, ...calendarTasks(state.tasks)],
    [state.tasks],
  );
  const event = ITEMS.find(
    (item) => item.id === eventId && item.kind === "event",
  )!;
  function openEvent(id: string) {
    setEventId(id);
    setPage("work");
  }
  return (
    <div className="cc-calendar">
      <style>{styles}</style>
      <PageHeader
        title={
          <span className="cc-title">
            Calendar <Badge variant="aim">Preview</Badge>
          </span>
        }
        subtitle={
          page === "calendar"
            ? "내 일정과 Crew의 일을 함께."
            : page === "work"
              ? "일정에서 작업을 시작하고, 대화와 결과로 돌아오세요."
              : "Crew가 잡은 다음 일을 확인하고 조정하세요."
        }
        actions={<Badge variant="muted">샘플 데이터 · 실제 연결 없음</Badge>}
      />
      <div
        className="cc-product-tabs"
        role="tablist"
        aria-label="Calendar 메뉴"
      >
        {PAGES.map((p) => (
          <Btn
            key={p.id}
            id={`cc-page-tab-${p.id}`}
            role="tab"
            aria-selected={page === p.id}
            aria-controls={`cc-page-${p.id}`}
            onClick={() => setPage(p.id)}
          >
            <p.icon size={14} />
            {p.label}
            {p.id === "auto" && (
              <span className="cc-auto-nav-state">
                {state.autoOn ? "ON" : "OFF"}
              </span>
            )}
          </Btn>
        ))}
      </div>
      <div
        id="cc-page-calendar"
        className="cc-route-panel"
        role="tabpanel"
        aria-labelledby="cc-page-tab-calendar"
        hidden={page !== "calendar"}
      >
        <CalendarPage
          items={scene === "empty" ? EMPTY_ITEMS : items}
          weekStart={weekStart}
          referenceTime={SAMPLE_NOW}
          timeZone="Asia/Seoul"
          previewControls={
            <PreviewControls scene={scene} onChange={setScene} />
          }
          notice={
            scene === "partial" ? (
              <PreviewNotice onRecover={() => setScene("sample")} />
            ) : undefined
          }
          onResetPreview={() => setScene("sample")}
          onOpenEvent={openEvent}
        />
      </div>
      <div
        id="cc-page-work"
        className="cc-route-panel"
        role="tabpanel"
        aria-labelledby="cc-page-tab-work"
        hidden={page !== "work"}
      >
        <EventWorkspace
          event={event}
          state={state}
          dispatch={dispatch}
          weekStart={weekStart}
          onBack={() => setPage("calendar")}
        />
      </div>
      <div
        id="cc-page-auto"
        className="cc-route-panel"
        role="tabpanel"
        aria-labelledby="cc-page-tab-auto"
        hidden={page !== "auto"}
      >
        <AutoSchedulePage
          state={state}
          dispatch={dispatch}
          weekStart={weekStart}
          onOpenEvent={openEvent}
        />
      </div>
    </div>
  );
}
