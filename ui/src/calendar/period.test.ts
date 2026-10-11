import { civilDate } from "./dates.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { movePeriod, monthDates, calendarRange } from "./period.ts";
import { dateKey, monday, shift } from "./dates.ts";
test("month navigation does not overflow from the 31st and crosses year", () => {
  assert.equal(dateKey(movePeriod(civilDate("2026-01-31"), "month", 1)), "2026-02-01");
  assert.equal(dateKey(movePeriod(civilDate("2026-12-31"), "month", 1)), "2027-01-01");
  assert.equal(dateKey(movePeriod(civilDate("2026-01-01"), "month", -1)), "2025-12-01");
  assert.equal(dateKey(movePeriod(civilDate("2026-12-28"), "week", 1)), "2027-01-04");
  const original = process.env.TZ;
  try {
    process.env.TZ = 'Asia/Seoul';
    const selected = civilDate('2026-10-11'), base = monday(selected);
    process.env.TZ = 'America/Los_Angeles';
    assert.equal(dateKey(base), '2026-10-05');
    assert.equal(base.dayOfWeek, 1);
    assert.equal(dateKey(shift(base, 7)), '2026-10-12');
    assert.equal(dateKey(selected), '2026-10-11');
    assert.equal(monthDates(selected)[0].dayOfWeek, 1);
    assert.deepEqual(calendarRange(selected, 'week', base), {first:0,end:7});
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
