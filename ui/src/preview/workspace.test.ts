import { test } from "node:test";
import assert from "node:assert/strict";
import { workspaceReducer, calendarTasks, PREVIEW_TASKS } from "./workspace.ts";
const state = () => ({
  autoOn: true,
  tasks: PREVIEW_TASKS.map((t) => ({ ...t })),
});
test("turning auto off retains existing tasks and does not create work", () => {
  const before = state(),
    after = workspaceReducer(before, { type: "auto", value: false });
  assert.equal(after.autoOn, false);
  assert.deepEqual(after.tasks, before.tasks);
});
test("bulk pause affects only scheduled automatic tasks", () => {
  const before = state();
  before.tasks.push({ ...PREVIEW_TASKS[1], id: "manual", automatic: false });
  const after = workspaceReducer(before, { type: "pause-auto" });
  assert.equal(after.tasks.find((t) => t.id === "ci")?.status, "paused");
  assert.equal(after.tasks.find((t) => t.id === "manual")?.status, "scheduled");
  assert.equal(after.tasks.find((t) => t.id === "update")?.status, "completed");
});
test("shift, cancel and resume share the same calendar projection", () => {
  let next = workspaceReducer(state(), {
    type: "shift",
    id: "ci",
    minutes: 30,
  });
  assert.equal(
    calendarTasks(next.tasks).find((t) => t.id === "ci")?.start,
    810,
  );
  next = workspaceReducer(next, {
    type: "status",
    id: "ci",
    status: "cancelled",
  });
  assert.equal(
    calendarTasks(next.tasks).some((t) => t.id === "ci"),
    false,
  );
  next = workspaceReducer(next, {
    type: "status",
    id: "ci",
    status: "scheduled",
  });
  assert.equal(
    calendarTasks(next.tasks).find((t) => t.id === "ci")?.start,
    810,
  );
});
