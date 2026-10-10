import { test } from "node:test";
import assert from "node:assert/strict";
import { blankDraft, dayOffset, validateDraft } from "./editor.ts";
import {
  calendarTasks,
  workspaceReducer,
  PREVIEW_TASKS,
} from "./workspace.ts";
const base = new Date(2026, 8, 28, 12);
test("date input crosses months and rejects invalid dates", () => {
  assert.equal(dayOffset("2026-10-05", base), 7);
  assert.ok(Number.isNaN(dayOffset("2026-02-30", base)));
});
test("event editor requires increasing times but accepts all-day", () => {
  const d = {
    ...blankDraft(base, 2),
    title: "Test",
    start: "11:00",
    end: "10:00",
  };
  assert.ok(validateDraft(d, "event", base));
  assert.equal(validateDraft({ ...d, allDay: true }, "event", base), "");
});
test("task editor requires an instruction and not a fake duration", () => {
  const d = { ...blankDraft(base, 2), title: "Check", end: "00:00" };
  assert.ok(validateDraft(d, "task", base));
  assert.equal(
    validateDraft({ ...d, description: "Check logs" }, "task", base),
    "",
  );
});
test("weekly recurrence projects into another week and cancellation hides all occurrences", () => {
  const task = { ...PREVIEW_TASKS[1], repeat: "weekly" as const };
  const state = { autoOn: true, tasks: [task] };
  assert.equal(calendarTasks(state.tasks, 2)[0].day, 17);
  const cancelled = workspaceReducer(state, {
    type: "status",
    id: task.id,
    status: "cancelled",
  });
  assert.deepEqual(calendarTasks(cancelled.tasks, 2), []);
});
