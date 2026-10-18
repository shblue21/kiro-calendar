import assert from "node:assert/strict";
import { test } from "node:test";
import { NoticeError } from "../i18n/notice.ts";
import { errorNotice } from "./api.ts";
import { DeliverySession } from "./delivery.ts";
import {
  parseSettingsResponse,
  parseItemsResponse,
  parseEventsResponse,
  parseConnectionsResponse,
  parsePreferencesResponse,
  parseItemResponse,
  parseDeliveryResponse,
} from "./responses.ts";

const item = {
  id: "event-1",
  revision: 1,
  title: "Rehearsal",
  start: "2026-10-19T10:00:00+09:00",
  end: null,
  timezone: "Asia/Seoul",
  reason: "",
  status: "confirmed",
  source: "direct",
  destination: { connectionId: "crew", calendarId: "default" },
  actions: ["edit", "delete"],
  origin: { sessionKey: "calendar:manual" },
};
const operation = {
  id: "operation-1",
  state: "prepared",
  confirmation: { mode: "app" },
  providerMetadata: { retained: true },
};
const settings = {
  settings: {
    suggestionsEnabled: false,
    timezone: "Asia/Seoul",
    revision: 0,
    sessionKeys: [],
  },
  hook: { status: "unconfigured" },
  chats: [],
};
const connection = {
  id: "primary",
  provider: "apple",
  displayName: { kind: "system", key: "appleLocal" },
  state: "ready",
  capabilities: { read: true, create: true },
  confirmation: { mode: "provider" },
  selectedCalendarIds: ["a"],
  calendars: [{ id: "a", title: "Calendar", sourceTitle: "Personal", writable: true }],
};
const event = {
  eventId: "remote-1",
  calendarId: "a",
  title: "Holiday",
  notes: "",
  start: "2026-10-19T00:00:00+09:00",
  end: "2026-10-20T00:00:00+09:00",
  allDay: true,
  startDate: "2026-10-19",
  endDate: "2026-10-20",
  calendarTitle: "Calendar",
  sourceTitle: "Personal",
};

test("valid responses retain data, empty results and supported optional fields", () => {
  const pairs: [(value: unknown) => unknown, unknown][] = [
    [parseSettingsResponse, settings],
    [
      parseItemsResponse,
      { items: [item], errors: [{ code: "item_unavailable", itemId: "other" }] },
    ],
    [parseItemsResponse, { items: [], errors: [] }],
    [parseEventsResponse, { events: [event], errors: [] }],
    [parseEventsResponse, { events: [], errors: [] }],
    [parseConnectionsResponse, { connections: [connection] }],
    [parseConnectionsResponse, { connections: [] }],
    [
      parsePreferencesResponse,
      { preferences: { defaultDestination: item.destination, showCrew: true } },
    ],
    [
      parseItemResponse,
      {
        item: {
          ...item,
          delivery: { state: "unavailable", error: { code: "delivery_unavailable" } },
        },
      },
    ],
    [parseDeliveryResponse, { item: { ...item, delivery: operation }, operation }],
  ];
  for (const [parse, value] of pairs) assert.equal(parse(value), value);
});

test("external event origins are optional but present conversation keys must be strings", () => {
  for (const origin of [undefined, null, { sessionKey: "dashboard:chat-1" }]) {
    const response = { events: [{ ...event, origin }], errors: [] };
    assert.equal(parseEventsResponse(response), response);
  }
  for (const origin of ["dashboard:chat-1", [], {}, { sessionKey: {} }]) {
    assert.throws(
      () => parseEventsResponse({ events: [{ ...event, origin }], errors: [] }),
      NoticeError,
    );
  }
});

test("malformed envelopes and consumed nested fields are rejected, never replaced or filtered", () => {
  const cases: [(value: unknown) => unknown, unknown][] = [
    [parseSettingsResponse, { ...settings, hook: null }],
    [
      parseSettingsResponse,
      { ...settings, settings: { ...settings.settings, timezone: "not/a-zone" } },
    ],
    [
      parseSettingsResponse,
      { ...settings, chats: [{ sessionKey: "chat-1", title: {} }] },
    ],
    [parseItemsResponse, { items: null, errors: [] }],
    [parseItemsResponse, { items: [item] }],
    [parseItemsResponse, { items: [item, { ...item, actions: null }], errors: [] }],
    [parseItemResponse, { item: { ...item, destination: null } }],
    [parseItemResponse, { item: { ...item, origin: null } }],
    [parseItemResponse, { item: { ...item, start: "not-a-time" } }],
    [parseItemResponse, { item: { ...item, notes: {} } }],
    [parseConnectionsResponse, { connections: [{ ...connection, calendars: null }] }],
    [
      parseConnectionsResponse,
      { connections: [{ ...connection, selectedCalendarIds: [null] }] },
    ],
    [
      parsePreferencesResponse,
      { preferences: { showCrew: true, defaultDestination: null } },
    ],
    [
      parseEventsResponse,
      { events: [{ ...event, endDate: "2026-99-99" }], errors: [] },
    ],
    [
      parseDeliveryResponse,
      { item, operation: { ...operation, confirmation: { mode: "unknown" } } },
    ],
    [
      parseDeliveryResponse,
      { item: { ...item, delivery: { ...operation, verification: [] } }, operation },
    ],
  ];
  for (const [parse, value] of cases) {
    assert.throws(
      () => parse(value),
      (error) => {
        assert.ok(error instanceof NoticeError);
        assert.deepEqual(errorNotice(error), error.notice);
        assert.ok(
          "key" in error.notice && error.notice.key === "errors.invalidResponse",
        );
        return true;
      },
    );
  }
});

test("invalid delivery responses cannot replace valid state or trigger a write", async () => {
  const original = parseItemResponse({ item: { ...item, actions: ["submit"] } }).item;
  let server = original;
  let invalidRead = true;
  let invalidPrepare = true;
  let writes = 0;
  const published: unknown[] = [];
  const session = new DeliverySession(
    original,
    {
      read: async () => parseItemResponse({ item: invalidRead ? null : server }).item,
      prepare: async () => {
        server = parseItemResponse({ item: { ...server, delivery: operation } }).item;
        return parseDeliveryResponse({
          item: invalidPrepare ? null : server,
          operation,
        });
      },
      execute: async () => {
        writes++;
        const confirmed = { ...operation, state: "confirmed" };
        server = parseItemResponse({
          item: { ...server, delivery: confirmed, actions: ["reconcile"] },
        }).item;
        return parseDeliveryResponse({ item: server, operation: confirmed });
      },
      reconcile: async () => {
        throw Error("Unexpected reconcile");
      },
    },
    (state) => published.push(state.item),
  );

  await session.refresh();
  assert.equal(session.state.item, original);
  assert.equal(session.state.checking, true);
  invalidRead = false;
  await session.save();
  assert.equal(writes, 0);
  assert.equal(session.state.item.delivery?.state, "prepared");
  invalidPrepare = false;
  await session.save();
  assert.equal(writes, 1);
  assert.equal(session.state.item.delivery?.state, "confirmed");
  for (const item of published) assert.doesNotThrow(() => parseItemResponse({ item }));
});
