import { bindLanguageSource } from "../i18n/locale.ts";
import { deliveryLabel, sourceLabel, statusLabel } from "../calendar/format.ts";
import type { Connection } from "./types.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { civilDate } from "../calendar/dates.ts";
import { eventItems } from "./projection.ts";
import type { CalendarEvent, CalendarItem } from "./types.ts";
const base = civilDate("2030-01-07");
const event: CalendarEvent = {
  eventId: "opaque",
  calendarId: "one",
  title: "跨日",
  start: "2030-01-07T23:00:00+09:00",
  end: "2030-01-08T01:00:00+09:00",
  allDay: false,
  startDate: "2030-01-07",
  endDate: "2030-01-08",
  timezone: "Asia/Seoul",
  calendarTitle: "Calendar",
  sourceTitle: "A",
  notes: "",
  recurring: false,
};
test("exclusive all-day end does not add the following day", () => {
  const items = eventItems(
    {
      ...event,
      allDay: true,
      startDate: "2030-01-07",
      endDate: "2030-01-09",
      end: "2030-01-09T00:00:00+09:00",
    },
    base,
    { first: 0, end: 7 },
    "Asia/Seoul",
  );
  assert.deepEqual(
    items.map((i) => i.day),
    [0, 1],
  );
  assert.ok(items.every((i) => i.allDay));
  assert.deepEqual(items[0].interval, {
    startDate: "2030-01-07",
    endDate: "2030-01-08",
    timeLabels: undefined,
  });
});
test("details retain the whole occurrence when the view clips days or ends at midnight", () => {
  const [clipped] = eventItems(event, base, { first: 1, end: 2 }, "Asia/Seoul");
  assert.deepEqual(clipped.timeLabels, { start: "00:00", end: "01:00" });
  assert.deepEqual(clipped.interval, {
    startDate: "2030-01-07",
    endDate: "2030-01-08",
    timeLabels: { start: "23:00", end: "01:00" },
  });
  const [midnight] = eventItems(
    { ...event, end: "2030-01-08T00:00:00+09:00" },
    base,
    { first: 0, end: 7 },
    "Asia/Seoul",
  );
  assert.equal(midnight.timeLabels?.end, "24:00");
  assert.deepEqual(midnight.interval, {
    startDate: "2030-01-07",
    endDate: "2030-01-08",
    timeLabels: { start: "23:00", end: "00:00" },
  });
});
test("DST fall-back interval retains actual duration and offset-qualified display labels", () => {
  const source = {
    ...event,
    start: "2026-11-01T01:30:00-04:00",
    end: "2026-11-01T01:15:00-05:00",
  };
  const [item] = eventItems(
    source,
    civilDate("2026-11-01"),
    { first: 0, end: 1 },
    "America/New_York",
  );
  assert.equal(item.start, 90);
  assert.equal(item.end, 135);
  assert.deepEqual(item.timeLabels, {
    start: "01:30 UTC-04:00",
    end: "01:15 UTC-05:00",
  });
  assert.deepEqual(item.interval?.timeLabels, item.timeLabels);
});
test("spring-forward and 25-hour cross-day intervals preserve elapsed time without duplicated segments", () => {
  const spring = eventItems(
    {
      ...event,
      start: "2026-03-08T01:30:00-05:00",
      end: "2026-03-08T03:15:00-04:00",
    },
    civilDate("2026-03-08"),
    { first: 0, end: 1 },
    "America/New_York",
  );
  assert.equal(spring[0].end! - spring[0].start, 45);
  const source = {
    ...event,
    start: "2026-10-31T23:30:00-04:00",
    end: "2026-11-02T00:30:00-05:00",
  };
  const items = eventItems(
    source,
    civilDate("2026-10-31"),
    { first: 0, end: 3 },
    "America/New_York",
  );
  assert.deepEqual(
    items.map((i) => i.end! - i.start),
    [30, 1500, 30],
  );
  assert.equal(
    items.reduce((n, i) => n + i.end! - i.start, 0),
    (Date.parse(source.end) - Date.parse(source.start)) / 60000,
  );
  assert.equal(new Set(items.map((i) => i.occurrenceKey)).size, 1);
  const clipped = eventItems(
    source,
    civilDate("2026-10-31"),
    { first: 1, end: 2 },
    "America/New_York",
  );
  assert.equal(clipped[0].end, 1500);
});

test("proposal acceptance keeps display identity, local visibility never changes status", async () => {
  const { calendarItems } = await import("./projection.ts");
  const d: CalendarItem = {
    id: "stable",
    revision: 1,
    title: "Local",
    start: event.start,
    end: event.end,
    timezone: "Asia/Seoul",
    status: "proposed",
    reason: "",
    source: "proactive",
    destination: { connectionId: "crew", calendarId: "default" },
    actions: ["edit", "accept", "dismiss"],
    origin: { sessionKey: "dashboard:test", identitySource: "test" },
  };
  const proposed = calendarItems([d], base, { first: 0, end: 7 }, "Asia/Seoul", true);
  const accepted = {
    ...d,
    status: "confirmed" as const,
    destination: { connectionId: "crew", calendarId: "default" },
  };
  const local = calendarItems(
    [accepted],
    base,
    { first: 0, end: 7 },
    "Asia/Seoul",
    true,
  );
  assert.deepEqual(
    local.map((i) => i.id),
    proposed.map((i) => i.id),
  );
  assert.deepEqual(
    local.map((i) => i.occurrenceKey),
    proposed.map((i) => i.occurrenceKey),
  );
  for (const item of [...proposed, ...local]) {
    assert.deepEqual(item.interval, {
      startDate: "2030-01-07",
      endDate: "2030-01-08",
      timeLabels: { start: "23:00", end: "01:00" },
    });
  }
  assert.ok(
    local.every(
      (i) => i.calendarLocation === "Crew Calendar" && i.deliveryState === undefined,
    ),
  );
  assert.ok(local.every((i) => i.storage === "local"));
  assert.ok(local.every((i) => statusLabel(i) === ""));
  assert.ok(
    calendarItems([d], base, { first: 0, end: 7 }, "Asia/Seoul", true).every(
      (i) => statusLabel(i) === "Draft",
    ),
  );
  assert.equal(
    calendarItems([accepted], base, { first: 0, end: 7 }, "Asia/Seoul", false).length,
    0,
  );
  assert.equal(
    calendarItems(
      [{ ...accepted, deletedAt: "now" }],
      base,
      { first: 0, end: 7 },
      "Asia/Seoul",
      true,
    ).length,
    0,
  );
  assert.equal(
    calendarItems([d], base, { first: 0, end: 7 }, "Asia/Seoul", false).length,
    2,
  );
  assert.equal(
    calendarItems(
      [{ ...d, status: "dismissed" }],
      base,
      { first: 0, end: 7 },
      "Asia/Seoul",
      true,
    ).length,
    0,
  );
});
test("external delivery placeholders are not local events and disappear after provider confirmation", async () => {
  const { calendarItems } = await import("./projection.ts");
  const d: CalendarItem = {
    id: "pending",
    revision: 1,
    title: "External",
    start: event.start,
    end: event.end,
    timezone: "Asia/Seoul",
    status: "confirmed",
    reason: "",
    source: "direct",
    actions: ["submit"],
    origin: { sessionKey: "calendar:manual", identitySource: "dashboard" },
    destination: { connectionId: "apple-local", calendarId: "one" },
  };
  assert.ok(
    calendarItems([d], base, { first: 0, end: 7 }, "Asia/Seoul", true).every(
      (i) => i.storage === "pending",
    ),
  );
  const connections = [
    {
      id: "apple-local",
      provider: "apple",
      displayName: { kind: "system", key: "appleLocal" },
      calendars: [{ id: "one", title: "Work", sourceTitle: "Account" }],
    },
  ] as Connection[];
  for (const language of ["en", "ko"]) {
    const restore = bindLanguageSource(() => language);
    try {
      for (const [state, english, korean] of [
        ["unsubmitted", "Pending", "저장 대기"],
        ["prepared", "Pending", "저장 대기"],
        ["awaiting_confirmation", "Confirming", "확인 대기"],
        ["cancelled", "Save cancelled", "저장 취소"],
        ["failed", "Save failed", "저장 실패"],
        ["unknown", "Unverified", "확인 필요"],
        ["unavailable", "Save record unavailable", "기록 확인 필요"],
      ] as const) {
        const value = {
          ...d,
          delivery:
            state === "unsubmitted"
              ? undefined
              : ({ state } as CalendarItem["delivery"]),
        };
        const [row] = calendarItems(
          [value],
          base,
          { first: 0, end: 7 },
          "Asia/Seoul",
          false,
          connections,
        );
        assert.equal(
          row.calendarLocation,
          language === "en"
            ? "Apple Calendar · This Mac · Account · Work"
            : "Apple Calendar · 이 Mac · Account · Work",
        );
        assert.equal(row.deliveryState, state);
        assert.equal(statusLabel(row), language === "en" ? english : korean);
        assert.notEqual(row.calendarLocation, deliveryLabel(row.deliveryState));
        assert.equal(sourceLabel(row), row.calendarLocation);
      }
    } finally {
      restore();
    }
  }
  const confirmed = {
    ...d,
    externalRef: { ...d.destination, eventId: "opaque" },
    delivery: { state: "confirmed" } as CalendarItem["delivery"],
  };
  assert.equal(
    calendarItems([confirmed], base, { first: 0, end: 7 }, "Asia/Seoul", true).length,
    0,
  );
  const remote = eventItems(
    { ...event, itemId: d.id },
    base,
    { first: 0, end: 7 },
    "Asia/Seoul",
  );
  assert.deepEqual(
    remote.map((i) => i.day),
    [0, 1],
  );
  assert.ok(remote.every((i) => i.itemId === d.id));
});

test("calendar color follows the calendar while occurrence identity stays stable", () => {
  const first = eventItems(
    { ...event, calendarColor: "#12AB34" },
    base,
    { first: 0, end: 7 },
    "Asia/Seoul",
  );
  const changed = eventItems(
    { ...event, calendarColor: "#654321" },
    base,
    { first: 0, end: 7 },
    "Asia/Seoul",
  );
  assert.ok(first.every((row) => row.calendarColor === "#12AB34"));
  assert.deepEqual(
    first.map((row) => row.id),
    changed.map((row) => row.id),
  );
  assert.equal(
    eventItems(
      { ...event, calendarColor: "not-a-color" },
      base,
      { first: 0, end: 7 },
      "Asia/Seoul",
    )[0].calendarColor,
    undefined,
  );
});
