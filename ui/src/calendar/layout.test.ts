import assert from "node:assert/strict";
import { test } from "node:test";
import { timeLabel } from "./format.ts";
import { itemGeometry, minuteOffset, place } from "./layout.ts";
import type { CalendarViewItem } from "./types.ts";

const shortEvent: CalendarViewItem = {
  id: "short",
  occurrenceKey: "short",
  day: 0,
  kind: "event",
  title: "일정",
  start: 600,
  end: 605,
  source: "test",
  description: "",
};

test("short event uses readable height but preserves the actual duration mark", () => {
  const geometry = itemGeometry(shortEvent, 700);
  assert.equal(geometry.heightPx, 42);
  assert.equal(geometry.durationHeightPx, minuteOffset(5));
  assert.equal(geometry.durationMarkHeightPx, geometry.durationHeightPx);
  assert.equal(geometry.occupiedHeightPx, geometry.heightPx);
  assert.equal(geometry.compact, true);
  assert.equal(timeLabel(shortEvent), "10:00–10:05");
});
test("touching events share a lane while actual overlap splits it", () => {
  for (const [start, duration] of [
    [0, 45],
    [485, 50],
    [535, 60],
    [1330, 90],
  ]) {
    const a = { ...shortEvent, start, end: start + duration };
    const b = { ...a, id: "b", start: a.end, end: a.end + 60 };
    const placed = place([a, b], 1400);
    assert.equal(placed[0].lanes, 1, `${start}–${a.end}`);
    assert.equal(
      placed[0].geometry.occupiedEndUnit,
      placed[1].geometry.topUnit,
    );
    assert.equal(place([a, { ...b, start: b.start - 1 }], 1400)[0].lanes, 2);
  }
  const overlapping = Array.from({ length: 5 }, (_, i) => ({
    ...shortEvent,
    id: `event-${i}`,
    start: 600,
    end: 660,
  }));
  const following = { ...shortEvent, id: "following", start: 660, end: 860 };
  const placed = place([...overlapping, following],1400);
  assert.equal(placed.length,6);
  assert.deepEqual(placed.slice(0,5).map(x=>x.item.id),overlapping.map(x=>x.id));
  assert.ok(placed.slice(0,5).every(x=>x.lanes===5));
  assert.equal(placed[5].lanes,1);
});
