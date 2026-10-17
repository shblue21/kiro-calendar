import assert from "node:assert/strict";
import { test } from "node:test";
import { DeliverySession } from "./delivery.ts";
import type { CalendarItem, DeliveryResponse, Operation } from "./types.ts";

function harness(
  mode: "app" | "provider" = "provider",
  beforeRead?: () => Promise<void>,
) {
  const operation = (id: string, state: Operation["state"] = "prepared") =>
    ({ id, state, confirmation: { mode } }) as Operation;
  const row = (op: Operation | null) =>
    ({
      id: "item",
      revision: 1,
      delivery: op,
      actions:
        !op || ["prepared", "cancelled", "failed"].includes(op.state)
          ? ["submit"]
          : ["reconcile"],
    }) as CalendarItem;
  let server = row(null),
    readsFail = false,
    lose = "",
    nextId = "fresh",
    writes = 0;
  const calls: string[] = [],
    published: CalendarItem[] = [];
  const reply = () =>
    ({ item: structuredClone(server), operation: server.delivery }) as DeliveryResponse;
  const session = new DeliverySession(
    server,
    {
      read: async () => {
        calls.push("read");
        await beforeRead?.();
        if (readsFail) throw Error("offline");
        return structuredClone(server);
      },
      prepare: async () => {
        calls.push("prepare");
        if (!server.actions.includes("submit")) throw Error("action_unavailable");
        server = row(operation(nextId));
        if (lose === "prepare") throw Error("prepare response lost");
        return reply();
      },
      execute: async (id) => {
        calls.push(`execute:${id}`);
        const prepared = server.delivery,
          shown = published.at(-1)?.delivery;
        assert.ok(prepared?.state === "prepared");
        assert.ok(shown?.state === "prepared");
        assert.equal(id, prepared.id);
        assert.equal(id, shown.id);
        if (lose === "beforeExecute") throw Error("request not delivered");
        writes++;
        server = row(operation(id, "awaiting_confirmation"));
        if (lose === "execute") {
          readsFail = true;
          throw Error("execute response lost");
        }
        return reply();
      },
      reconcile: async (id) => {
        calls.push(`reconcile:${id}`);
        return reply();
      },
    },
    (state) => published.push(state.item),
  );
  return {
    session,
    calls,
    published,
    get writes() {
      return writes;
    },
    lose: (value: string) => {
      lose = value;
    },
    online: () => {
      readsFail = false;
      lose = "";
    },
    replace: () => {
      nextId = "replacement";
    },
    complete: () => {
      server = row(operation(nextId, "confirmed"));
    },
  };
}

test("prepare, confirm and recover delivery without replaying an accepted write", async () => {
  const app = harness("app");
  await app.session.save();
  assert.equal(app.writes, 0);
  app.replace();
  await app.session.save();
  assert.equal(app.writes, 0);
  assert.equal(app.session.state.item.delivery?.state, "prepared");
  await app.session.save();
  assert.equal(app.writes, 1);
  assert.deepEqual(
    app.calls.filter((call) => call.startsWith("execute:")),
    ["execute:replacement"],
  );

  const lostPrepare = harness();
  lostPrepare.lose("prepare");
  await lostPrepare.session.save();
  assert.equal(lostPrepare.session.state.item.delivery?.state, "prepared");
  lostPrepare.online();
  await lostPrepare.session.save();
  assert.equal(lostPrepare.writes, 1);

  const notSent = harness();
  notSent.lose("beforeExecute");
  await notSent.session.save();
  assert.equal(notSent.writes, 0);
  notSent.online();
  await notSent.session.save();
  assert.equal(notSent.writes, 1);

  const lost = harness();
  lost.lose("execute");
  await lost.session.save();
  assert.equal(lost.writes, 1);
  assert.equal(lost.session.state.checking, true);
  assert.equal(lost.session.state.item.delivery?.state, "prepared");
  lost.online();
  lost.calls.length = 0;
  await lost.session.refresh();
  assert.deepEqual(lost.calls, ["read"]);
  assert.equal(lost.session.state.item.delivery?.state, "awaiting_confirmation");
  await lost.session.save();
  assert.equal(lost.writes, 1);
  assert.equal(lost.calls.includes("prepare"), false);
  lost.complete();
  await lost.session.refresh();
  assert.equal(lost.session.state.item.delivery?.state, "confirmed");
  assert.equal(lost.session.state.checking, false);
});

test("a second save cannot enter the server while the first save is in progress", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let reads = 0;
  const pending = harness("provider", async () => {
    if (++reads === 1) await gate;
  });
  const first = pending.session.save();
  try {
    assert.equal(pending.session.state.busy, true);
    assert.deepEqual(pending.calls, ["read"]);
    await pending.session.save();
    assert.deepEqual(pending.calls, ["read"]);
    assert.equal(pending.writes, 0);
  } finally {
    release();
    await first;
  }
  assert.deepEqual(pending.calls, ["read", "prepare", "execute:fresh"]);
  assert.equal(pending.writes, 1);
  assert.equal(pending.session.state.busy, false);
  assert.equal(pending.session.state.item.delivery?.state, "awaiting_confirmation");
});
