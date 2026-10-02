import { test } from "node:test";
import assert from "node:assert/strict";
import { workspaceReducer, calendarTasks, prepStatus, PREVIEW_TASKS } from "./workspace.ts";
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
test("prep status reads run evidence, never infers success", () => {
  const now = { day: 2, minute: 700 };
  const base = { ...PREVIEW_TASKS[1], run: undefined };
  assert.equal(prepStatus({ ...base, day: 3 }, now), "예약됨");
  assert.equal(prepStatus({ ...base, day: 1 }, now), "실행 확인 안 됨");
  assert.equal(prepStatus({ ...base, status: "completed" }, now), "실행 확인 안 됨");
  assert.equal(prepStatus({ ...base, run: "failed" }, now), "실행 실패");
  assert.equal(prepStatus({ ...base, run: "success" }, now), "실행 성공");
  assert.equal(prepStatus({ ...base, day: 1, status: "paused" }, now), "일시정지");
});
