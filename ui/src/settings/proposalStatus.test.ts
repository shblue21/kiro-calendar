import { test } from "node:test";
import assert from "node:assert/strict";
import { hookExecutionNotice } from "./proposalStatus.ts";

test("registered hooks distinguish no execution, success, and all failures", () => {
  assert.equal(hookExecutionNotice("not_run")?.failure, false);
  assert.equal(hookExecutionNotice("ok"), null);
  for (const status of ["error", "timeout", "blocked"]) {
    assert.equal(hookExecutionNotice(status)?.failure, true);
  }
  assert.match(hookExecutionNotice("timeout")!.text, /시간 초과/);
  assert.match(hookExecutionNotice("blocked")!.text, /차단/);
  assert.match(hookExecutionNotice(undefined)!.text, /확인하지 못/);
});
