import { test } from "node:test";
import assert from "node:assert/strict";
import { monday, shift, dateKey } from "./dates.ts";

test("week navigation crosses month and year without UTC date drift", () => {
  const start = monday(new Date(2027, 0, 1, 23));
  assert.equal(dateKey(start), "2026-12-28");
  assert.equal(dateKey(shift(start, 7)), "2027-01-04");
});
test("Sunday belongs to the preceding Monday without mutating the input", () => {
  const sunday = new Date(2026, 8, 27, 1);
  assert.equal(dateKey(monday(sunday)), "2026-09-21");
  assert.equal(dateKey(sunday), "2026-09-27");
});
