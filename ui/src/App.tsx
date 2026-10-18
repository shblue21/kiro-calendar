import { InlineError } from "./layout/InlineError";
import { SettingsPage } from "./settings/SettingsLayout";
import { ControlCell } from "./layout/Controls";
import { WorkspacePage, Section } from "./layout/WorkspacePage";
import type { EventSeed } from "./calendar/creation";
import { useAppApi, useAppInfo, useChatLauncher } from "@kirocrew/app-sdk";
import { Btn, PageHeader, SegmentedControl } from "@kirocrew/app-sdk/ui";
import { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import { CalendarPage } from "./calendar/CalendarPage";
import { dateKey, dayOffset, monday, shift } from "./calendar/dates";
import { calendarRange } from "./calendar/period";
import { dateRangeInstants, zonedDay, zonedInput } from "./calendar/time";
import type { CalendarLayout, CalendarView } from "./calendar/types";
import { t } from "./i18n/index.ts";
import type { Notice } from "./i18n/notice.ts";
import { notice, NoticeError, renderNotice } from "./i18n/notice.ts";
import { useLocale } from "./i18n/useLocale";
import { errorNotice } from "./live/api";
import { useCalendarData } from "./live/useCalendarData";
import { CalendarConnections } from "./live/CalendarConnections";
import { CalendarPreferences } from "./live/CalendarPreferences";
import { DraftList } from "./live/DraftList";
import {
  ConfirmedEventEditor,
  NewEventEditor,
  ProposalEditor,
} from "./live/EventEditors";
import { EventTrash } from "./live/EventTrash";
import { ExternalSavePanel } from "./live/ExternalSavePanel";
import { calendarItems, eventItems } from "./live/projection";
import type { CalendarItem } from "./live/types";
import { can } from "./live/types";
import { AlertCircle, Plus, RotateCcw, Settings2 } from "./platform/kiro/icons";
import { ProposalSettings } from "./settings/ProposalSettings";
import styles from "./styles.css?inline";
export default function CalendarApp() {
  useLocale();
  const api = useRef(useAppApi()),
    { name } = useAppInfo();
  const [zone, setZone] = useState(""),
    [error, setError] = useState<Notice | null>(null);
  const load = useCallback(async () => {
    try {
      const body = await api.current.get<{
        settings: {
          timezone: string;
        };
      }>(`/api/apps/${name}/settings`);
      setZone(body.settings.timezone);
      setError(null);
      return body.settings.timezone;
    } catch {
      setError(notice("timezone.loadError"));
      throw new NoticeError(notice("timezone.loadError"));
    }
  }, [name]);
  useEffect(() => {
    const refreshZone = () => {
      void load().catch(() => {});
    };
    refreshZone();
    window.addEventListener("focus", refreshZone);
    return () => window.removeEventListener("focus", refreshZone);
  }, [load]);
  if (!zone)
    return (
      <div className="cc-calendar">
        <style>{styles}</style>
        <p role="status">{renderNotice(error) || t("common.loadingCalendar")}</p>
        {error && (
          <Btn onClick={() => void load().catch(() => {})}>
            {t("common.checkAgain")}
          </Btn>
        )}
      </div>
    );
  return <CalendarWorkspace timezone={zone} refreshTimezone={load} />;
}
function CalendarWorkspace({
  timezone,
  refreshTimezone,
}: {
  timezone: string;
  refreshTimezone: () => Promise<string>;
}) {
  const language = useLocale();
  const workspaceTabsId = useId();
  const api = useRef(useAppApi()),
    { name } = useAppInfo(),
    { openChat } = useChatLauncher();
  const base = `/api/apps/${name}`;
  const [clock, setClock] = useState(() => new Date()),
    [weekStart] = useState(() => monday(zonedDay(new Date(), timezone)));
  const [focusDate, setFocusDate] = useState(() => zonedDay(new Date(), timezone)),
    [view, setView] = useState<CalendarView>("week"),
    [layout, setLayout] = useState<CalendarLayout>("calendar");
  const [page, setPage] = useState<"calendar" | "proposals" | "activity" | "settings">(
    () =>
      new URLSearchParams(window.location.search).get("view") === "drafts"
        ? "proposals"
        : "calendar",
  );
  const [editor, setEditor] = useState<{
    key: string;
    item: CalendarItem | null;
    mode: "content" | "delivery";
    startImmediately?: boolean;
    seed?: EventSeed;
  } | null>(null);
  const [undo, setUndo] = useState<CalendarItem | null>(null);
  const [jump, setJump] = useState<{
    id: string;
    serial: number;
  }>();
  const [feedback, setFeedbackState] = useState<{
    notice: Notice;
    tone: "info" | "error";
  } | null>(null);
  const setFeedback = useCallback(
    (value: Notice | null, tone: "info" | "error" = "info") => {
      setFeedbackState(value ? { notice: value, tone } : null);
    },
    [],
  );
  const range = calendarRange(focusDate, view, weekStart, layout);
  const first = shift(weekStart, range.first),
    last = shift(weekStart, range.end);
  const { start: rangeStart, end: rangeEnd } = dateRangeInstants(
    dateKey(first),
    dateKey(last),
    timezone,
  );
  const {
    records,
    events,
    connections,
    recordError,
    eventError,
    connectionError,
    loading,
    refreshing,
    preferences,
    preferencesReady,
    loadRecords,
    loadConnection,
    loadPreferences,
    changed,
    refresh,
  } = useCalendarData(rangeStart, rangeEnd, refreshTimezone, setFeedback);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const items = useMemo(
    () => [
      ...calendarItems(
        records,
        weekStart,
        range,
        timezone,
        preferences.showCrew,
        connections,
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
      connections,
      language,
    ],
  );
  const offset = Math.floor(dayOffset(dateKey(focusDate), weekStart) / 7);
  const wallClock = zonedInput(clock, timezone);
  const reference = {
    day: dayOffset(wallClock.slice(0, 10), weekStart),
    instant: clock.toISOString(),
  };
  function edit(draft: CalendarItem | null, seed?: EventSeed) {
    if (draft && !can(draft, "edit")) {
      openDelivery(draft);
      return;
    }
    if ((!draft || draft.status === "proposed") && !preferencesReady) {
      setFeedback(notice("editor.destinationLoading"));
      return;
    }
    setEditor({ key: crypto.randomUUID(), item: draft, mode: "content", seed });
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
    if (item.status === "confirmed" && item.destination?.connectionId !== "crew") {
      openDelivery(item, true);
    } else setEditor(null);
    await changed();
  }
  async function remove(item: CalendarItem) {
    const result = await api.current.post<{
      item: CalendarItem;
    }>(`${base}/calendar/items/${item.id}/delete`, { revision: item.revision });
    setUndo(result.item);
    setFeedback(notice("common.eventDeleted"));
    setEditor((current) => (current?.key === editor?.key ? null : current));
    await changed();
  }
  async function restore(item: CalendarItem) {
    await api.current.post(`${base}/calendar/items/${item.id}/restore`, {
      revision: item.revision,
    });
    setUndo(null);
    setFeedback(notice("common.eventRestored"));
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
      setFeedback(errorNotice(error), "error");
    }
  }
  function actions(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return null;
    const draft = records.find((d) => d.id === item.itemId);
    const session = draft?.origin.sessionKey || item.providerEvent?.origin?.sessionKey;
    return (
      <div className="cc-inline-actions">
        {session?.startsWith("dashboard:") && (
          <Btn onClick={() => origin(session)}>{t("common.returnToConversation")}</Btn>
        )}
        {draft && can(draft, "edit") && (
          <Btn onClick={() => edit(draft)}>
            {draft.status === "proposed" ? t("common.reviewAndSave") : t("common.edit")}
          </Btn>
        )}
        {draft?.status === "confirmed" && draft.destination.connectionId !== "crew" && (
          <Btn onClick={() => openDelivery(draft)}>
            {t("common.externalSaveStatus")}
          </Btn>
        )}
        {draft && can(draft, "delete") && (
          <Btn
            danger
            onClick={() =>
              void remove(draft).catch((e) => setFeedback(errorNotice(e), "error"))
            }
          >
            {t("common.delete")}
          </Btn>
        )}
      </div>
    );
  }
  const visibleDrafts = records.filter((d) => d.status === "proposed" && !d.deletedAt);
  return (
    <div className="cc-calendar">
      <style>{styles}</style>
      <header className="cc-app-header">
        <PageHeader
          title={<h1 className="cc-app-title">Calendar</h1>}
          subtitle={timezone}
          actions={
            <>
              <ControlCell>
                <Btn
                  aria-label={t("common.refreshEvents")}
                  disabled={refreshing}
                  onClick={() => void refresh()}
                >
                  <RotateCcw size={14} />
                </Btn>
              </ControlCell>
              <ControlCell>
                <Btn disabled={!preferencesReady} onClick={() => edit(null)}>
                  <Plus size={15} />
                  {t("common.addEvent")}
                </Btn>
              </ControlCell>
              <ControlCell>
                <Btn
                  aria-label={t("common.calendarSettings")}
                  aria-pressed={page === "settings"}
                  onClick={() => setPage(page === "settings" ? "calendar" : "settings")}
                >
                  <Settings2 size={16} />
                </Btn>
              </ControlCell>
            </>
          }
        />
      </header>
      <nav className="cc-work-nav" aria-label={t("navigation.label")}>
        <SegmentedControl
          ariaLabel={t("navigation.label")}
          layoutId={workspaceTabsId}
          collapse={false}
          value={page}
          onChange={setPage}
          segments={[
            { key: "calendar", label: t("common.calendar") },
            {
              key: "proposals",
              label: t("navigation.proposals"),
              count: visibleDrafts.length,
            },
            { key: "activity", label: t("navigation.activity") },
          ]}
        />
      </nav>
      {feedback && (
        <div
          className={`cc-feedback ${feedback.tone === "error" ? "cc-feedback--error" : ""}`}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.tone === "error" && <AlertCircle size={16} aria-hidden="true" />}
          {renderNotice(feedback.notice)}
          {undo && (
            <Btn
              onClick={() =>
                void restore(undo).catch((e) => setFeedback(errorNotice(e), "error"))
              }
            >
              {t("common.undo")}
            </Btn>
          )}
          <Btn
            aria-label={t("common.dismissMessage")}
            onClick={() => setFeedback(null)}
          >
            ×
          </Btn>
        </div>
      )}
      <div
        className="cc-route-panel"
        hidden={page !== "calendar"}
        role="region"
        aria-label={t("common.calendar")}
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
          jump={jump}
          status={loading ? "loading" : "ready"}
          onReload={() => void refresh()}
          onAdd={(seed) => edit(null, seed)}
          eventActions={actions}
          notice={
            <>
              {(recordError || eventError || connectionError) && (
                <div className="cc-feedback cc-feedback--error" role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  {[recordError, eventError, connectionError]
                    .map(renderNotice)
                    .filter(Boolean)
                    .join(" ")}
                  <Btn onClick={() => void refresh()}>{t("common.checkAgain")}</Btn>
                </div>
              )}
            </>
          }
        />
      </div>
      <SettingsPage title={t("common.settings")} hidden={page !== "settings"}>
        {page === "settings" && <ProposalSettings />}
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
      </SettingsPage>
      {page === "proposals" && (
        <WorkspacePage label={t("navigation.proposals")}>
          <DraftList
            drafts={visibleDrafts}
            timezone={timezone}
            error={recordError}
            onRefresh={() => void loadRecords()}
            onSelect={selectDraft}
            onDismiss={(d) => void dismiss(d)}
            onOrigin={origin}
          />
        </WorkspacePage>
      )}
      {page === "activity" && (
        <WorkspacePage label={t("navigation.activity")}>
          {recordError && <InlineError>{renderNotice(recordError)}</InlineError>}
          <Section title={t("common.externalSaveHistory")}>
            <div>
              {records
                .filter(
                  (d) =>
                    d.status === "confirmed" &&
                    d.destination?.connectionId !== "crew" &&
                    !d.deletedAt,
                )
                .map((d) => (
                  <div className="cc-list-row" key={d.id}>
                    <strong>{d.title}</strong>
                    <Btn onClick={() => openDelivery(d)}>{t("common.saveStatus")}</Btn>
                  </div>
                ))}
            </div>
          </Section>
          <EventTrash
            items={records.filter((d) => !!d.deletedAt)}
            onRestore={restore}
          />
        </WorkspacePage>
      )}
      {editor &&
        (!editor.item ? (
          <NewEventEditor
            refreshTimezone={refreshTimezone}
            key={editor.key}
            date={editor.seed?.date ?? focusDate}
            initialTimes={editor.seed?.times}
            timezone={timezone}
            connections={connections}
            defaultDestination={preferences.defaultDestination}
            onClose={() => setEditor(null)}
            onSaved={saved}
          />
        ) : editor.mode === "delivery" ? (
          <ExternalSavePanel
            connections={connections}
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
