import { test } from "node:test";
import assert from "node:assert/strict";
import type { CalendarViewItem } from "./types.ts";
import { place, spanEnd } from "./layout.ts";
import { timeLabel } from "./format.ts";

const trigger: CalendarViewItem = {
  id: "trigger",
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
  const later: CalendarViewItem = { ...trigger, id: "later", start: 900 };
  const allDay: CalendarViewItem = {
    ...trigger,
    id: "all-day",
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
