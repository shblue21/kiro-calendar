import { useAppApi, useAppInfo } from "@kirocrew/app-sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Notice } from "../i18n/notice.ts";
import { notice } from "../i18n/notice.ts";
import { collectionNotice, errorNotice } from "./api";
import {
  parseItemsResponse,
  parseConnectionsResponse,
  parsePreferencesResponse,
  parseEventsResponse,
} from "./responses";
import {
  CREW_DESTINATION,
  type CalendarItem,
  type CalendarEvent,
  type Connection,
  type CalendarPreferences as Preferences,
} from "./types";

/** Owns calendar query snapshots and refreshes; editors and navigation stay in the workspace. */
export function useCalendarData(
  rangeStart: string,
  rangeEnd: string,
  refreshTimezone: () => Promise<string>,
  setFeedback: (value: Notice | null, tone?: "info" | "error") => void,
) {
  const api = useRef(useAppApi()),
    { name } = useAppInfo();
  const base = `/api/apps/${name}`;
  const [records, setRecords] = useState<CalendarItem[]>([]),
    [events, setEvents] = useState<CalendarEvent[]>([]),
    [connections, setConnections] = useState<Connection[]>([]);
  const [recordError, setRecordError] = useState<Notice | null>(null),
    [eventError, setEventError] = useState<Notice | null>(null),
    [connectionError, setConnectionError] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false);
  const [eventRefresh, setEventRefresh] = useState(0);
  const [preferences, setPreferences] = useState<Preferences>({
    defaultDestination: CREW_DESTINATION,
    showCrew: true,
  });
  const [preferencesReady, setPreferencesReady] = useState(false);
  const recordSequence = useRef(0),
    eventSequence = useRef(0),
    connectionSequence = useRef(0),
    preferenceSequence = useRef(0);
  const selected = JSON.stringify(
    connections.map((c) => [c.id, c.state, c.selectedCalendarIds]),
  );
  const loadRecords = useCallback(async () => {
    const seq = ++recordSequence.current;
    try {
      const body = parseItemsResponse(await api.current.get(`${base}/calendar/items`));
      if (seq === recordSequence.current) {
        setRecords(body.items);
        setRecordError(collectionNotice(body.errors));
      }
    } catch (error) {
      if (seq === recordSequence.current)
        setRecordError(notice("calendar.loadError", { error: errorNotice(error) }));
    } finally {
      if (seq === recordSequence.current) setLoading(false);
    }
  }, [base]);
  const loadConnection = useCallback(async () => {
    const seq = ++connectionSequence.current;
    try {
      const body = parseConnectionsResponse(
        await api.current.get(`${base}/calendar/connection`),
      );
      if (seq === connectionSequence.current) {
        setConnections(body.connections);
        setConnectionError(null);
      }
    } catch (error) {
      if (seq === connectionSequence.current) {
        setConnectionError(
          notice("calendar.connectionLoadError", { error: errorNotice(error) }),
        );
        setConnections([]);
      }
    }
  }, [base]);
  const loadPreferences = useCallback(async () => {
    const seq = ++preferenceSequence.current;
    try {
      const body = parsePreferencesResponse(
        await api.current.get(`${base}/calendar/preferences`),
      );
      if (seq === preferenceSequence.current) {
        setPreferences(body.preferences);
        setPreferencesReady(true);
      }
    } catch (error) {
      if (seq === preferenceSequence.current)
        setFeedback(
          notice("settings.loadError", { error: errorNotice(error) }),
          "error",
        );
    }
  }, [base, setFeedback]);
  const loadEvents = useCallback(async () => {
    const seq = ++eventSequence.current;
    if (!connections.some((c) => c.selectedCalendarIds.length)) {
      setEvents([]);
      setEventError(null);
      return;
    }
    try {
      const body = parseEventsResponse(
        await api.current.get(
          `${base}/calendar/events?start=${encodeURIComponent(rangeStart)}&end=${encodeURIComponent(rangeEnd)}`,
        ),
      );
      if (seq === eventSequence.current) {
        setEvents(body.events);
        setEventError(collectionNotice(body.errors));
      }
    } catch (error) {
      if (seq === eventSequence.current) {
        setEvents([]);
        setEventError(notice("calendar.lookupError", { error: errorNotice(error) }));
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
  }, [loadEvents]);
  useEffect(() => {
    void loadEvents();
  }, [loadEvents, eventRefresh]);
  const changed = useCallback(async () => {
    // Mutations invalidate the current view, not the range captured when they began.
    setEventRefresh((version) => version + 1);
    await loadRecords();
  }, [loadRecords]);
  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshTimezone(),
        loadRecords(),
        loadConnection(),
        loadPreferences(),
        loadEvents(),
      ]);
    } catch (error) {
      setFeedback(errorNotice(error), "error");
    } finally {
      setRefreshing(false);
    }
  }
  return {
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
  };
}
