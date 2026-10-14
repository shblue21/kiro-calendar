import { connectionName } from "../i18n/delivery.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  confirmationAction,
  confirmationPending,
  connectionNotice,
} from "../i18n/delivery.ts";
import { en } from "../i18n/en.ts";
import { weekdays } from "../i18n/format.ts";
import { resolveLocale, t } from "../i18n/index.ts";
import { ko } from "../i18n/ko.ts";
import { bindLanguageSource } from "../i18n/locale.ts";
import { NoticeError, notice, renderNotice } from "../i18n/notice.ts";
import { collectionNotice, errorNotice } from "./api.ts";

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
test("English is the base; Korean keys and substitutions match without hardcoded UI copy", () => {
  assert.equal(resolveLocale("ko-KR"), "ko");
  assert.equal(resolveLocale("en-GB"), "en");
  assert.equal(resolveLocale("fr"), "en");
  assert.deepEqual(Object.keys(ko).sort(), Object.keys(en).sort());
  for (const key of Object.keys(en) as (keyof typeof en)[]) {
    const source = en[key],
      translated = ko[key];
    const variants = (value: string | { one: string; other: string }) =>
      typeof value === "string" ? [value] : [value.one, value.other];
    assert.equal(typeof source, typeof translated, key);
    variants(source).forEach((text, i) =>
      assert.deepEqual(
        text.match(/\{[a-zA-Z]+\}/g)?.sort() ?? [],
        variants(translated)
          [i].match(/\{[a-zA-Z]+\}/g)
          ?.sort() ?? [],
        key,
      ),
    );
  }
  assert.equal(t("calendar.eventCount", { count: 0 }), "0 events");
  assert.equal(t("calendar.eventCount", { count: 1 }), "1 event");
  assert.equal(
    t("calendar.monthSummary", { year: "2026", month: "10", count: 1 }),
    "Show 2026-10, 1 event",
  );
  const oldConfirmation = {
    mode: "provider" as const,
    actionLabel: "Mac에서 최종 확인",
    pendingMessage: "기다리세요",
  };
  assert.equal(confirmationAction(oldConfirmation, "apple"), "Confirm on Mac");
  assert.equal(/[가-힣]/.test(confirmationPending(oldConfirmation)), false);
  assert.equal(/[가-힣]/.test(connectionNotice("needs_authorization")), false);
  assert.equal(
    connectionName({ kind: "system", key: "appleLocal" }),
    "Apple Calendar · This Mac",
  );
  assert.equal(connectionName({ kind: "custom", text: "내 계정" }), "내 계정");
  const partialWarning = collectionNotice([
    { code: "events_truncated", limit: 5000, calendarId: "test" },
  ]);
  assert.match(renderNotice(partialWarning), /Only 5,000 events/);
  assert.match(renderNotice(partialWarning), /Shorten the date range/);
  assert.match(
    renderNotice(errorNotice({ code: "events_truncated" })),
    /Some events/,
  );
  assert.match(
    renderNotice(errorNotice({ code: "calendar_missing" })),
    /calendar is unavailable/,
  );
  const englishDays = weekdays();
  for (let i = 0; i < 12; i++) assert.equal(weekdays(), englishDays);
  assert.equal(t("calendar.eventCount", { count: 3 }), "3 events");
  assert.equal(weekdays()[0], "Mon");
  assert.equal(
    weekdays()
      .map((x) => x)
      .join(","),
    "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
  );
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  try {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { documentElement: { lang: "ko-KR" } },
    });
    assert.equal(
      confirmationAction(oldConfirmation, "apple"),
      "Mac에서 최종 확인",
    );
    assert.equal(
      connectionName({ kind: "system", key: "appleLocal" }),
      "Apple Calendar · 이 Mac",
    );
    assert.match(renderNotice(partialWarning), /5,000개/);
    assert.match(renderNotice(partialWarning), /조회 기간/);
    assert.equal(t("calendar.eventCount", { count: 1 }), "1건");
    assert.equal(t("calendar.eventCount", { count: 3 }), "3건");
    assert.equal(
      weekdays()
        .map((x) => x)
        .join(","),
      "월,화,수,목,금,토,일",
    );
  } finally {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else Reflect.deleteProperty(globalThis, "document");
  }
  let hostLanguage = "ko";
  const unbind = bindLanguageSource(() => hostLanguage);
  try {
    const saved = notice("common.eventDeleted");
    const validation = errorNotice(
      new NoticeError(notice("editor.invalidFields")),
    );
    const conflict = errorNotice(
      Object.assign(new Error("API error"), {
        status: 409,
        body: JSON.stringify({ code: "stale_event", error: "한국어 원문" }),
      }),
    );
    const unknown = errorNotice(
      Object.assign(new Error("private diagnostic"), {
        status: 500,
        body: "broken body with private data",
      }),
    );
    const damaged = collectionNotice([
      { itemId: "test-id", message: "원본 오류" },
    ]);
    assert.equal(renderNotice(saved), "일정을 삭제했습니다.");
    hostLanguage = "en";
    assert.equal(renderNotice(saved), "Event deleted.");
    for (const value of [validation, conflict, unknown, damaged]) {
      const text = renderNotice(value);
      assert.ok(text);
      assert.equal(/[가-힣]/.test(text), false);
      assert.equal(text.includes("private"), false);
    }
    assert.match(renderNotice(conflict), /changed elsewhere/);
    assert.match(renderNotice(damaged), /test-id/);
    hostLanguage = "ko";
    assert.equal(renderNotice(saved), "일정을 삭제했습니다.");
  } finally {
    unbind();
  }
  const root = new URL("../", import.meta.url).pathname;
  function scan(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "i18n") continue;
      const p = join(dir, entry.name);
      if (entry.isDirectory()) scan(p);
      else if (/\.tsx?$/.test(p) && !p.includes(".test."))
        assert.equal(/[가-힣]/.test(readFileSync(p, "utf8")), false, p);
    }
  }
  scan(root);
});
