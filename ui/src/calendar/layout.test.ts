import { test } from "node:test";
import assert from "node:assert/strict";
import type { CalendarViewItem } from "./types.ts";
import { place, spanEnd, itemGeometry, minuteOffset, WEEK_LAYOUT } from "./layout.ts";
import { timeLabel } from "./format.ts";

const trigger: CalendarViewItem = {
  id: "trigger",
  occurrenceKey: "test-trigger",
  day: 1,
  kind: "trigger",
  title: "Task",
  start: 540,
  source: "test",
  description: "",
};
const run: CalendarViewItem = {
  ...trigger,
  id: "run",
  occurrenceKey: "test-run",
  kind: "run",
  start: 552,
  end: 558,
  status: "success",
};

test("nearby trigger and short execution get separate label lanes without faking duration", () => {
  const positions = place([trigger, run], 600);
  assert.notEqual(positions[0].lane, positions[1].lane);
  assert.equal(positions[0].lanes, 2);
  assert.equal(spanEnd(run, 600) - run.start, 6);
});
test("running span uses the supplied clock, completed run and trigger do not", () => {
  const active: CalendarViewItem = {
    ...run,
    end: undefined,
    status: "running",
  };
  assert.equal(spanEnd(active, 600), 600);
  assert.equal(spanEnd(active, 620), 620);
  assert.equal(spanEnd(run, 620), 558);
  assert.equal(spanEnd(trigger, 620), trigger.start);
  assert.equal(timeLabel(trigger), "09:00");
});
test("separate collision groups reclaim the full column and omit all-day events", () => {
  const later: CalendarViewItem = { ...trigger, id: "later", occurrenceKey: "test-later", start: 900 };
  const allDay: CalendarViewItem = {
    ...trigger,
    id: "all-day",
    occurrenceKey: "test-all-day",
    kind: "event",
    allDay: true,
  };
  const positions = place([later, run, allDay, trigger], 600);
  assert.deepEqual(
    positions.map(({ item, lanes }) => [item.id, lanes]),
    [
      ["trigger", 2],
      ["run", 2],
      ["later", 1],
    ],
  );
});

const shortEvent: CalendarViewItem = {
  ...trigger, id: "short", occurrenceKey: "short", kind: "event", start: 600, end: 605,
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
test("placement uses displayed pixel height rather than a separate minimum in minutes", () => {
  const next = { ...shortEvent, id: "next", start: 640, end: 645 };
  const normal = place([shortEvent, next], 700);
  assert.equal(normal[0].lanes, 1);
  assert.ok(normal[0].geometry.topPx + normal[0].geometry.occupiedHeightPx <= normal[1].geometry.topPx);
  const taller = place([shortEvent, next], 700, { ...WEEK_LAYOUT, minimumEventHeightPx: 84 });
  assert.equal(taller[0].geometry.heightPx, 84);
  assert.notEqual(taller[0].lane, taller[1].lane);
});
test("changing the hour scale changes both drawing geometry and collision decisions", () => {
  const next = { ...shortEvent, id: "next", start: 630, end: 635 };
  assert.equal(place([shortEvent, next], 700)[0].lanes, 2);
  const enlarged = { ...WEEK_LAYOUT, hourHeightPx: 128 };
  const placed = place([shortEvent, next], 700, enlarged);
  assert.equal(placed[0].lanes, 1);
  assert.equal(placed[0].geometry.topPx, 1280);
  assert.equal(placed[0].geometry.durationHeightPx, minuteOffset(5, enlarged));
});
test("running duration rail and three-line label both reserve collision space", () => {
  const longRun = { ...run, start: 600, end: 720 };
  const during = { ...shortEvent, start: 660, end: 665 };
  const placed = place([longRun, during], 730);
  assert.equal(placed[0].geometry.heightPx, WEEK_LAYOUT.runLabelHeightPx);
  assert.equal(placed[0].geometry.occupiedHeightPx, minuteOffset(120));
  assert.notEqual(placed[0].lane, placed[1].lane);
  const shortRun = { ...longRun, end: 606 };
  const near = { ...during, start: 640, end: 645 };
  assert.notEqual(place([shortRun, near], 700)[0].lane, place([shortRun, near], 700)[1].lane);
});
test('exactly touching endpoints share a lane at every supported hour scale',()=>{
 for(const hourHeightPx of [60,64,96,128])for(let start=0;start<1200;start+=5)for(const duration of [45,50,60,90]){
  const a={...shortEvent,start,end:start+duration};
  const b={...a,id:'b',start:a.end,end:a.end+60};
  const placed=place([a,b],1400,{...WEEK_LAYOUT,hourHeightPx});
  assert.equal(placed[0].lanes,1,`${hourHeightPx}px/h ${start}–${a.end}`);
  assert.equal(placed[0].geometry.occupiedEndUnit,placed[1].geometry.topUnit);
 }
});
test('actual overlaps still use separate lanes after coordinate normalization',()=>{
 const a={...shortEvent,start:485,end:535};
 const b={...a,id:'b',start:534,end:594};
 const placed=place([a,b],900);
 assert.notEqual(placed[0].lane,placed[1].lane);
});
