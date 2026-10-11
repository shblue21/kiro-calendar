import { zonedDay, zonedInput, dateRangeInstants } from "./calendar/time";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppApi, useAppInfo, useChatLauncher } from "@kirocrew/app-sdk";
import { Btn } from "@kirocrew/app-sdk/ui";
import { CalendarPage } from "./calendar/CalendarPage";
import { monday, dateKey, shift } from "./calendar/dates";
import { dayOffset } from "./calendar/dates";
import { calendarRange } from "./calendar/period";
import type {
  CalendarView,
  CalendarLayout,
  CalendarViewItem,
} from "./calendar/types";
import type {
  CalendarItem,
  CalendarEvent,
  Connection,
  CalendarPreferences as Preferences,
} from "./live/types";
import { calendarItems, eventItems } from "./live/projection";
import {
  NewEventEditor,
  ProposalEditor,
  ConfirmedEventEditor,
} from "./live/EventEditors";
import { ExternalSavePanel } from "./live/ExternalSavePanel";
import { CalendarPreferences } from "./live/CalendarPreferences";
import { EventTrash } from "./live/EventTrash";
import { CREW_DESTINATION } from "./live/DestinationSelect";
import { CalendarConnections } from "./live/CalendarConnections";
import { DraftList } from "./live/DraftList";
import { ProposalSettings } from "./settings/ProposalSettings";
import { Settings2, Plus, ArrowLeft, RotateCcw } from "./platform/kiro/icons";
import { message } from "./live/api";
import { can } from "./live/types";
import styles from "./styles.css?inline";

export default function CalendarApp() {
  const api = useRef(useAppApi()),
    { name } = useAppInfo();
  const [zone, setZone] = useState(""),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const body = await api.current.get<{ settings: { timezone: string } }>(
        `/api/apps/${name}/settings`,
      );
      setZone(body.settings.timezone);
      setError("");
      return body.settings.timezone;
    } catch {
      setError("OS 시스템 시간대를 확인하지 못했습니다.");
      throw new Error("OS 시스템 시간대를 확인하지 못했습니다.");
    }
  }, [name]);
  useEffect(() => {
    const refreshZone = () => { void load().catch(() => {}); };
    refreshZone();
    window.addEventListener("focus", refreshZone);
    return () => window.removeEventListener("focus", refreshZone);
  }, [load]);
  if (!zone)
    return (
      <div className="cc-calendar">
        <style>{styles}</style>
        <p role="status">{error || "캘린더를 불러오고 있습니다."}</p>
        {error && <Btn onClick={() => void load().catch(() => {})}>다시 확인</Btn>}
      </div>
    );
  return <CalendarWorkspace timezone={zone} refreshTimezone={load} />;
}
function CalendarWorkspace({ timezone, refreshTimezone }: { timezone: string; refreshTimezone: () => Promise<string> }) {
  const api = useRef(useAppApi()),
    { name } = useAppInfo(),
    { openChat } = useChatLauncher();
  const base = `/api/apps/${name}`;
  const [clock, setClock] = useState(() => new Date()),
    [weekStart] = useState(() => monday(zonedDay(new Date(), timezone)));
  const [focusDate, setFocusDate] = useState(() =>
      zonedDay(new Date(), timezone),
    ),
    [view, setView] = useState<CalendarView>("week"),
    [layout, setLayout] = useState<CalendarLayout>("calendar");
  const [page, setPage] = useState<"calendar" | "settings">(() =>
    new URLSearchParams(window.location.search).get("view") === "drafts"
      ? "settings"
      : "calendar",
  );
  const [records, setRecords] = useState<CalendarItem[]>([]),
    [events, setEvents] = useState<CalendarEvent[]>([]),
    [connections, setConnections] = useState<Connection[]>([]);
  const [recordError, setRecordError] = useState(""),
    [eventError, setEventError] = useState(""),
    [connectionError, setConnectionError] = useState("");
  const [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    defaultDestination: CREW_DESTINATION,
    showCrew: true,
  });
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [editor, setEditor] = useState<{
    key: string;
    item: CalendarItem | null;
    mode: "content" | "delivery";
    startImmediately?: boolean;
  } | null>(null);
  const [undo, setUndo] = useState<CalendarItem | null>(null);
  const [jump, setJump] = useState<{ id: string; serial: number }>();
  const [feedback, setFeedback] = useState("");
  const recordSequence = useRef(0),
    eventSequence = useRef(0),
    connectionSequence = useRef(0),
    preferenceSequence = useRef(0);
  const range = calendarRange(focusDate, view, weekStart, layout);
  const first = shift(weekStart, range.first),
    last = shift(weekStart, range.end);
  const { start: rangeStart, end: rangeEnd } = dateRangeInstants(
    dateKey(first),
    dateKey(last),
    timezone,
  );
  const selected = JSON.stringify(
    connections.map((c) => [c.id, c.state, c.selectedCalendarIds]),
  );
  const loadRecords = useCallback(async () => {
    const seq = ++recordSequence.current;
    try {
      const body = await api.current.get<{
        items: CalendarItem[];
        errors: { message: string }[];
      }>(`${base}/calendar/items`);
      if (seq === recordSequence.current) {
        setRecords(body.items);
        setRecordError(body.errors.map((e) => e.message).join(" "));
      }
    } catch (error) {
      if (seq === recordSequence.current)
        setRecordError(`일정을 불러오지 못했습니다. ${message(error)}`);
    } finally {
      if (seq === recordSequence.current) setLoading(false);
    }
  }, [base]);
  const loadConnection = useCallback(async () => {
    const seq = ++connectionSequence.current;
    try {
      const body = await api.current.get<{
        connections: Connection[];
      }>(`${base}/calendar/connection`);
      if (seq === connectionSequence.current) {
        setConnections(body.connections);
        setConnectionError("");
      }
    } catch (error) {
      if (seq === connectionSequence.current) {
        setConnectionError(message(error));
        setConnections([]);
      }
    }
  }, [base]);
  const loadPreferences = useCallback(async () => {
    const seq = ++preferenceSequence.current;
    try {
      const body = await api.current.get<{ preferences: Preferences }>(
        `${base}/calendar/preferences`,
      );
      if (seq === preferenceSequence.current) {
        setPreferences(body.preferences);
        setPreferencesReady(true);
      }
    } catch (error) {
      if (seq === preferenceSequence.current)
        setFeedback(
          `기본 캘린더 설정을 불러오지 못했습니다. ${message(error)}`,
        );
    }
  }, [base]);
  const loadEvents = useCallback(async () => {
    const seq = ++eventSequence.current;
    if (!connections.some((c) => c.selectedCalendarIds.length)) {
      setEvents([]);
      setEventError("");
      return;
    }
    try {
      const body = await api.current.get<{
        events: CalendarEvent[];
        errors: { message: string }[];
      }>(
        `${base}/calendar/events?start=${encodeURIComponent(rangeStart)}&end=${encodeURIComponent(rangeEnd)}`,
      );
      if (seq === eventSequence.current) {
        setEvents(body.events);
        setEventError(body.errors.map((e) => e.message).join(" "));
      }
    } catch (error) {
      if (seq === eventSequence.current) {
        setEvents([]);
        setEventError(`일정 조회 실패. ${message(error)}`);
      }
    }
  }, [base, rangeStart, rangeEnd, selected]);
  useEffect(() => {
    void loadRecords();
    void loadConnection();
    void loadPreferences();
  }, [loadRecords, loadConnection, loadPreferences]);
  useEffect(() => {
    setEvents([]);
    void loadEvents();
  }, [loadEvents]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const changed = useCallback(async () => {
    await Promise.all([loadRecords(), loadEvents()]);
  }, [loadRecords, loadEvents]);
  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshTimezone(), loadRecords(), loadConnection(), loadPreferences(), loadEvents(),
      ]);
    } catch (error) {
      setFeedback(message(error));
    } finally {
      setRefreshing(false);
    }
  }
  const items = useMemo(
    () => [
      ...calendarItems(
        records,
        weekStart,
        range,
        timezone,
        preferences.showCrew,
      ),
      ...events.flatMap((e) => eventItems(e, weekStart, range, timezone)),
    ],
    [
      records,
      events,
      weekStart,
      range.first,
      range.end,
      timezone,
      preferences.showCrew,
    ],
  );
  const offset = Math.floor(dayOffset(dateKey(focusDate), weekStart) / 7);
  const wallClock = zonedInput(clock, timezone);
  const reference = {
    day: dayOffset(wallClock.slice(0, 10), weekStart),
    instant: clock.toISOString(),
  };
  function edit(draft: CalendarItem | null) {
    if (draft && !can(draft, "edit")) {
      openDelivery(draft);
      return;
    }
    if ((!draft || draft.status === "proposed") && !preferencesReady) {
      setFeedback("기본 저장 위치를 불러온 뒤 다시 시도하세요.");
      return;
    }
    setEditor({ key: crypto.randomUUID(), item: draft, mode: "content" });
  }
  function openDelivery(item: CalendarItem, startImmediately = false) {
    setEditor({
      key: crypto.randomUUID(),
      item,
      mode: "delivery",
      startImmediately,
    });
  }
  function selectDraft(draft: CalendarItem) {
    setFocusDate(zonedDay(draft.start, timezone));
    setPage("calendar");
    setJump({
      id: `draft:${draft.id}@${dayOffset(zonedInput(draft.start, timezone).slice(0, 10), weekStart)}`,
      serial: Date.now(),
    });
    edit(draft);
  }
  async function saved(item: CalendarItem) {
    if (
      item.status === "confirmed" &&
      item.destination?.connectionId !== "crew"
    ) {
      openDelivery(item, true);
    } else setEditor(null);
    await changed();
  }
  async function remove(item: CalendarItem) {
    const result = await api.current.post<{ item: CalendarItem }>(
      `${base}/calendar/items/${item.id}/delete`,
      { revision: item.revision },
    );
    setUndo(result.item);
    setFeedback("일정을 삭제했습니다.");
    setEditor(null);
    await changed();
  }
  async function restore(item: CalendarItem) {
    await api.current.post(`${base}/calendar/items/${item.id}/restore`, {
      revision: item.revision,
    });
    setUndo(null);
    setFeedback("일정을 복원했습니다.");
    await changed();
  }
  function origin(key?: string) {
    if (key?.startsWith("dashboard:"))
      openChat({ slotKey: key.slice("dashboard:".length) });
  }
  async function dismiss(draft: CalendarItem) {
    try {
      await api.current.post(`${base}/calendar/items/${draft.id}/dismiss`, {
        revision: draft.revision,
      });
      await loadRecords();
    } catch (error) {
      setFeedback(message(error));
    }
  }
  function actions(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return null;
    const draft = records.find((d) => d.id === item.itemId);
    const session =
      draft?.origin.sessionKey || item.providerEvent?.origin?.sessionKey;
    return (
      <div className="cc-inline-actions">
        {session?.startsWith("dashboard:") && (
          <Btn onClick={() => origin(session)}>원래 대화로 돌아가기</Btn>
        )}
        {draft && can(draft, "edit") && (
          <Btn onClick={() => edit(draft)}>
            {draft.status === "proposed" ? "검토·저장" : "수정"}
          </Btn>
        )}
        {draft?.status === "confirmed" &&
          draft.destination.connectionId !== "crew" && (
            <Btn onClick={() => openDelivery(draft)}>외부 저장 상태</Btn>
          )}
        {draft && can(draft, "delete") && (
          <Btn
            danger
            onClick={() =>
              void remove(draft).catch((e) => setFeedback(message(e)))
            }
          >
            삭제
          </Btn>
        )}
      </div>
    );
  }
  const visibleDrafts = records.filter(
    (d) => d.status === "proposed" && !d.deletedAt,
  );
  return (
    <div className="cc-calendar">
      <style>{styles}</style>
      <header className="cc-compact-header">
        <div className="cc-compact-title">
          <h1>Calendar</h1>
          <span className="cc-label">{timezone}</span>
        </div>
        <div className="cc-header-actions">
          {page !== "calendar" && (
            <Btn onClick={() => setPage("calendar")}>
              <ArrowLeft size={14} />
              캘린더
            </Btn>
          )}
          <Btn
            aria-label="일정 새로고침"
            disabled={refreshing}
            onClick={() => void refresh()}
          >
            <RotateCcw size={14} />
          </Btn>
          <Btn disabled={!preferencesReady} onClick={() => edit(null)}>
            <Plus size={15} />
            일정 추가
          </Btn>
          <Btn
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
          {feedback}
          {undo && (
            <Btn
              onClick={() =>
                void restore(undo).catch((e) => setFeedback(message(e)))
              }
            >
              실행 취소
            </Btn>
          )}
          <Btn aria-label="안내 닫기" onClick={() => setFeedback("")}>
            ×
          </Btn>
        </div>
      )}
      <div
        className="cc-route-panel"
        hidden={page !== "calendar"}
        role="region"
        aria-label="캘린더"
      >
        <CalendarPage
          timezone={timezone}
          items={items}
          weekStart={weekStart}
          referenceTime={reference}
          view={view}
          layout={layout}
          onView={setView}
          onLayout={setLayout}
          focusDate={focusDate}
          onFocusDate={setFocusDate}
          offset={offset}
          onOffset={(n) => setFocusDate(shift(weekStart, n * 7))}
          jump={jump}
          status={loading ? "loading" : "ready"}
          onReload={() => void refresh()}
          onAdd={() => edit(null)}
          onEdit={(item: CalendarViewItem) => {
            const d = records.find((d) => d.id === item.itemId);
            if (d) edit(d);
          }}
          eventActions={actions}
          notice={
            <>
              {(recordError || eventError) && (
                <div className="cc-feedback" role="alert">
                  {[recordError, eventError].filter(Boolean).join(" ")}
                  <Btn onClick={() => void refresh()}>다시 확인</Btn>
                </div>
              )}
            </>
          }
        />
      </div>
      <div
        className="cc-route-panel"
        hidden={page !== "settings"}
        role="region"
        aria-label="설정"
      >
        <div className="cc-settings-page">
          <div className="cc-settings-heading">
            <h2>설정</h2>
          </div>
          {preferencesReady && (
            <CalendarPreferences
              value={preferences}
              connections={connections}
              onRefresh={loadPreferences}
            />
          )}
          <CalendarConnections
            connections={connections}
            error={connectionError}
            onRefresh={loadConnection}
          />
          <ProposalSettings />
          <DraftList
            drafts={visibleDrafts}
            timezone={timezone}
            error={recordError}
            onRefresh={() => void loadRecords()}
            onSelect={selectDraft}
            onDismiss={(d) => void dismiss(d)}
            onOrigin={origin}
          />
          <section className="cc-settings-section">
            <h3>외부 저장 기록</h3>
            {records
              .filter(
                (d) =>
                  d.status === "confirmed" &&
                  d.destination?.connectionId !== "crew" &&
                  !d.deletedAt,
              )
              .map((d) => (
                <div className="cc-draft-row" key={d.id}>
                  <strong>{d.title}</strong>
                  <Btn onClick={() => openDelivery(d)}>저장 상태</Btn>
                </div>
              ))}
          </section>
          <EventTrash
            items={records.filter((d) => !!d.deletedAt)}
            onRestore={restore}
          />
        </div>
      </div>
      {editor &&
        (!editor.item ? (
          <NewEventEditor
            refreshTimezone={refreshTimezone}
            key={editor.key}
            date={focusDate}
            timezone={timezone}
            connections={connections}
            defaultDestination={preferences.defaultDestination}
            onClose={() => setEditor(null)}
            onSaved={saved}
          />
        ) : editor.mode === "delivery" ? (
          <ExternalSavePanel
            refreshTimezone={refreshTimezone}
            key={editor.key}
            item={editor.item}
            timezone={timezone}
            startImmediately={editor.startImmediately}
            onClose={() => setEditor(null)}
            onChanged={changed}
            onEdit={edit}
            onDelete={remove}
          />
        ) : editor.item.status === "proposed" ? (
          <ProposalEditor
            refreshTimezone={refreshTimezone}
            key={editor.key}
            item={editor.item}
            date={focusDate}
            timezone={timezone}
            connections={connections}
            defaultDestination={preferences.defaultDestination}
            onClose={() => setEditor(null)}
            onSaved={saved}
          />
        ) : (
          <ConfirmedEventEditor
            refreshTimezone={refreshTimezone}
            key={editor.key}
            item={editor.item}
            date={focusDate}
            timezone={timezone}
            connections={connections}
            onClose={() => setEditor(null)}
            onSaved={saved}
          />
        ))}
    </div>
  );
}
