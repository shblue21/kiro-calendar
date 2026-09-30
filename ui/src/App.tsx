import { useMemo, useReducer, useRef, useState } from "react";
import { Btn } from "@kirocrew/app-sdk/ui";
import { CalendarPage } from "./calendar/CalendarPage";
import type { CalendarViewItem, CalendarView, CalendarLayout } from "./calendar/types";
import { EVENT_LINKS, ITEMS, SAMPLE_NOW } from "./preview/fixtures";
import type { EventLink } from "./preview/fixtures";
import { PreviewNotice } from "./preview/PreviewControls";
import type { PreviewScene } from "./preview/PreviewControls";
import {
  PREVIEW_TASKS,
  calendarTasks,
  workspaceReducer,
} from "./preview/workspace";
import type { PreviewTask } from "./preview/workspace";
import { EventActions } from "./work/EventActions";
import { AutoSchedulePage } from "./work/AutoSchedulePage";
import {
  ArrowLeft,
  Settings2,
  Plus,
  CalendarDays,
  Sparkles,
} from "./platform/kiro/icons";
import { SettingsPage } from "./settings/SettingsPage";
import { ConnectionDialog } from "./settings/ConnectionDialog";
import type { PreviewConnection } from "./settings/ConnectionDialog";
import { ItemEditor } from "./calendar/ItemEditor";
import type { EditorSession } from "./calendar/ItemEditor";
import { blankDraft, dayOffset, minuteValue } from "./calendar/editor";
import type { EditorDraft } from "./calendar/editor";
import { dateKey, shift } from "./calendar/dates";
import { calendarRange } from "./calendar/period";
import { clock } from "./calendar/format";
import styles from "./styles.css?inline";
const EMPTY_ITEMS: readonly CalendarViewItem[] = [];
const PROPOSAL_LINK: EventLink = { state: "origin", conversation: "지원서 작성 대화", proposedOn: "9/30" };
const initialTasks: PreviewTask[] = [
  ...PREVIEW_TASKS,
  ...ITEMS.filter((i) => i.kind === "trigger").map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    day: i.day,
    minute: i.start,
    status: "scheduled" as const,
    automatic: false,
    source: "직접 만든 샘플 예약",
    quote: i.description,
    reason: "사용자가 요청",
    repeat: "none" as const,
  })),
];
export default function CalendarPreview() {
  const [weekStart] = useState(() => new Date(2026, 8, 28, 12));
  const [scene, setScene] = useState<PreviewScene>("sample");
  const [page, setPage] = useState<"calendar" | "auto" | "settings">(
    "calendar",
  );
  const [view, setView] = useState<CalendarView>("week");
  const [layout, setLayout] = useState<CalendarLayout>("calendar");
  const [focusDate, setFocusDate] = useState(() => shift(weekStart, SAMPLE_NOW.day));
  const offset = Math.floor(dayOffset(dateKey(focusDate), weekStart) / 7);
  function setOffset(value: number) { setFocusDate(shift(weekStart, value * 7 + SAMPLE_NOW.day)); }
  const [baseItems, setBaseItems] = useState(() =>
    ITEMS.filter((i) => i.kind !== "trigger"),
  );
  const [state, dispatch] = useReducer(workspaceReducer, {
    autoOn: true,
    tasks: initialTasks,
  });
  const [editor, setEditor] = useState<EditorSession | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connections, setConnections] = useState<PreviewConnection[]>([
    {
      id: "Google Calendar",
      provider: "Google Calendar",
      calendars: ["업무 일정"],
    },
  ]);
  const [links, setLinks] = useState<Record<string, EventLink>>(EVENT_LINKS);
  const retryTimer = useRef<number>();
  function setLink(id: string, link?: EventLink) {
    setLinks((all) => {
      const next = { ...all };
      if (link) next[id] = link;
      else delete next[id];
      return next;
    });
  }
  const [proposalOn, setProposalOn] = useState(false);
  const [proposalStatus, setProposalStatus] = useState<"pending" | "registered" | "dismissed">("pending");
  const [feedback, setFeedback] = useState("");
  const [undo, setUndo] = useState<(() => void) | null>(null);
  const [jump, setJump] = useState<
    { id: string; serial: number } | undefined
  >();
  const items = useMemo(
    () => [...baseItems, ...calendarTasks(state.tasks, offset, calendarRange(focusDate, view, weekStart))],
    [baseItems, state.tasks, offset, focusDate, view, weekStart],
  );
  const events = baseItems.filter((i) => i.kind === "event");
  function notify(message: string) {
    setFeedback(message);
    setUndo(null);
  }
  function openEvent(id: string) {
    if (!events.some((i) => i.id === id)) {
      notify("원본 일정이 삭제되었습니다. 연결된 작업은 그대로 유지됩니다.");
      return;
    }
    const item = events.find((i) => i.id === id)!;
    setFocusDate(shift(weekStart, item.day));
    setPage("calendar");
    setJump({ id, serial: Date.now() });
  }
  function eventActions(id: string) {
    const item = events.find((i) => i.id === id);
    if (!item) return null;
    return (
      <EventActions
        link={links[id]}
        tasks={state.tasks.filter((t) => t.eventId === id)}
        weekStart={weekStart}
        onStart={() => {
          setLink(id, { state: "prep", conversation: `${item.title} 준비 대화` });
          notify("샘플: 일정 제목·시각·설명을 담아 Crew 대화를 시작하는 동작입니다. 실제 대화는 만들지 않았습니다.");
        }}
        onReturn={(conversation) =>
          notify(`샘플: 실제로는 '${conversation}'로 이동합니다. 대화 연결은 아직 구현하지 않았습니다.`)
        }
        onRetry={() => {
          setLink(id, { state: "checking" });
          window.clearTimeout(retryTimer.current);
          // Sample lookup resolves to "no linked conversation" rather than inventing one.
          retryTimer.current = window.setTimeout(() => setLink(id), 700);
        }}
        onEditTask={(taskId) => openEditor("task", taskId)}
      />
    );
  }
  function openEditor(kind: "event" | "task", id?: string) {
    const draft = blankDraft(weekStart, dayOffset(dateKey(focusDate), weekStart));
    if (id && kind === "event") {
      const item = events.find((i) => i.id === id);
      if (!item) return;
      Object.assign(draft, {
        title: item.title,
        date: dateKey(shift(weekStart, item.day)),
        start: clock(item.start),
        end: clock(item.end ?? item.start + 60),
        allDay: !!item.allDay,
        source: item.source,
        description: item.description,
      });
    }
    if (id && kind === "task") {
      const task = state.tasks.find((t) => t.id === id);
      if (!task || task.status === "completed") return;
      Object.assign(draft, {
        title: task.title,
        date: dateKey(shift(weekStart, task.day)),
        start: clock(task.minute),
        description: task.description,
        repeat: task.repeat ?? "none",
        eventId: events.some((e) => e.id === task.eventId) ? task.eventId : "",
        allDay: false,
      });
    }
    setEditor({ key: crypto.randomUUID(), kind, id, draft });
  }
  function save(draft: EditorDraft) {
    if (!editor) return;
    const id = editor.id ?? crypto.randomUUID();
    const day = dayOffset(draft.date, weekStart);
    let selected = id;
    if (editor.kind === "event") {
      const item: CalendarViewItem = {
        id,
        kind: "event",
        day,
        title: draft.title.trim(),
        start: draft.allDay ? 0 : minuteValue(draft.start),
        end: draft.allDay ? undefined : minuteValue(draft.end),
        allDay: draft.allDay,
        source: draft.source,
        description: draft.description.trim(),
      };
      setBaseItems((list) =>
        list.some((i) => i.id === id)
          ? list.map((i) => (i.id === id ? item : i))
          : [...list, item],
      );
    } else {
      const previous = state.tasks.find((t) => t.id === id);
      dispatch({
        type: "save",
        task: {
          id,
          automatic: false,
          status: "scheduled",
          source: "직접 만든 샘플 예약",
          quote: draft.description,
          reason: "사용자가 입력",
          ...previous,
          title: draft.title.trim(),
          description: draft.description.trim(),
          day,
          minute: minuteValue(draft.start),
          repeat: draft.repeat,
          eventId: draft.eventId || undefined,
        },
      });
      if (draft.repeat !== "none") selected = `${id}@${day}`;
    }
    if (editor.key.startsWith("proposal-")) {
      setProposalStatus("registered");
      setLink(id, PROPOSAL_LINK);
    }
    setScene("sample");
    setFocusDate(shift(weekStart, day));
    setPage("calendar");
    setEditor(null);
    setJump({ id: selected, serial: Date.now() });
    notify("샘플에 저장했습니다. 실제 일정이나 작업은 생성하지 않았습니다.");
  }
  function proposalAction(action: "register" | "edit" | "dismiss") {
    if (!proposalOn || proposalStatus !== "pending") return;
    if (action === "dismiss") {
      setProposalStatus("dismissed");
      return;
    }
    const draft = {
      ...blankDraft(weekStart, 3),
      title: "지원서 마무리",
      date: dateKey(shift(weekStart, 3)),
      start: "19:00",
      end: "20:00",
      source: "개인 일정",
      description: "대화 예시: 지원서 아직 못 썼는데 금요일 마감이야.\n마감 전 마무리 시간을 추천한 샘플입니다.",
    };
    if (action === "edit") {
      setEditor({ key: `proposal-${crypto.randomUUID()}`, kind: "event", draft });
      return;
    }
    const id = "sample-conversation-proposal";
    setBaseItems((list) => list.some((item) => item.id === id) ? list : [...list, {
      id, kind: "event", day: 3, title: draft.title, start: 1140, end: 1200,
      source: draft.source, description: draft.description,
    }]);
    setLink(id, PROPOSAL_LINK);
    setProposalStatus("registered");
    setScene("sample");
    setFocusDate(shift(weekStart, 3));
    setPage("calendar");
    setJump({ id, serial: Date.now() });
    notify("샘플 캘린더에 등록했습니다. 실제 캘린더에는 저장하지 않았습니다.");
  }
  function remove() {
    if (!editor?.id) return;
    const id = editor.id;
    if (editor.kind === "event") {
      const removed = events.find((i) => i.id === id);
      if (!removed) return;
      setBaseItems((list) => list.filter((i) => i.id !== id));
      setUndo(
        () => () =>
          setBaseItems((list) =>
            list.some((i) => i.id === id) ? list : [...list, removed],
          ),
      );
    } else {
      const removed = state.tasks.find((t) => t.id === id);
      if (!removed) return;
      dispatch({ type: "status", id, status: "cancelled" });
      setUndo(() => () => dispatch({ type: "save", task: removed }));
    }
    setEditor(null);
    setPage("calendar");
    setFeedback("샘플 항목을 삭제했습니다. 연결된 다른 작업은 유지됩니다.");
  }
  return (
    <div className="cc-calendar">
      <style>{styles}</style>
      <header className="cc-compact-header">
        <div className="cc-compact-title">
          <h1>Calendar</h1>
          <span
            className="cc-sample-label"
            title="가상 데이터 · 실제 연결 없음. 새로고침 시 초기화됩니다."
          >
            샘플
          </span>
        </div>
        <div className="cc-header-actions">
          {page !== "calendar" && (
            <Btn onClick={() => setPage("calendar")}>
              <ArrowLeft size={14} />
              캘린더
            </Btn>
          )}
          <details className="cc-add-menu">
            <summary>
              <Plus size={15} />
              추가
            </summary>
            <div className="cc-add-options">
              <Btn
                onClick={(e) => {
                  e.currentTarget.closest("details")?.removeAttribute("open");
                  openEditor("event");
                }}
              >
                <CalendarDays size={15} />내 일정
              </Btn>
              <Btn
                onClick={(e) => {
                  e.currentTarget.closest("details")?.removeAttribute("open");
                  openEditor("task");
                }}
              >
                <Sparkles size={15} />
                Crew 작업 예약
              </Btn>
            </div>
          </details>
          <Btn
            className="cc-settings-entry"
            aria-label="캘린더 설정"
            aria-pressed={page === "settings"}
            onClick={() =>
              setPage(page === "settings" ? "calendar" : "settings")
            }
          >
            <Settings2 size={16} />
          </Btn>
        </div>
      </header>
      {feedback && (
        <div className="cc-feedback" role="status">
          <span>{feedback}</span>
          <div>
            {undo && (
              <Btn
                onClick={() => {
                  undo();
                  setUndo(null);
                  setFeedback("삭제를 되돌렸습니다.");
                }}
              >
                되돌리기
              </Btn>
            )}
            <Btn aria-label="안내 닫기" onClick={() => setFeedback("")}>
              ×
            </Btn>
          </div>
        </div>
      )}
      <div
        className="cc-route-panel"
        role="region"
        aria-label="캘린더"
        hidden={page !== "calendar"}
      >
        <CalendarPage
          items={scene === "empty" ? EMPTY_ITEMS : items}
          weekStart={weekStart}
          referenceTime={SAMPLE_NOW}
          view={view}
          onView={setView}
          layout={layout}
          onLayout={setLayout}
          focusDate={focusDate}
          onFocusDate={setFocusDate}
          offset={offset}
          onOffset={setOffset}
          jump={jump}
          scene={scene}
          notice={
            scene === "partial" ? (
              <PreviewNotice onRecover={() => setScene("sample")} />
            ) : undefined
          }
          onResetPreview={() => setScene("sample")}
          eventActions={eventActions}
          onAdd={() => openEditor("event")}
          onEdit={(item) =>
            openEditor(
              item.kind === "event" ? "event" : "task",
              item.taskId ?? item.id,
            )
          }
        />
      </div>
      <div
        className="cc-route-panel"
        role="region"
        aria-label="자동 예약"
        hidden={page !== "auto"}
      >
        <AutoSchedulePage
          state={state}
          dispatch={dispatch}
          weekStart={weekStart}
          onOpenEvent={openEvent}
        />
      </div>
      <div
        className="cc-route-panel"
        role="region"
        aria-label="설정"
        hidden={page !== "settings"}
      >
        <SettingsPage
          scene={scene}
          onScene={setScene}
          proposalOn={proposalOn}
          onProposalToggle={setProposalOn}
          proposalStatus={proposalStatus}
          onProposalAction={proposalAction}
          autoOn={state.autoOn}
          onOpenAuto={() => setPage("auto")}
          onBack={() => setPage("calendar")}
          connections={connections}
          onConnect={() => setConnecting(true)}
          onDisconnect={(id) => {
            const connection = connections.find((c) => c.id === id)!;
            setConnections((list) => list.filter((c) => c.id !== id));
            setFeedback(
              "샘플 연결을 해제했습니다. 실제 계정에는 영향이 없습니다.",
            );
            setUndo(
              () => () =>
                setConnections((list) =>
                  list.some((c) => c.id === id) ? list : [...list, connection],
                ),
            );
          }}
        />
      </div>
      {editor && (
        <ItemEditor
          key={editor.key}
          session={editor}
          weekStart={weekStart}
          events={events}
          onSave={save}
          onClose={() => setEditor(null)}
          onDelete={editor.id ? remove : undefined}
        />
      )}
      {connecting && (
        <ConnectionDialog
          onClose={() => setConnecting(false)}
          onConnect={(connection) => {
            setConnections((list) => [
              ...list.filter((c) => c.id !== connection.id),
              connection,
            ]);
            setConnecting(false);
            notify(
              "샘플 캘린더 선택을 저장했습니다. 실제 계정은 연결하지 않았습니다.",
            );
          }}
        />
      )}
    </div>
  );
}
