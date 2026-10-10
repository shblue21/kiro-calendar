import { test } from "node:test";
import assert from "node:assert/strict";
import { monthDates, movePeriod, calendarRange } from "./period.ts";
import { dateKey } from "./dates.ts";
import { calendarTasks } from "../testing/preview/workspace.ts";

test("month grid starts on Monday and includes leap day", () => {
  const dates = monthDates(new Date(2028, 1, 15, 12));
  assert.equal(dates[0].getDay(), 1);
  assert.equal(dates.length, 42);
  assert.ok(dates.some((date) => dateKey(date) === "2028-02-29"));
});
test("month navigation does not overflow from the 31st and crosses year", () => {
  assert.equal(dateKey(movePeriod(new Date(2026, 0, 31, 12), "month", 1)), "2026-02-01");
  assert.equal(dateKey(movePeriod(new Date(2026, 11, 31, 12), "month", 1)), "2027-01-01");
  assert.equal(dateKey(movePeriod(new Date(2026, 0, 1, 12), "month", -1)), "2025-12-01");
});
test("year range includes all leap-year days and excludes the next year", () => {
  const range = calendarRange(new Date(2028, 6, 1, 12), "year", new Date(2028, 0, 1, 12));
  assert.deepEqual(range, { first: 0, end: 366 });
});
test("recurring schedules project across the requested month instead of one week", () => {
  const items = calendarTasks([{
    id: "weekly", title: "Review", description: "Review", day: 0, minute: 600,
    status: "scheduled", automatic: false, source: "test", quote: "", reason: "", repeat: "weekly",
  }], 0, { first: -2, end: 32 });
  assert.deepEqual(items.map((item) => item.day), [0, 7, 14, 21, 28]);
  assert.equal(new Set(items.map((item) => item.id)).size, 5);
});

test("monthly list excludes adjacent-month padding while preserving full month", () => {
  const base = new Date(2026, 9, 1, 12);
  assert.deepEqual(calendarRange(base, "month", base, "list"), { first: 0, end: 31 });
  assert.deepEqual(calendarRange(base, "month", base, "calendar"), { first: -3, end: 39 });
});
