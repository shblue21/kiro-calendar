import { test } from "node:test";
import assert from "node:assert/strict";
import { movePeriod } from "./period.ts";
import { dateKey } from "./dates.ts";
test("month navigation does not overflow from the 31st and crosses year", () => {
  assert.equal(dateKey(movePeriod(new Date(2026, 0, 31, 12), "month", 1)), "2026-02-01");
  assert.equal(dateKey(movePeriod(new Date(2026, 11, 31, 12), "month", 1)), "2027-01-01");
  assert.equal(dateKey(movePeriod(new Date(2026, 0, 1, 12), "month", -1)), "2025-12-01");
  assert.equal(dateKey(movePeriod(new Date(2026, 11, 28, 12), "week", 1)), "2027-01-04");
});
