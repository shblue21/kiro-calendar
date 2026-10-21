var ol = Object.defineProperty;
var il = (t, e, n) => e in t ? ol(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var gr = (t, e, n) => il(t, typeof e != "symbol" ? e + "" : e, n);
import { jsx as p, jsxs as k, Fragment as tn } from "react/jsx-runtime";
import { useId as Io, useRef as xe, useState as I, useLayoutEffect as al, useCallback as _t, Fragment as sl, useEffect as $e, useMemo as ks } from "react";
import { useLanguageGeneration as cl, activeLocale as ll, useAppApi as zt, useAppInfo as Ut, useChatLauncher as dl } from "@kirocrew/app-sdk";
import { Badge as Ui, Input as Lo, Btn as P, SegmentedControl as Ts, Toggle as ul, PageHeader as hl } from "@kirocrew/app-sdk/ui";
import * as Ta from "lucide-react";
function ct({ children: t }) {
  return /* @__PURE__ */ p("p", { className: "cc-inline-error", role: "alert", children: t });
}
function di({ label: t, hidden: e = !1, children: n }) {
  return /* @__PURE__ */ p("section", { className: "cc-workspace-page", "aria-label": t, hidden: e, children: n });
}
function Kr({
  title: t,
  actions: e,
  description: n,
  children: r
}) {
  const o = Io();
  return /* @__PURE__ */ k("section", { className: "cc-section", "aria-labelledby": o, children: [
    /* @__PURE__ */ k("header", { className: "cc-section-header", children: [
      /* @__PURE__ */ p("h3", { id: o, children: t }),
      e && /* @__PURE__ */ p("div", { className: "cc-section-actions", children: e })
    ] }),
    /* @__PURE__ */ k("div", { className: "cc-section-body", children: [
      n && /* @__PURE__ */ p("p", { className: "cc-page-section-note", children: n }),
      r
    ] })
  ] });
}
function ui({
  title: t,
  children: e
}) {
  return /* @__PURE__ */ k("details", { className: "cc-disclosure", children: [
    /* @__PURE__ */ p("summary", { children: t }),
    /* @__PURE__ */ p("div", { className: "cc-disclosure-body", children: e })
  ] });
}
function ml({
  title: t,
  hidden: e,
  children: n
}) {
  return /* @__PURE__ */ p(di, { label: t, hidden: e, children: /* @__PURE__ */ k("div", { className: "cc-settings-content", children: [
    /* @__PURE__ */ p("header", { className: "cc-page-heading", children: /* @__PURE__ */ p("h2", { children: t }) }),
    n
  ] }) });
}
function _a({
  children: t,
  action: e
}) {
  return /* @__PURE__ */ k("div", { className: "cc-settings-row", children: [
    /* @__PURE__ */ p("div", { className: "cc-settings-row-content", children: t }),
    /* @__PURE__ */ p("div", { className: "cc-settings-row-action", children: e })
  ] });
}
function mt({ children: t }) {
  return /* @__PURE__ */ p("div", { className: "cc-control-cell", children: t });
}
function _s({
  field: t,
  action: e,
  meta: n,
  fieldMaxWidth: r
}) {
  return /* @__PURE__ */ k("div", { className: "cc-control-row", children: [
    /* @__PURE__ */ p("div", { className: "cc-control-field", style: { maxInlineSize: r }, children: /* @__PURE__ */ p(mt, { children: t }) }),
    n != null && /* @__PURE__ */ p("span", { className: "cc-control-meta", children: n }),
    /* @__PURE__ */ p(mt, { children: e })
  ] });
}
function fl() {
  const t = xe(null), [e, n] = I(0);
  return al(() => {
    const r = t.current;
    if (!r) return;
    const o = new ResizeObserver(([a]) => n(a.contentRect.width)), i = getComputedStyle(r);
    return n(
      r.clientWidth - parseFloat(i.paddingLeft) - parseFloat(i.paddingRight)
    ), o.observe(r), () => o.disconnect();
  }, []), { ref: t, width: e };
}
const $r = Object.freeze({
  hourHeightPx: 64,
  minimumEventHeightPx: 42,
  compactEventThresholdPx: 46,
  minimumDurationMarkPx: 2
}), cn = 64;
function hi(t, e) {
  return Math.round(t * e.hourHeightPx * cn / 60);
}
function ni(t) {
  return Math.round(t * cn);
}
function jn(t, e = $r) {
  return hi(t, e) / cn;
}
function gl(t, e = $r) {
  const n = hi(t.start, e), o = Math.max(
    n,
    hi(t.end ?? t.start, e)
  ) - n, i = Math.max(o, ni(e.minimumEventHeightPx)), a = Math.max(o, ni(e.minimumDurationMarkPx)), s = n + Math.max(i, a);
  return {
    topUnit: n,
    occupiedEndUnit: s,
    topPx: n / cn,
    heightPx: i / cn,
    durationHeightPx: o / cn,
    durationMarkHeightPx: a / cn,
    occupiedHeightPx: (s - n) / cn,
    compact: o < ni(e.compactEventThresholdPx)
  };
}
function pl(t, e = $r) {
  const n = [...t].filter((c) => !c.allDay).sort((c, l) => c.start - l.start), r = [];
  let o = [], i = [], a = -1;
  const s = () => {
    const c = Math.max(1, ...i.map((l) => l.lane + 1));
    i.forEach((l) => l.lanes = c), i = [];
  };
  return n.forEach((c) => {
    const l = gl(c, e);
    l.topUnit >= a && (s(), o = []), o = o.filter((g) => g.end > l.topUnit);
    let d = 0;
    for (; o.some((g) => g.lane === d); ) d++;
    const h = l.occupiedEndUnit;
    o.push({ end: h, lane: d }), a = Math.max(a, h);
    const f = { item: c, lane: d, lanes: 1, geometry: l };
    r.push(f), i.push(f);
  }), s(), r;
}
const Ma = Object.freeze({
  listBelowPx: 760,
  dockDetailAbovePx: 1440
}), yl = {
  "timezone.loadError": "Could not read the system time zone.",
  "common.loadingCalendar": "Loading calendar…",
  "common.checkAgain": "Check again",
  "calendar.loadError": "Could not load events. {error}",
  "calendar.connectionLoadError": "Could not load calendar connections. External events may be missing from this view. {error}",
  "settings.loadError": "Could not load calendar preferences. {error}",
  "calendar.lookupError": "Event lookup failed. {error}",
  "editor.titleTooLong": "Use no more than 120 characters for the title.",
  "editor.notesTooLong": "Use no more than 2,000 characters for the description.",
  "editor.destinationLoading": "Wait for the default calendar to load, then try again.",
  "common.eventDeleted": "Event deleted.",
  "common.eventRestored": "Event restored.",
  "common.returnToConversation": "Return to conversation",
  "common.reviewAndSave": "Review and save",
  "common.edit": "Edit",
  "common.externalSaveStatus": "External save status",
  "common.delete": "Delete",
  "common.calendar": "Calendar",
  "common.refreshEvents": "Refresh events",
  "common.addEvent": "Add event",
  "common.calendarSettings": "Calendar settings",
  "common.undo": "Undo",
  "common.dismissMessage": "Dismiss message",
  "common.settings": "Settings",
  "common.externalSaveHistory": "External save history",
  "common.saveStatus": "Save status",
  "common.day": "day",
  "common.today": "Today",
  "common.search": "Search",
  "calendar.searchPlaceholder": "Search titles, descriptions, sources and status in {period}",
  "common.thisYear": "this year",
  "common.theDisplayedCalendar": "the displayed calendar",
  "common.thisWeek": "this week",
  "common.close": "Close",
  "common.calendarGrid": "Calendar grid",
  "common.loadingEvents": "Loading events",
  "calendar.loadingDescription": "Reading events from your selected calendars.",
  "common.loading": "Loading…",
  "calendar.noMatches": "No events match your filters",
  "calendar.empty": "No events to display yet",
  "calendar.periodEmpty": "No events in this period",
  "calendar.filtersHint": "Check your search and display filters.",
  "calendar.emptyDescription": "Your Crew events, saved drafts and events from selected calendars appear here.",
  "calendar.periodEmptyDescription": "Choose another period or add an event.",
  "common.resetSearchAndFilters": "Reset search and filters",
  "common.reload": "Reload",
  "common.previous": "Previous {period}",
  "common.periodMonth": "month",
  "common.periodYear": "year",
  "common.week": "week",
  "common.next": "Next {period}",
  "common.searchEvents": "Search events",
  "common.displayPeriod": "Display period",
  "common.viewWeek": "Week",
  "common.viewMonth": "Month",
  "common.viewYear": "Year",
  "common.displayLayout": "Display layout",
  "common.list": "List",
  "common.show": "Show",
  "common.itemsToDisplay": "Items to display",
  "common.eventsAndDrafts": "Events and drafts",
  "common.selectedEventDetails": "Selected event details",
  "common.draftForReview": "Draft for review",
  "common.closeDetails": "Close details",
  "common.date": "Date",
  "common.time": "Time",
  "common.save": "Save",
  "details.externalEditHint": "Edit or delete this event in its original calendar.",
  "common.allDay": "All day",
  "calendar.dayOverflow": {
    one: "Show {count} more event on {date}",
    other: "Show {count} more events on {date}"
  },
  "calendar.clockChangeNotice": "Clocks change this week. Check the time labels in each day column.",
  "calendar.dayLabel": "{month}/{day} ({weekday})",
  "common.now": "Now",
  "calendar.yearLegend": "Dots mark days with matching events. Select a month to see details.",
  "calendar.monthSummary": {
    one: "Show {year}-{month}, {count} event",
    other: "Show {year}-{month}, {count} events"
  },
  "calendar.eventCount": {
    one: "{count} event",
    other: "{count} events"
  },
  "common.event": "Event",
  "common.checkTheDateAndTime": "Check the date and time.",
  "time.ambiguousOrMissing": "This time does not exist or occurs twice due to a clock change. Choose another time.",
  "common.checkTheDateRange": "Check the date range.",
  "time.offsetRequired": "Choose a UTC offset for the repeated time.",
  "time.invalid": "This date or time does not exist. Choose another time.",
  "common.externalCalendarConnections": "External calendar connections",
  "common.refreshConnections": "Refresh connections",
  "connections.empty": "No external connections. You can still use Crew Calendar.",
  "common.checkThePermissionPrompt": "Check the permission prompt…",
  "common.chooseTheCalendarsToDisplay": "Choose the calendars to display.",
  "common.readOnly": "· Read-only",
  "common.defaultCalendar": "Default calendar",
  "settings.localStorageDescription": "Crew Calendar stores events in this Crew installation without an external account. Events do not sync between Crew installations.",
  "common.defaultSaveCalendar": "Default save calendar",
  "common.showCrewCalendar": "Show Crew Calendar",
  "common.saveToCalendar": "Save to calendar",
  "editor.destinationUnavailable": "The previous calendar is unavailable. Choose another calendar.",
  "common.eventDrafts": "Saved drafts",
  "common.refreshDrafts": "Refresh drafts",
  "common.noDraftsToReview": "No drafts to review.",
  "drafts.emptyHint": "In a conversation, ask “Keep this as a draft for later review” to add it here. Automatic suggestions stay in the conversation; they do not create saved drafts.",
  "common.saveConfirmed": "Save confirmed",
  "common.awaitingSaveConfirmation": "Awaiting save confirmation",
  "common.saveNeedsVerification": "Save needs verification",
  "common.reviewAndEdit": "Review and edit",
  "common.checkSaveStatus": "Check save status",
  "common.originalConversation": "Original conversation",
  "common.dismiss": "Dismiss",
  "common.newEvent": "New event",
  "common.reviewSuggestion": "Review draft",
  "common.saveAsEvent": "Save as event",
  "common.saveDraftChanges": "Save draft changes",
  "common.editEventDetails": "Edit event details",
  "common.editExternalSaveDetails": "Edit external save details",
  "common.saveChanges": "Save changes",
  "editor.timezoneChanged": "The system time zone changed. Times have been updated. Review them before saving again.",
  "editor.invalidFields": "Check the title, start and end times.",
  "common.closeEditor": "Close editor",
  "common.title": "Title",
  "common.start": "Start",
  "common.end": "End",
  "common.description": "Description",
  "common.discardYourUnsavedChanges": "Discard your unsaved changes?",
  "common.keepEditing": "Keep editing",
  "common.discardAndClose": "Discard and close",
  "common.cancel": "Cancel",
  "common.saving": "Saving…",
  "common.restore": "Restore",
  "common.noDeletedEvents": "No deleted events.",
  "common.externalCalendar": "External calendar",
  "common.closeSaveStatus": "Close save status",
  "delivery.notSubmitted": "Not saved to the external calendar yet.",
  "delivery.reviewHint": "Ready to save.",
  "common.checkingTheSaveResult": "Checking the save result.",
  "delivery.confirmed": "Save confirmed · verified in the external calendar.",
  "delivery.cancelled": "External save cancelled.",
  "delivery.failed": "Could not save to the external calendar.",
  "delivery.unknown": "The save result is uncertain. Verify it before trying again to avoid duplicates.",
  "delivery.eventChanged": "The original event changed or is unavailable.",
  "delivery.checking": "Checking the current status of the existing save request.",
  "common.editDetails": "Edit details",
  "common.deleteRequest": "Delete request",
  "common.saveToThisCalendar": "Save to this calendar",
  "common.continueExternalSave": "Continue external save",
  "common.checkCurrentSaveStatus": "Check current save status",
  "common.verifySaveResult": "Verify save result",
  "common.thisTimeOccursTwice": "This time occurs twice.",
  "time.offsetLabel": "{field} UTC offset",
  "common.chooseWhichOccurrence": "Choose which occurrence",
  "errors.requestFailed": "Could not complete the request. Try again.",
  "errors.invalidResponse": "The server returned an invalid response. Refresh and try again.",
  "common.draft": "Draft",
  "calendar.statusPending": "Pending",
  "calendar.statusAwaiting": "Confirming",
  "calendar.statusUnknown": "Unverified",
  "calendar.statusUnavailable": "Save record unavailable",
  "calendar.statusFailed": "Save failed",
  "calendar.statusCancelled": "Save cancelled",
  "common.crewSuggestion": "Crew suggestion",
  "common.awaitingExternalSaveConfirmation": "Awaiting external save confirmation",
  "common.externalSaveNeedsVerification": "External save needs verification",
  "common.externalSaveRecordsNeedRecovery": "External save records need recovery",
  "common.externalSaveFailed": "External save failed",
  "common.externalSaveCancelled": "External save cancelled",
  "common.externalSavePending": "External save pending",
  "suggestions.loadError": "Could not load settings. Try again.",
  "suggestions.saveError": "Could not confirm the change. Refresh settings before trying again.",
  "common.eventSuggestionsInConversations": "Event suggestions in conversations",
  "suggestions.showExample": "View conversation example",
  "suggestions.hideExample": "Hide conversation example",
  "suggestions.description": "Crew can suggest a useful time to act during your conversation.",
  "suggestions.reviewHint": "Choose a reply in chat. Events are added to Crew Calendar only after you agree.",
  "common.checking": "Checking",
  "common.savingStatus": "Saving",
  "suggestions.activationHint": "Applies from the next message in selected conversations. May use additional tokens.",
  "common.refreshSettings": "Refresh settings",
  "suggestions.policyBlocked": "Crew policy does not allow this hook to run.",
  "suggestions.setupRequired": "Connect suggestions once to get started.",
  "suggestions.scopeHint": "Currently available in selected regular conversations only. Private, temporary and subagent conversations are excluded.",
  "common.closedConversation": "Closed conversation",
  "common.remove": "Remove",
  "common.conversationForSuggestions": "Conversation for suggestions",
  "common.chooseAConversation": "Choose a conversation",
  "common.add": "Add",
  "common.connectSuggestions": "Connect suggestions",
  "suggestions.setupInstructions": "In Crew agent features → Hooks, register the command below for UserPromptSubmit. Name it Crew Calendar · schedule suggestions, leave the condition empty and enable it. Then refresh settings.",
  "suggestions.exampleUser": "Me: “The application is due Friday. I can spare Thursday, 19:00–19:30, to start writing.”",
  "suggestions.exampleAssistant": "Crew: “Shall I add application writing on Thursday, 19:00–19:30, to Crew Calendar?” — Register as shown / Change time / Not now",
  "suggestions.registered": "The hook is registered. A run in a conversation has not been verified yet.",
  "suggestions.runTimeout": "The latest hook run timed out. Check Crew hook history.",
  "suggestions.runBlocked": "The latest hook run was blocked by policy. Check Crew hook history.",
  "suggestions.runFailed": "The latest hook run failed. Check Crew hook history.",
  "suggestions.runUnknown": "The hook is registered, but its recent run status is unavailable.",
  "editor.timezoneHint": "Time zone: {zone}. Saves a single event without repeats or invitations. This app does not send reminders.",
  "trash.count": "Deleted events · {count}",
  "suggestions.conversationCount": "Enabled conversations · {count}",
  "time.occurrenceOffset": "Occurrence {occurrence} · UTC{offset}",
  "common.moreEvents": "+{count} more",
  "delivery.confirmInProvider": "Confirm in calendar app",
  "delivery.confirmOnMac": "Confirm on Mac",
  "delivery.providerPending": "Confirm the event in the calendar app. Closing this panel does not cancel that confirmation.",
  "connections.authorize": "Connect calendar",
  "connections.permissionRequired": "Allow calendar access to read and save events.",
  "connections.permissionDenied": "Calendar access is denied. Check system privacy settings.",
  "connections.unsupported": "This calendar connection is not supported on this device.",
  "connections.unavailable": "Could not reach the calendar connection. Try again.",
  "errors.staleEvent": "This event changed elsewhere. Reload it before editing.",
  "errors.requestConflict": "This save request has different contents. Reload the event.",
  "errors.actionUnavailable": "Check the current save status before continuing.",
  "errors.operationChanged": "This save request was replaced. Check the current event.",
  "errors.storageUnavailable": "Could not read or save calendar data. Try again.",
  "errors.deliveryUnavailable": "The save record needs recovery before this event can be changed.",
  "errors.readOnly": "This calendar is read-only. Choose another calendar.",
  "errors.calendarMissing": "The selected calendar is unavailable. Check the connection.",
  "errors.connectionMissing": "The original connection is unavailable. Choose a destination explicitly.",
  "errors.connectionChanged": "The connection changed. Review the save request again.",
  "errors.helperMissing": "The calendar helper is missing. Reinstall the Calendar app.",
  "errors.helperTimeout": "The calendar helper did not respond in time. Check the save status.",
  "errors.helperUnavailable": "Could not contact the calendar helper. Check the connection.",
  "errors.appDisabled": "Calendar is disabled. Enable it before saving.",
  "errors.providerResponse": "Could not verify the calendar response. Check the connection and save status.",
  "errors.itemUnavailable": "Could not read this event. Its stored data is preserved.",
  "errors.recordUnavailable": "Could not read event {id}. Its stored data is preserved.",
  "errors.ownerRequired": "Open Calendar in the owner dashboard to continue.",
  "connections.appleLocal": "Apple Calendar · This Mac",
  "errors.eventsTruncated": {
    one: "Only {count} event is shown. Shorten the date range to see all events.",
    other: "Only {count} events are shown. Shorten the date range to see all events."
  },
  "errors.eventsIncomplete": "Some events are not shown. Shorten the date range and try again.",
  "destination.unavailable": "Calendar unavailable",
  "delivery.statusLabel": "Save status",
  "common.source": "Source",
  "navigation.label": "Calendar workspace",
  "navigation.proposals": "Saved drafts",
  "navigation.activity": "History",
  "common.viewDay": "Day",
  "common.thisDay": "this day",
  "calendar.chooseDate": "Choose a date",
  "calendar.goToDate": "Go to date",
  "calendar.openDay": "Show {date}",
  "calendar.addOnDate": "Add an event on {date}"
}, vl = (t) => /^ko(?:-|$)/i.test(t) ? "ko" : "en";
let po = () => typeof document > "u" ? "en" : document.documentElement.lang || navigator.language;
function wl(t) {
  const e = po;
  return po = t, () => {
    po = e;
  };
}
const wt = () => vl(po()), Na = /* @__PURE__ */ new Map(), Ra = /* @__PURE__ */ new Map(), Oa = /* @__PURE__ */ new Map(), $a = /* @__PURE__ */ new Map();
function ji(t) {
  const e = JSON.stringify([wt(), t]);
  let n = Na.get(e);
  return n || (n = new Intl.DateTimeFormat(wt(), t), Na.set(e, n)), n;
}
function bl(t) {
  let e = Ra.get(wt());
  return e || (e = new Intl.NumberFormat(wt()), Ra.set(wt(), e)), e.format(t);
}
function xl(t) {
  let e = Oa.get(wt());
  return e || (e = new Intl.PluralRules(wt()), Oa.set(wt(), e)), e.select(t);
}
const Mt = (t, e = { dateStyle: "medium" }) => ji({ ...e, timeZone: "UTC" }).format(
  /* @__PURE__ */ new Date(`${t.toString()}T12:00:00Z`)
), Cl = (t, e) => ji({
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: e
}).format(new Date(t));
function Ir() {
  let t = $a.get(wt());
  if (!t) {
    const e = ji({ weekday: "short", timeZone: "UTC" });
    t = Object.freeze(
      Array.from(
        { length: 7 },
        (n, r) => e.format(new Date(Date.UTC(2026, 9, 5 + r)))
      )
    ), $a.set(wt(), t);
  }
  return t;
}
const Dl = {
  "timezone.loadError": "OS 시스템 시간대를 확인하지 못했습니다.",
  "common.loadingCalendar": "캘린더를 불러오고 있습니다.",
  "common.checkAgain": "다시 확인",
  "calendar.loadError": "일정을 불러오지 못했습니다. {error}",
  "calendar.connectionLoadError": "캘린더 연결 정보를 불러오지 못했습니다. 외부 일정이 이 화면에 표시되지 않을 수 있습니다. {error}",
  "settings.loadError": "기본 캘린더 설정을 불러오지 못했습니다. {error}",
  "calendar.lookupError": "일정 조회 실패. {error}",
  "editor.titleTooLong": "제목은 120자 이내로 입력하세요.",
  "editor.notesTooLong": "설명은 2,000자 이내로 입력하세요.",
  "editor.destinationLoading": "기본 저장 위치를 불러온 뒤 다시 시도하세요.",
  "common.eventDeleted": "일정을 삭제했습니다.",
  "common.eventRestored": "일정을 복원했습니다.",
  "common.returnToConversation": "원래 대화로 돌아가기",
  "common.reviewAndSave": "검토·저장",
  "common.edit": "수정",
  "common.externalSaveStatus": "외부 저장 상태",
  "common.delete": "삭제",
  "common.calendar": "캘린더",
  "common.refreshEvents": "일정 새로고침",
  "common.addEvent": "일정 추가",
  "common.calendarSettings": "캘린더 설정",
  "common.undo": "실행 취소",
  "common.dismissMessage": "안내 닫기",
  "common.settings": "설정",
  "common.externalSaveHistory": "외부 저장 기록",
  "common.saveStatus": "저장 상태",
  "common.day": "일",
  "common.today": "오늘",
  "common.search": "검색어",
  "calendar.searchPlaceholder": "{period}의 제목·설명·출처·상태 검색",
  "common.thisYear": "이 해",
  "common.theDisplayedCalendar": "표시된 달력",
  "common.thisWeek": "이 주",
  "common.close": "닫기",
  "common.calendarGrid": "달력",
  "common.loadingEvents": "일정을 불러오고 있습니다",
  "calendar.loadingDescription": "선택한 캘린더에서 일정을 읽고 있습니다.",
  "common.loading": "불러오는 중",
  "calendar.noMatches": "검색·표시 조건에 맞는 항목이 없습니다",
  "calendar.empty": "아직 표시할 일정이 없습니다",
  "calendar.periodEmpty": "이 기간에는 일정이 없습니다",
  "calendar.filtersHint": "검색어와 표시 조건을 확인하세요.",
  "calendar.emptyDescription": "Crew 일정, 보관한 초안과 선택한 외부 캘린더의 일정이 표시됩니다.",
  "calendar.periodEmptyDescription": "다른 기간으로 이동하거나 새 일정을 추가하세요.",
  "common.resetSearchAndFilters": "검색·필터 초기화",
  "common.reload": "다시 불러오기",
  "common.previous": "이전 {period}",
  "common.periodMonth": "달",
  "common.periodYear": "해",
  "common.week": "주",
  "common.next": "다음 {period}",
  "common.searchEvents": "일정 검색",
  "common.displayPeriod": "표시 기간",
  "common.viewWeek": "주간",
  "common.viewMonth": "월간",
  "common.viewYear": "연간",
  "common.displayLayout": "표시 방식",
  "common.list": "목록",
  "common.show": "표시",
  "common.itemsToDisplay": "표시할 항목",
  "common.eventsAndDrafts": "일정·초안",
  "common.selectedEventDetails": "선택한 일정 상세",
  "common.draftForReview": "검토용 초안",
  "common.closeDetails": "상세 닫기",
  "common.date": "날짜",
  "common.time": "시간",
  "common.save": "저장",
  "details.externalEditHint": "기존 일정의 수정·삭제는 원본 캘린더에서 해주세요.",
  "common.allDay": "종일",
  "calendar.dayOverflow": {
    one: "{date} 일정 {count}개 더 보기",
    other: "{date} 일정 {count}개 더 보기"
  },
  "calendar.clockChangeNotice": "시각 변경이 있는 주입니다. 각 날짜 열의 시각을 기준으로 확인하세요.",
  "calendar.dayLabel": "{month}월 {day}일 {weekday}요일",
  "common.now": "현재",
  "calendar.yearLegend": "점은 표시 조건에 맞는 일정이 있는 날입니다. 월을 눌러 자세히 보세요.",
  "calendar.monthSummary": {
    one: "{year}년 {month}월 보기, {count}건",
    other: "{year}년 {month}월 보기, {count}건"
  },
  "calendar.eventCount": {
    one: "{count}건",
    other: "{count}건"
  },
  "common.event": "일정",
  "common.checkTheDateAndTime": "날짜와 시간을 확인하세요.",
  "time.ambiguousOrMissing": "존재하지 않거나 시간 변경으로 두 번 존재하는 시각입니다. 다른 시각을 선택하세요.",
  "common.checkTheDateRange": "조회 날짜 범위를 확인하세요.",
  "time.offsetRequired": "반복되는 시각의 UTC 오프셋을 선택하세요.",
  "time.invalid": "존재하지 않는 날짜·시각입니다. 다른 시각을 선택하세요.",
  "common.externalCalendarConnections": "외부 캘린더 연결",
  "common.refreshConnections": "연결 다시 확인",
  "connections.empty": "외부 연결이 없습니다. Crew Calendar는 계속 사용할 수 있습니다.",
  "common.checkThePermissionPrompt": "접근 허용을 확인하세요…",
  "common.chooseTheCalendarsToDisplay": "표시할 캘린더를 선택하세요.",
  "common.readOnly": "· 읽기 전용",
  "common.defaultCalendar": "기본 캘린더",
  "settings.localStorageDescription": "일정은 이 Crew 설치의 저장소에 보관됩니다. 외부 계정 없이 사용할 수 있으며, 다른 Crew 설치와 동기화되지 않습니다.",
  "common.defaultSaveCalendar": "기본 저장 캘린더",
  "common.showCrewCalendar": "Crew Calendar 표시",
  "common.saveToCalendar": "저장할 캘린더",
  "editor.destinationUnavailable": "기존 저장 위치에 접근할 수 없습니다. 다른 캘린더를 선택하세요.",
  "common.eventDrafts": "보관한 초안",
  "common.refreshDrafts": "초안 다시 불러오기",
  "common.noDraftsToReview": "보관 중인 초안이 없습니다.",
  "drafts.emptyHint": "대화에서 “나중에 검토할 초안으로 보관해 줘”라고 요청하면 이곳에서 검토할 수 있습니다. 자동 제안은 대화에만 남으며 초안을 만들지 않습니다.",
  "common.saveConfirmed": "저장 확인됨",
  "common.awaitingSaveConfirmation": "저장 확인 대기",
  "common.saveNeedsVerification": "저장 결과 확인 필요",
  "common.reviewAndEdit": "검토·수정",
  "common.checkSaveStatus": "저장 상태 확인",
  "common.originalConversation": "원래 대화",
  "common.dismiss": "넘기기",
  "common.newEvent": "새 일정",
  "common.reviewSuggestion": "초안 검토",
  "common.saveAsEvent": "일정으로 저장",
  "common.saveDraftChanges": "초안 수정 저장",
  "common.editEventDetails": "일정 수정",
  "common.editExternalSaveDetails": "외부 저장 내용 수정",
  "common.saveChanges": "변경 저장",
  "editor.timezoneChanged": "시스템 시간대가 변경되어 입력 시각을 갱신했습니다. 내용을 확인한 뒤 다시 저장하세요.",
  "editor.invalidFields": "제목과 시작·종료 시간을 확인하세요.",
  "common.closeEditor": "작성 패널 닫기",
  "common.title": "제목",
  "common.start": "시작",
  "common.end": "종료",
  "common.description": "설명",
  "common.discardYourUnsavedChanges": "저장하지 않은 변경 내용을 버릴까요?",
  "common.keepEditing": "계속 작성",
  "common.discardAndClose": "버리고 닫기",
  "common.cancel": "취소",
  "common.saving": "저장 중…",
  "common.restore": "복원",
  "common.noDeletedEvents": "삭제한 일정이 없습니다.",
  "common.externalCalendar": "외부 캘린더",
  "common.closeSaveStatus": "저장 상태 닫기",
  "delivery.notSubmitted": "아직 외부 캘린더에 저장되지 않았습니다.",
  "delivery.reviewHint": "저장 준비가 완료되었습니다.",
  "common.checkingTheSaveResult": "저장 결과를 확인하고 있습니다.",
  "delivery.confirmed": "저장 확인됨 · 외부 캘린더에서 다시 조회했습니다.",
  "delivery.cancelled": "외부 저장을 취소했습니다.",
  "delivery.failed": "외부 캘린더에 저장하지 못했습니다.",
  "delivery.unknown": "저장 결과 확인 필요 · 중복 생성을 막기 위해 결과를 먼저 확인하세요.",
  "delivery.eventChanged": "원본 일정이 변경되었거나 조회할 수 없습니다.",
  "delivery.checking": "기존 저장 요청의 현재 상태를 확인하고 있습니다.",
  "common.editDetails": "내용 수정",
  "common.deleteRequest": "요청 삭제",
  "common.saveToThisCalendar": "이 캘린더에 저장",
  "common.continueExternalSave": "외부 저장 진행",
  "common.checkCurrentSaveStatus": "현재 저장 상태 확인",
  "common.verifySaveResult": "저장 결과 다시 확인",
  "common.thisTimeOccursTwice": "이 시각은 두 번 발생합니다.",
  "time.offsetLabel": "{field} UTC 오프셋",
  "common.chooseWhichOccurrence": "어느 시각인지 선택하세요",
  "errors.requestFailed": "요청을 완료하지 못했습니다. 다시 확인해 주세요.",
  "errors.invalidResponse": "서버 응답의 형식이 올바르지 않습니다. 새로고침 후 다시 시도하세요.",
  "common.draft": "초안",
  "calendar.statusPending": "저장 대기",
  "calendar.statusAwaiting": "확인 대기",
  "calendar.statusUnknown": "확인 필요",
  "calendar.statusUnavailable": "기록 확인 필요",
  "calendar.statusFailed": "저장 실패",
  "calendar.statusCancelled": "저장 취소",
  "common.crewSuggestion": "Crew 제안",
  "common.awaitingExternalSaveConfirmation": "외부 저장 확인 대기",
  "common.externalSaveNeedsVerification": "외부 저장 결과 확인 필요",
  "common.externalSaveRecordsNeedRecovery": "외부 저장 기록 복구 필요",
  "common.externalSaveFailed": "외부 저장 실패",
  "common.externalSaveCancelled": "외부 저장 취소됨",
  "common.externalSavePending": "외부 저장 대기",
  "suggestions.loadError": "설정을 확인하지 못했어요. 다시 시도해 주세요.",
  "suggestions.saveError": "변경 사항이 저장됐는지 확인하지 못했어요. 설정을 다시 확인한 뒤 시도해 주세요.",
  "common.eventSuggestionsInConversations": "대화 중 일정 제안",
  "suggestions.showExample": "대화 예시 보기",
  "suggestions.hideExample": "대화 예시 닫기",
  "suggestions.description": "대화에서 실행할 일이 생기면 시간을 잡아볼지 자연스럽게 제안해요.",
  "suggestions.reviewHint": "대화의 선택지로 답하고, 동의한 일정만 Crew Calendar에 등록해요.",
  "common.checking": "확인 중",
  "common.savingStatus": "저장 중",
  "suggestions.activationHint": "선택한 대화의 다음 메시지부터 적용해요. 추가 토큰이 사용될 수 있어요.",
  "common.refreshSettings": "설정 다시 확인",
  "suggestions.policyBlocked": "Crew 정책에서 연결 실행을 허용하지 않았어요.",
  "suggestions.setupRequired": "제안 기능을 처음 한 번 연결해야 해요.",
  "suggestions.scopeHint": "초기 버전은 선택한 일반 대화에서만 동작해요. 비공개·임시 대화와 서브에이전트는 제외합니다.",
  "common.closedConversation": "닫힌 대화",
  "common.remove": "제외",
  "common.conversationForSuggestions": "제안을 적용할 대화",
  "common.chooseAConversation": "대화 선택",
  "common.add": "추가",
  "common.connectSuggestions": "처음 한 번 연결하기",
  "suggestions.setupInstructions": "Crew의 에이전트 기능 → 훅에서 아래 명령을 UserPromptSubmit 이벤트로 등록해 주세요. 이름은 Crew Calendar · schedule suggestions, 조건은 비워두고 활성화합니다. 등록 후 설정 다시 확인을 누르세요.",
  "suggestions.exampleUser": "나 · “금요일 마감인데 지원서 아직 못 썼네. 목요일 저녁 7시부터 30분은 비어.”",
  "suggestions.exampleAssistant": "Crew · “목요일 19:00–19:30에 지원서 작성 시간을 Crew Calendar에 추가할까요?” — 이대로 등록 / 시간 바꾸기 / 지금은 괜찮아",
  "suggestions.registered": "연결은 등록됐어요. 실제 대화에서의 실행은 아직 확인하지 않았어요.",
  "suggestions.runTimeout": "최근 연결 실행이 시간 초과됐어요. Crew 훅 기록을 확인해 주세요.",
  "suggestions.runBlocked": "최근 연결 실행이 정책에 의해 차단됐어요. Crew 훅 기록을 확인해 주세요.",
  "suggestions.runFailed": "최근 연결 실행에 실패했어요. Crew 훅 기록을 확인해 주세요.",
  "suggestions.runUnknown": "연결은 등록됐지만 최근 실행 상태를 확인하지 못했어요.",
  "editor.timezoneHint": "표시·입력 시간대: {zone}. 단일 일정만 저장하며 반복·초대는 추가하지 않습니다. 이 앱은 알림을 보내지 않습니다.",
  "trash.count": "삭제한 일정 · {count}개",
  "suggestions.conversationCount": "적용 대화 {count}개",
  "time.occurrenceOffset": "{occurrence}번째 · UTC{offset}",
  "common.moreEvents": "+{count}개 더",
  "delivery.confirmInProvider": "캘린더 앱에서 확인",
  "delivery.confirmOnMac": "Mac에서 최종 확인",
  "delivery.providerPending": "캘린더 앱에서 일정을 확인하세요. 이 패널을 닫아도 확인 창은 취소되지 않습니다.",
  "connections.authorize": "캘린더 연결",
  "connections.permissionRequired": "일정 조회와 저장을 위해 캘린더 접근을 허용하세요.",
  "connections.permissionDenied": "캘린더 접근이 거부되었습니다. 시스템 개인정보 보호 설정을 확인하세요.",
  "connections.unsupported": "이 기기에서는 이 캘린더 연결을 지원하지 않습니다.",
  "connections.unavailable": "캘린더 연결 상태를 확인하지 못했습니다. 다시 시도하세요.",
  "errors.staleEvent": "다른 곳에서 변경된 일정입니다. 다시 불러온 뒤 수정하세요.",
  "errors.requestConflict": "같은 저장 요청의 내용이 달라졌습니다. 일정을 다시 불러오세요.",
  "errors.actionUnavailable": "계속하기 전에 현재 저장 상태를 확인하세요.",
  "errors.operationChanged": "이 저장 요청이 교체되었습니다. 현재 일정을 확인하세요.",
  "errors.storageUnavailable": "일정 데이터를 읽거나 저장하지 못했습니다. 다시 시도하세요.",
  "errors.deliveryUnavailable": "이 일정을 변경하려면 저장 기록을 복구해야 합니다.",
  "errors.readOnly": "이 캘린더는 읽기 전용입니다. 다른 캘린더를 선택하세요.",
  "errors.calendarMissing": "선택한 캘린더에 접근할 수 없습니다. 연결을 확인하세요.",
  "errors.connectionMissing": "원래 연결에 접근할 수 없습니다. 저장 위치를 직접 선택하세요.",
  "errors.connectionChanged": "연결이 변경되었습니다. 저장 요청을 다시 검토하세요.",
  "errors.helperMissing": "캘린더 연결 프로그램이 없습니다. Calendar 앱을 다시 설치하세요.",
  "errors.helperTimeout": "캘린더 연결 응답 시간이 초과됐습니다. 저장 상태를 확인하세요.",
  "errors.helperUnavailable": "캘린더 연결 프로그램에 접근하지 못했습니다. 연결을 확인하세요.",
  "errors.appDisabled": "Calendar가 비활성화되어 있습니다. 저장 전에 활성화하세요.",
  "errors.providerResponse": "캘린더 응답을 확인하지 못했습니다. 연결과 저장 상태를 확인하세요.",
  "errors.itemUnavailable": "이 일정을 읽지 못했습니다. 저장된 원본은 보존되어 있습니다.",
  "errors.recordUnavailable": "일정 {id}을 읽지 못했습니다. 저장된 원본은 보존되어 있습니다.",
  "errors.ownerRequired": "계속하려면 소유자 대시보드에서 Calendar를 여세요.",
  "connections.appleLocal": "Apple Calendar · 이 Mac",
  "errors.eventsTruncated": {
    one: "일정 {count}개까지만 표시됩니다. 전체 일정을 보려면 조회 기간을 줄이세요.",
    other: "일정 {count}개까지만 표시됩니다. 전체 일정을 보려면 조회 기간을 줄이세요."
  },
  "errors.eventsIncomplete": "일부 일정이 표시되지 않았습니다. 조회 기간을 줄이고 다시 확인하세요.",
  "destination.unavailable": "캘린더 확인 필요",
  "delivery.statusLabel": "저장 상태",
  "common.source": "출처",
  "navigation.label": "캘린더 작업 공간",
  "navigation.proposals": "보관한 초안",
  "navigation.activity": "기록",
  "common.viewDay": "일간",
  "common.thisDay": "이 날",
  "calendar.chooseDate": "날짜 선택",
  "calendar.goToDate": "이동",
  "calendar.openDay": "{date} 일간 보기",
  "calendar.addOnDate": "{date}에 일정 추가"
};
function v(t, ...e) {
  const n = e[0] ?? {}, r = (wt() === "ko" ? Dl : yl)[t];
  return (typeof r == "string" ? r : r[xl(Number(n.count)) === "one" ? "one" : "other"]).replace(
    /\{([a-zA-Z][a-zA-Z0-9]*)\}/g,
    (i, a) => a === "count" && typeof n[a] == "number" ? bl(n[a]) : String(n[a])
  );
}
function Ia(t) {
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
function un(t) {
  return t.allDay ? v("common.allDay") : t.timeLabels ? `${t.timeLabels.start}–${t.timeLabels.end}` : `${Ia(t.start)}–${t.end == null ? v("common.now") : Ia(t.end)}`;
}
function mi(t) {
  switch (t) {
    case "awaiting_confirmation":
      return v("common.awaitingExternalSaveConfirmation");
    case "unknown":
      return v("common.externalSaveNeedsVerification");
    case "unavailable":
      return v("common.externalSaveRecordsNeedRecovery");
    case "failed":
      return v("common.externalSaveFailed");
    case "cancelled":
      return v("common.externalSaveCancelled");
    case "prepared":
    case "unsubmitted":
      return v("common.externalSavePending");
    default:
      return "";
  }
}
function vo(t) {
  return t.calendarLocation || t.source;
}
function Lr(t) {
  if (t.storage === "draft") return v("common.draft");
  switch (t.deliveryState) {
    case "prepared":
    case "unsubmitted":
      return v("calendar.statusPending");
    case "awaiting_confirmation":
      return v("calendar.statusAwaiting");
    case "unknown":
      return v("calendar.statusUnknown");
    case "unavailable":
      return v("calendar.statusUnavailable");
    case "failed":
      return v("calendar.statusFailed");
    case "cancelled":
      return v("calendar.statusCancelled");
    default:
      return "";
  }
}
const El = Ta.default ?? Ta, {
  AlertCircle: La,
  ArrowUpRight: kl,
  CalendarDays: So,
  ChevronDown: Ms,
  ChevronLeft: Tl,
  ChevronRight: Ns,
  Clock3: _l,
  Plus: Rs,
  RotateCcw: Ml,
  Search: Nl,
  Settings2: Rl,
  SlidersHorizontal: Ol,
  X: $l
} = El;
function wo({
  eventId: t,
  registerButton: e,
  selected: n,
  className: r,
  ...o
}) {
  const i = _t(
    (a) => e(t, a),
    [t, e]
  );
  return /* @__PURE__ */ p(
    "button",
    {
      ...o,
      ref: i,
      type: "button",
      className: `cc-event-button ${r}`,
      "aria-pressed": n
    }
  );
}
function Sr(t) {
  return {
    "--cc-calendar-color": t ?? "var(--accent)"
  };
}
class u extends Array {
  constructor(e, n) {
    if (super(e), this.sign = n, Object.setPrototypeOf(this, u.prototype), e > u.__kMaxLength) throw new RangeError("Maximum BigInt size exceeded");
  }
  static BigInt(e) {
    var n = Math.floor, r = Number.isFinite;
    if (typeof e == "number") {
      if (e === 0) return u.__zero();
      if (u.__isOneDigitInt(e)) return 0 > e ? u.__oneDigit(-e, !0) : u.__oneDigit(e, !1);
      if (!r(e) || n(e) !== e) throw new RangeError("The number " + e + " cannot be converted to BigInt because it is not an integer");
      return u.__fromDouble(e);
    }
    if (typeof e == "string") {
      const o = u.__fromString(e);
      if (o === null) throw new SyntaxError("Cannot convert " + e + " to a BigInt");
      return o;
    }
    if (typeof e == "boolean") return e === !0 ? u.__oneDigit(1, !1) : u.__zero();
    if (typeof e == "object") {
      if (e.constructor === u) return e;
      const o = u.__toPrimitive(e);
      return u.BigInt(o);
    }
    throw new TypeError("Cannot convert " + e + " to a BigInt");
  }
  toDebugString() {
    const e = ["BigInt["];
    for (const n of this) e.push((n && (n >>> 0).toString(16)) + ", ");
    return e.push("]"), e.join("");
  }
  toString(e = 10) {
    if (2 > e || 36 < e) throw new RangeError("toString() radix argument must be between 2 and 36");
    return this.length === 0 ? "0" : (e & e - 1) == 0 ? u.__toStringBasePowerOfTwo(this, e) : u.__toStringGeneric(this, e, !1);
  }
  valueOf() {
    throw new Error("Convert JSBI instances to native numbers using `toNumber`.");
  }
  static toNumber(e) {
    const n = e.length;
    if (n === 0) return 0;
    if (n === 1) {
      const w = e.__unsignedDigit(0);
      return e.sign ? -w : w;
    }
    const r = e.__digit(n - 1), o = u.__clz30(r), i = 30 * n - o;
    if (1024 < i) return e.sign ? -1 / 0 : 1 / 0;
    let a = i - 1, s = r, c = n - 1;
    const l = o + 3;
    let d = l === 32 ? 0 : s << l;
    d >>>= 12;
    const h = l - 12;
    let f = 12 <= l ? 0 : s << 20 + l, g = 20 + l;
    for (0 < h && 0 < c && (c--, s = e.__digit(c), d |= s >>> 30 - h, f = s << h + 2, g = h + 2); 0 < g && 0 < c; ) c--, s = e.__digit(c), f |= 30 <= g ? s << g - 30 : s >>> 30 - g, g -= 30;
    const y = u.__decideRounding(e, g, c, s);
    if ((y === 1 || y === 0 && (1 & f) == 1) && (f = f + 1 >>> 0, f === 0 && (d++, d >>> 20 != 0 && (d = 0, a++, 1023 < a)))) return e.sign ? -1 / 0 : 1 / 0;
    const b = e.sign ? -2147483648 : 0;
    return a = a + 1023 << 20, u.__kBitConversionInts[u.__kBitConversionIntHigh] = b | a | d, u.__kBitConversionInts[u.__kBitConversionIntLow] = f, u.__kBitConversionDouble[0];
  }
  static unaryMinus(e) {
    if (e.length === 0) return e;
    const n = e.__copy();
    return n.sign = !e.sign, n;
  }
  static bitwiseNot(e) {
    return e.sign ? u.__absoluteSubOne(e).__trim() : u.__absoluteAddOne(e, !0);
  }
  static exponentiate(e, n) {
    if (n.sign) throw new RangeError("Exponent must be positive");
    if (n.length === 0) return u.__oneDigit(1, !1);
    if (e.length === 0) return e;
    if (e.length === 1 && e.__digit(0) === 1) return e.sign && (1 & n.__digit(0)) == 0 ? u.unaryMinus(e) : e;
    if (1 < n.length) throw new RangeError("BigInt too big");
    let r = n.__unsignedDigit(0);
    if (r === 1) return e;
    if (r >= u.__kMaxLengthBits) throw new RangeError("BigInt too big");
    if (e.length === 1 && e.__digit(0) === 2) {
      const a = 1 + (0 | r / 30), s = e.sign && (1 & r) != 0, c = new u(a, s);
      c.__initializeDigits();
      const l = 1 << r % 30;
      return c.__setDigit(a - 1, l), c;
    }
    let o = null, i = e;
    for ((1 & r) != 0 && (o = e), r >>= 1; r !== 0; r >>= 1) i = u.multiply(i, i), (1 & r) != 0 && (o === null ? o = i : o = u.multiply(o, i));
    return o;
  }
  static multiply(e, n) {
    if (e.length === 0) return e;
    if (n.length === 0) return n;
    let r = e.length + n.length;
    30 <= e.__clzmsd() + n.__clzmsd() && r--;
    const o = new u(r, e.sign !== n.sign);
    o.__initializeDigits();
    for (let i = 0; i < e.length; i++) u.__multiplyAccumulate(n, e.__digit(i), o, i);
    return o.__trim();
  }
  static divide(e, n) {
    if (n.length === 0) throw new RangeError("Division by zero");
    if (0 > u.__absoluteCompare(e, n)) return u.__zero();
    const r = e.sign !== n.sign, o = n.__unsignedDigit(0);
    let i;
    if (n.length === 1 && 32767 >= o) {
      if (o === 1) return r === e.sign ? e : u.unaryMinus(e);
      i = u.__absoluteDivSmall(e, o, null);
    } else i = u.__absoluteDivLarge(e, n, !0, !1);
    return i.sign = r, i.__trim();
  }
  static remainder(e, n) {
    if (n.length === 0) throw new RangeError("Division by zero");
    if (0 > u.__absoluteCompare(e, n)) return e;
    const r = n.__unsignedDigit(0);
    if (n.length === 1 && 32767 >= r) {
      if (r === 1) return u.__zero();
      const i = u.__absoluteModSmall(e, r);
      return i === 0 ? u.__zero() : u.__oneDigit(i, e.sign);
    }
    const o = u.__absoluteDivLarge(e, n, !1, !0);
    return o.sign = e.sign, o.__trim();
  }
  static add(e, n) {
    const r = e.sign;
    return r === n.sign ? u.__absoluteAdd(e, n, r) : 0 <= u.__absoluteCompare(e, n) ? u.__absoluteSub(e, n, r) : u.__absoluteSub(n, e, !r);
  }
  static subtract(e, n) {
    const r = e.sign;
    return r === n.sign ? 0 <= u.__absoluteCompare(e, n) ? u.__absoluteSub(e, n, r) : u.__absoluteSub(n, e, !r) : u.__absoluteAdd(e, n, r);
  }
  static leftShift(e, n) {
    return n.length === 0 || e.length === 0 ? e : n.sign ? u.__rightShiftByAbsolute(e, n) : u.__leftShiftByAbsolute(e, n);
  }
  static signedRightShift(e, n) {
    return n.length === 0 || e.length === 0 ? e : n.sign ? u.__leftShiftByAbsolute(e, n) : u.__rightShiftByAbsolute(e, n);
  }
  static unsignedRightShift() {
    throw new TypeError("BigInts have no unsigned right shift; use >> instead");
  }
  static lessThan(e, n) {
    return 0 > u.__compareToBigInt(e, n);
  }
  static lessThanOrEqual(e, n) {
    return 0 >= u.__compareToBigInt(e, n);
  }
  static greaterThan(e, n) {
    return 0 < u.__compareToBigInt(e, n);
  }
  static greaterThanOrEqual(e, n) {
    return 0 <= u.__compareToBigInt(e, n);
  }
  static equal(e, n) {
    if (e.sign !== n.sign || e.length !== n.length) return !1;
    for (let r = 0; r < e.length; r++) if (e.__digit(r) !== n.__digit(r)) return !1;
    return !0;
  }
  static notEqual(e, n) {
    return !u.equal(e, n);
  }
  static bitwiseAnd(e, n) {
    var r = Math.max;
    if (!e.sign && !n.sign) return u.__absoluteAnd(e, n).__trim();
    if (e.sign && n.sign) {
      const o = r(e.length, n.length) + 1;
      let i = u.__absoluteSubOne(e, o);
      const a = u.__absoluteSubOne(n);
      return i = u.__absoluteOr(i, a, i), u.__absoluteAddOne(i, !0, i).__trim();
    }
    return e.sign && ([e, n] = [n, e]), u.__absoluteAndNot(e, u.__absoluteSubOne(n)).__trim();
  }
  static bitwiseXor(e, n) {
    var r = Math.max;
    if (!e.sign && !n.sign) return u.__absoluteXor(e, n).__trim();
    if (e.sign && n.sign) {
      const a = r(e.length, n.length), s = u.__absoluteSubOne(e, a), c = u.__absoluteSubOne(n);
      return u.__absoluteXor(s, c, s).__trim();
    }
    const o = r(e.length, n.length) + 1;
    e.sign && ([e, n] = [n, e]);
    let i = u.__absoluteSubOne(n, o);
    return i = u.__absoluteXor(i, e, i), u.__absoluteAddOne(i, !0, i).__trim();
  }
  static bitwiseOr(e, n) {
    var r = Math.max;
    const o = r(e.length, n.length);
    if (!e.sign && !n.sign) return u.__absoluteOr(e, n).__trim();
    if (e.sign && n.sign) {
      let a = u.__absoluteSubOne(e, o);
      const s = u.__absoluteSubOne(n);
      return a = u.__absoluteAnd(a, s, a), u.__absoluteAddOne(a, !0, a).__trim();
    }
    e.sign && ([e, n] = [n, e]);
    let i = u.__absoluteSubOne(n, o);
    return i = u.__absoluteAndNot(i, e, i), u.__absoluteAddOne(i, !0, i).__trim();
  }
  static asIntN(e, n) {
    var r = Math.floor;
    if (n.length === 0) return n;
    if (e = r(e), 0 > e) throw new RangeError("Invalid value: not (convertible to) a safe integer");
    if (e === 0) return u.__zero();
    if (e >= u.__kMaxLengthBits) return n;
    const o = 0 | (e + 29) / 30;
    if (n.length < o) return n;
    const i = n.__unsignedDigit(o - 1), a = 1 << (e - 1) % 30;
    if (n.length === o && i < a) return n;
    if ((i & a) !== a) return u.__truncateToNBits(e, n);
    if (!n.sign) return u.__truncateAndSubFromPowerOfTwo(e, n, !0);
    if ((i & a - 1) == 0) {
      for (let s = o - 2; 0 <= s; s--) if (n.__digit(s) !== 0) return u.__truncateAndSubFromPowerOfTwo(e, n, !1);
      return n.length === o && i === a ? n : u.__truncateToNBits(e, n);
    }
    return u.__truncateAndSubFromPowerOfTwo(e, n, !1);
  }
  static asUintN(e, n) {
    var r = Math.floor;
    if (n.length === 0) return n;
    if (e = r(e), 0 > e) throw new RangeError("Invalid value: not (convertible to) a safe integer");
    if (e === 0) return u.__zero();
    if (n.sign) {
      if (e > u.__kMaxLengthBits) throw new RangeError("BigInt too big");
      return u.__truncateAndSubFromPowerOfTwo(e, n, !1);
    }
    if (e >= u.__kMaxLengthBits) return n;
    const o = 0 | (e + 29) / 30;
    if (n.length < o) return n;
    const i = e % 30;
    return n.length == o && (i === 0 || !(n.__digit(o - 1) >>> i)) ? n : u.__truncateToNBits(e, n);
  }
  static ADD(e, n) {
    if (e = u.__toPrimitive(e), n = u.__toPrimitive(n), typeof e == "string") return typeof n != "string" && (n = n.toString()), e + n;
    if (typeof n == "string") return e.toString() + n;
    if (e = u.__toNumeric(e), n = u.__toNumeric(n), u.__isBigInt(e) && u.__isBigInt(n)) return u.add(e, n);
    if (typeof e == "number" && typeof n == "number") return e + n;
    throw new TypeError("Cannot mix BigInt and other types, use explicit conversions");
  }
  static LT(e, n) {
    return u.__compare(e, n, 0);
  }
  static LE(e, n) {
    return u.__compare(e, n, 1);
  }
  static GT(e, n) {
    return u.__compare(e, n, 2);
  }
  static GE(e, n) {
    return u.__compare(e, n, 3);
  }
  static EQ(e, n) {
    for (; ; ) {
      if (u.__isBigInt(e)) return u.__isBigInt(n) ? u.equal(e, n) : u.EQ(n, e);
      if (typeof e == "number") {
        if (u.__isBigInt(n)) return u.__equalToNumber(n, e);
        if (typeof n != "object") return e == n;
        n = u.__toPrimitive(n);
      } else if (typeof e == "string") {
        if (u.__isBigInt(n)) return e = u.__fromString(e), e !== null && u.equal(e, n);
        if (typeof n != "object") return e == n;
        n = u.__toPrimitive(n);
      } else if (typeof e == "boolean") {
        if (u.__isBigInt(n)) return u.__equalToNumber(n, +e);
        if (typeof n != "object") return e == n;
        n = u.__toPrimitive(n);
      } else if (typeof e == "symbol") {
        if (u.__isBigInt(n)) return !1;
        if (typeof n != "object") return e == n;
        n = u.__toPrimitive(n);
      } else if (typeof e == "object") {
        if (typeof n == "object" && n.constructor !== u) return e == n;
        e = u.__toPrimitive(e);
      } else return e == n;
    }
  }
  static NE(e, n) {
    return !u.EQ(e, n);
  }
  static DataViewGetBigInt64(e, n, r = !1) {
    return u.asIntN(64, u.DataViewGetBigUint64(e, n, r));
  }
  static DataViewGetBigUint64(e, n, r = !1) {
    const [o, i] = r ? [4, 0] : [0, 4], a = e.getUint32(n + o, r), s = e.getUint32(n + i, r), c = new u(3, !1);
    return c.__setDigit(0, 1073741823 & s), c.__setDigit(1, (268435455 & a) << 2 | s >>> 30), c.__setDigit(2, a >>> 28), c.__trim();
  }
  static DataViewSetBigInt64(e, n, r, o = !1) {
    u.DataViewSetBigUint64(e, n, r, o);
  }
  static DataViewSetBigUint64(e, n, r, o = !1) {
    r = u.asUintN(64, r);
    let i = 0, a = 0;
    if (0 < r.length && (a = r.__digit(0), 1 < r.length)) {
      const l = r.__digit(1);
      a |= l << 30, i = l >>> 2, 2 < r.length && (i |= r.__digit(2) << 28);
    }
    const [s, c] = o ? [4, 0] : [0, 4];
    e.setUint32(n + s, i, o), e.setUint32(n + c, a, o);
  }
  static __zero() {
    return new u(0, !1);
  }
  static __oneDigit(e, n) {
    const r = new u(1, n);
    return r.__setDigit(0, e), r;
  }
  __copy() {
    const e = new u(this.length, this.sign);
    for (let n = 0; n < this.length; n++) e[n] = this[n];
    return e;
  }
  __trim() {
    let e = this.length, n = this[e - 1];
    for (; n === 0; ) e--, n = this[e - 1], this.pop();
    return e === 0 && (this.sign = !1), this;
  }
  __initializeDigits() {
    for (let e = 0; e < this.length; e++) this[e] = 0;
  }
  static __decideRounding(e, n, r, o) {
    if (0 < n) return -1;
    let i;
    if (0 > n) i = -n - 1;
    else {
      if (r === 0) return -1;
      r--, o = e.__digit(r), i = 29;
    }
    let a = 1 << i;
    if ((o & a) == 0) return -1;
    if (a -= 1, (o & a) != 0) return 1;
    for (; 0 < r; ) if (r--, e.__digit(r) !== 0) return 1;
    return 0;
  }
  static __fromDouble(e) {
    u.__kBitConversionDouble[0] = e;
    const n = 2047 & u.__kBitConversionInts[u.__kBitConversionIntHigh] >>> 20, r = n - 1023, o = (0 | r / 30) + 1, i = new u(o, 0 > e);
    let a = 1048575 & u.__kBitConversionInts[u.__kBitConversionIntHigh] | 1048576, s = u.__kBitConversionInts[u.__kBitConversionIntLow];
    const c = 20, l = r % 30;
    let d, h = 0;
    if (l < 20) {
      const f = c - l;
      h = f + 32, d = a >>> f, a = a << 32 - f | s >>> f, s <<= 32 - f;
    } else if (l === 20) h = 32, d = a, a = s, s = 0;
    else {
      const f = l - c;
      h = 32 - f, d = a << f | s >>> 32 - f, a = s << f, s = 0;
    }
    i.__setDigit(o - 1, d);
    for (let f = o - 2; 0 <= f; f--) 0 < h ? (h -= 30, d = a >>> 2, a = a << 30 | s >>> 2, s <<= 30) : d = 0, i.__setDigit(f, d);
    return i.__trim();
  }
  static __isWhitespace(e) {
    return 13 >= e && 9 <= e || (159 >= e ? e == 32 : 131071 >= e ? e == 160 || e == 5760 : 196607 >= e ? (e &= 131071, 10 >= e || e == 40 || e == 41 || e == 47 || e == 95 || e == 4096) : e == 65279);
  }
  static __fromString(e, n = 0) {
    let r = 0;
    const o = e.length;
    let i = 0;
    if (i === o) return u.__zero();
    let a = e.charCodeAt(i);
    for (; u.__isWhitespace(a); ) {
      if (++i === o) return u.__zero();
      a = e.charCodeAt(i);
    }
    if (a === 43) {
      if (++i === o) return null;
      a = e.charCodeAt(i), r = 1;
    } else if (a === 45) {
      if (++i === o) return null;
      a = e.charCodeAt(i), r = -1;
    }
    if (n === 0) {
      if (n = 10, a === 48) {
        if (++i === o) return u.__zero();
        if (a = e.charCodeAt(i), a === 88 || a === 120) {
          if (n = 16, ++i === o) return null;
          a = e.charCodeAt(i);
        } else if (a === 79 || a === 111) {
          if (n = 8, ++i === o) return null;
          a = e.charCodeAt(i);
        } else if (a === 66 || a === 98) {
          if (n = 2, ++i === o) return null;
          a = e.charCodeAt(i);
        }
      }
    } else if (n === 16 && a === 48) {
      if (++i === o) return u.__zero();
      if (a = e.charCodeAt(i), a === 88 || a === 120) {
        if (++i === o) return null;
        a = e.charCodeAt(i);
      }
    }
    if (r != 0 && n !== 10) return null;
    for (; a === 48; ) {
      if (++i === o) return u.__zero();
      a = e.charCodeAt(i);
    }
    const s = o - i;
    let c = u.__kMaxBitsPerChar[n], l = u.__kBitsPerCharTableMultiplier - 1;
    if (s > 1073741824 / c) return null;
    const d = c * s + l >>> u.__kBitsPerCharTableShift, h = new u(0 | (d + 29) / 30, !1), f = 10 > n ? n : 10, g = 10 < n ? n - 10 : 0;
    if ((n & n - 1) == 0) {
      c >>= u.__kBitsPerCharTableShift;
      const y = [], b = [];
      let w = !1;
      do {
        let x = 0, D = 0;
        for (; ; ) {
          let E;
          if (a - 48 >>> 0 < f) E = a - 48;
          else if ((32 | a) - 97 >>> 0 < g) E = (32 | a) - 87;
          else {
            w = !0;
            break;
          }
          if (D += c, x = x << c | E, ++i === o) {
            w = !0;
            break;
          }
          if (a = e.charCodeAt(i), 30 < D + c) break;
        }
        y.push(x), b.push(D);
      } while (!w);
      u.__fillFromParts(h, y, b);
    } else {
      h.__initializeDigits();
      let y = !1, b = 0;
      do {
        let w = 0, x = 1;
        for (; ; ) {
          let E;
          if (a - 48 >>> 0 < f) E = a - 48;
          else if ((32 | a) - 97 >>> 0 < g) E = (32 | a) - 87;
          else {
            y = !0;
            break;
          }
          const _ = x * n;
          if (1073741823 < _) break;
          if (x = _, w = w * n + E, b++, ++i === o) {
            y = !0;
            break;
          }
          a = e.charCodeAt(i);
        }
        l = 30 * u.__kBitsPerCharTableMultiplier - 1;
        const D = 0 | (c * b + l >>> u.__kBitsPerCharTableShift) / 30;
        h.__inplaceMultiplyAdd(x, w, D);
      } while (!y);
    }
    if (i !== o) {
      if (!u.__isWhitespace(a)) return null;
      for (i++; i < o; i++) if (a = e.charCodeAt(i), !u.__isWhitespace(a)) return null;
    }
    return h.sign = r == -1, h.__trim();
  }
  static __fillFromParts(e, n, r) {
    let o = 0, i = 0, a = 0;
    for (let s = n.length - 1; 0 <= s; s--) {
      const c = n[s], l = r[s];
      i |= c << a, a += l, a === 30 ? (e.__setDigit(o++, i), a = 0, i = 0) : 30 < a && (e.__setDigit(o++, 1073741823 & i), a -= 30, i = c >>> l - a);
    }
    if (i !== 0) {
      if (o >= e.length) throw new Error("implementation bug");
      e.__setDigit(o++, i);
    }
    for (; o < e.length; o++) e.__setDigit(o, 0);
  }
  static __toStringBasePowerOfTwo(e, n) {
    const r = e.length;
    let o = n - 1;
    o = (85 & o >>> 1) + (85 & o), o = (51 & o >>> 2) + (51 & o), o = (15 & o >>> 4) + (15 & o);
    const i = o, a = n - 1, s = e.__digit(r - 1), c = u.__clz30(s);
    let l = 0 | (30 * r - c + i - 1) / i;
    if (e.sign && l++, 268435456 < l) throw new Error("string too long");
    const d = Array(l);
    let h = l - 1, f = 0, g = 0;
    for (let b = 0; b < r - 1; b++) {
      const w = e.__digit(b), x = (f | w << g) & a;
      d[h--] = u.__kConversionChars[x];
      const D = i - g;
      for (f = w >>> D, g = 30 - D; g >= i; ) d[h--] = u.__kConversionChars[f & a], f >>>= i, g -= i;
    }
    const y = (f | s << g) & a;
    for (d[h--] = u.__kConversionChars[y], f = s >>> i - g; f !== 0; ) d[h--] = u.__kConversionChars[f & a], f >>>= i;
    if (e.sign && (d[h--] = "-"), h != -1) throw new Error("implementation bug");
    return d.join("");
  }
  static __toStringGeneric(e, n, r) {
    const o = e.length;
    if (o === 0) return "";
    if (o === 1) {
      let b = e.__unsignedDigit(0).toString(n);
      return r === !1 && e.sign && (b = "-" + b), b;
    }
    const i = 30 * o - u.__clz30(e.__digit(o - 1)), a = u.__kMaxBitsPerChar[n], s = a - 1;
    let c = i * u.__kBitsPerCharTableMultiplier;
    c += s - 1, c = 0 | c / s;
    const l = c + 1 >> 1, d = u.exponentiate(u.__oneDigit(n, !1), u.__oneDigit(l, !1));
    let h, f;
    const g = d.__unsignedDigit(0);
    if (d.length === 1 && 32767 >= g) {
      h = new u(e.length, !1), h.__initializeDigits();
      let b = 0;
      for (let w = 2 * e.length - 1; 0 <= w; w--) {
        const x = b << 15 | e.__halfDigit(w);
        h.__setHalfDigit(w, 0 | x / g), b = 0 | x % g;
      }
      f = b.toString(n);
    } else {
      const b = u.__absoluteDivLarge(e, d, !0, !0);
      h = b.quotient;
      const w = b.remainder.__trim();
      f = u.__toStringGeneric(w, n, !0);
    }
    h.__trim();
    let y = u.__toStringGeneric(h, n, !0);
    for (; f.length < l; ) f = "0" + f;
    return r === !1 && e.sign && (y = "-" + y), y + f;
  }
  static __unequalSign(e) {
    return e ? -1 : 1;
  }
  static __absoluteGreater(e) {
    return e ? -1 : 1;
  }
  static __absoluteLess(e) {
    return e ? 1 : -1;
  }
  static __compareToBigInt(e, n) {
    const r = e.sign;
    if (r !== n.sign) return u.__unequalSign(r);
    const o = u.__absoluteCompare(e, n);
    return 0 < o ? u.__absoluteGreater(r) : 0 > o ? u.__absoluteLess(r) : 0;
  }
  static __compareToNumber(e, n) {
    if (u.__isOneDigitInt(n)) {
      const r = e.sign, o = 0 > n;
      if (r !== o) return u.__unequalSign(r);
      if (e.length === 0) {
        if (o) throw new Error("implementation bug");
        return n === 0 ? 0 : -1;
      }
      if (1 < e.length) return u.__absoluteGreater(r);
      const i = Math.abs(n), a = e.__unsignedDigit(0);
      return a > i ? u.__absoluteGreater(r) : a < i ? u.__absoluteLess(r) : 0;
    }
    return u.__compareToDouble(e, n);
  }
  static __compareToDouble(e, n) {
    if (n !== n) return n;
    if (n === 1 / 0) return -1;
    if (n === -1 / 0) return 1;
    const r = e.sign;
    if (r !== 0 > n) return u.__unequalSign(r);
    if (n === 0) throw new Error("implementation bug: should be handled elsewhere");
    if (e.length === 0) return -1;
    u.__kBitConversionDouble[0] = n;
    const o = 2047 & u.__kBitConversionInts[u.__kBitConversionIntHigh] >>> 20;
    if (o == 2047) throw new Error("implementation bug: handled elsewhere");
    const i = o - 1023;
    if (0 > i) return u.__absoluteGreater(r);
    const a = e.length;
    let s = e.__digit(a - 1);
    const c = u.__clz30(s), l = 30 * a - c, d = i + 1;
    if (l < d) return u.__absoluteLess(r);
    if (l > d) return u.__absoluteGreater(r);
    let h = 1048576 | 1048575 & u.__kBitConversionInts[u.__kBitConversionIntHigh], f = u.__kBitConversionInts[u.__kBitConversionIntLow];
    const g = 20, y = 29 - c;
    if (y !== (0 | (l - 1) % 30)) throw new Error("implementation bug");
    let b, w = 0;
    if (20 > y) {
      const x = g - y;
      w = x + 32, b = h >>> x, h = h << 32 - x | f >>> x, f <<= 32 - x;
    } else if (y === 20) w = 32, b = h, h = f, f = 0;
    else {
      const x = y - g;
      w = 32 - x, b = h << x | f >>> 32 - x, h = f << x, f = 0;
    }
    if (s >>>= 0, b >>>= 0, s > b) return u.__absoluteGreater(r);
    if (s < b) return u.__absoluteLess(r);
    for (let x = a - 2; 0 <= x; x--) {
      0 < w ? (w -= 30, b = h >>> 2, h = h << 30 | f >>> 2, f <<= 30) : b = 0;
      const D = e.__unsignedDigit(x);
      if (D > b) return u.__absoluteGreater(r);
      if (D < b) return u.__absoluteLess(r);
    }
    if (h !== 0 || f !== 0) {
      if (w === 0) throw new Error("implementation bug");
      return u.__absoluteLess(r);
    }
    return 0;
  }
  static __equalToNumber(e, n) {
    var r = Math.abs;
    return u.__isOneDigitInt(n) ? n === 0 ? e.length === 0 : e.length === 1 && e.sign === 0 > n && e.__unsignedDigit(0) === r(n) : u.__compareToDouble(e, n) === 0;
  }
  static __comparisonResultToBool(e, n) {
    return n === 0 ? 0 > e : n === 1 ? 0 >= e : n === 2 ? 0 < e : n === 3 ? 0 <= e : void 0;
  }
  static __compare(e, n, r) {
    if (e = u.__toPrimitive(e), n = u.__toPrimitive(n), typeof e == "string" && typeof n == "string") switch (r) {
      case 0:
        return e < n;
      case 1:
        return e <= n;
      case 2:
        return e > n;
      case 3:
        return e >= n;
    }
    if (u.__isBigInt(e) && typeof n == "string") return n = u.__fromString(n), n !== null && u.__comparisonResultToBool(u.__compareToBigInt(e, n), r);
    if (typeof e == "string" && u.__isBigInt(n)) return e = u.__fromString(e), e !== null && u.__comparisonResultToBool(u.__compareToBigInt(e, n), r);
    if (e = u.__toNumeric(e), n = u.__toNumeric(n), u.__isBigInt(e)) {
      if (u.__isBigInt(n)) return u.__comparisonResultToBool(u.__compareToBigInt(e, n), r);
      if (typeof n != "number") throw new Error("implementation bug");
      return u.__comparisonResultToBool(u.__compareToNumber(e, n), r);
    }
    if (typeof e != "number") throw new Error("implementation bug");
    if (u.__isBigInt(n)) return u.__comparisonResultToBool(u.__compareToNumber(n, e), 2 ^ r);
    if (typeof n != "number") throw new Error("implementation bug");
    return r === 0 ? e < n : r === 1 ? e <= n : r === 2 ? e > n : r === 3 ? e >= n : void 0;
  }
  __clzmsd() {
    return u.__clz30(this.__digit(this.length - 1));
  }
  static __absoluteAdd(e, n, r) {
    if (e.length < n.length) return u.__absoluteAdd(n, e, r);
    if (e.length === 0) return e;
    if (n.length === 0) return e.sign === r ? e : u.unaryMinus(e);
    let o = e.length;
    (e.__clzmsd() === 0 || n.length === e.length && n.__clzmsd() === 0) && o++;
    const i = new u(o, r);
    let a = 0, s = 0;
    for (; s < n.length; s++) {
      const c = e.__digit(s) + n.__digit(s) + a;
      a = c >>> 30, i.__setDigit(s, 1073741823 & c);
    }
    for (; s < e.length; s++) {
      const c = e.__digit(s) + a;
      a = c >>> 30, i.__setDigit(s, 1073741823 & c);
    }
    return s < i.length && i.__setDigit(s, a), i.__trim();
  }
  static __absoluteSub(e, n, r) {
    if (e.length === 0) return e;
    if (n.length === 0) return e.sign === r ? e : u.unaryMinus(e);
    const o = new u(e.length, r);
    let i = 0, a = 0;
    for (; a < n.length; a++) {
      const s = e.__digit(a) - n.__digit(a) - i;
      i = 1 & s >>> 30, o.__setDigit(a, 1073741823 & s);
    }
    for (; a < e.length; a++) {
      const s = e.__digit(a) - i;
      i = 1 & s >>> 30, o.__setDigit(a, 1073741823 & s);
    }
    return o.__trim();
  }
  static __absoluteAddOne(e, n, r = null) {
    const o = e.length;
    r === null ? r = new u(o, n) : r.sign = n;
    let i = 1;
    for (let a = 0; a < o; a++) {
      const s = e.__digit(a) + i;
      i = s >>> 30, r.__setDigit(a, 1073741823 & s);
    }
    return i != 0 && r.__setDigitGrow(o, 1), r;
  }
  static __absoluteSubOne(e, n) {
    const r = e.length;
    n = n || r;
    const o = new u(n, !1);
    let i = 1;
    for (let a = 0; a < r; a++) {
      const s = e.__digit(a) - i;
      i = 1 & s >>> 30, o.__setDigit(a, 1073741823 & s);
    }
    if (i != 0) throw new Error("implementation bug");
    for (let a = r; a < n; a++) o.__setDigit(a, 0);
    return o;
  }
  static __absoluteAnd(e, n, r = null) {
    let o = e.length, i = n.length, a = i;
    if (o < i) {
      a = o;
      const l = e, d = o;
      e = n, o = i, n = l, i = d;
    }
    let s = a;
    r === null ? r = new u(s, !1) : s = r.length;
    let c = 0;
    for (; c < a; c++) r.__setDigit(c, e.__digit(c) & n.__digit(c));
    for (; c < s; c++) r.__setDigit(c, 0);
    return r;
  }
  static __absoluteAndNot(e, n, r = null) {
    const o = e.length, i = n.length;
    let a = i;
    o < i && (a = o);
    let s = o;
    r === null ? r = new u(s, !1) : s = r.length;
    let c = 0;
    for (; c < a; c++) r.__setDigit(c, e.__digit(c) & ~n.__digit(c));
    for (; c < o; c++) r.__setDigit(c, e.__digit(c));
    for (; c < s; c++) r.__setDigit(c, 0);
    return r;
  }
  static __absoluteOr(e, n, r = null) {
    let o = e.length, i = n.length, a = i;
    if (o < i) {
      a = o;
      const l = e, d = o;
      e = n, o = i, n = l, i = d;
    }
    let s = o;
    r === null ? r = new u(s, !1) : s = r.length;
    let c = 0;
    for (; c < a; c++) r.__setDigit(c, e.__digit(c) | n.__digit(c));
    for (; c < o; c++) r.__setDigit(c, e.__digit(c));
    for (; c < s; c++) r.__setDigit(c, 0);
    return r;
  }
  static __absoluteXor(e, n, r = null) {
    let o = e.length, i = n.length, a = i;
    if (o < i) {
      a = o;
      const l = e, d = o;
      e = n, o = i, n = l, i = d;
    }
    let s = o;
    r === null ? r = new u(s, !1) : s = r.length;
    let c = 0;
    for (; c < a; c++) r.__setDigit(c, e.__digit(c) ^ n.__digit(c));
    for (; c < o; c++) r.__setDigit(c, e.__digit(c));
    for (; c < s; c++) r.__setDigit(c, 0);
    return r;
  }
  static __absoluteCompare(e, n) {
    const r = e.length - n.length;
    if (r != 0) return r;
    let o = e.length - 1;
    for (; 0 <= o && e.__digit(o) === n.__digit(o); ) o--;
    return 0 > o ? 0 : e.__unsignedDigit(o) > n.__unsignedDigit(o) ? 1 : -1;
  }
  static __multiplyAccumulate(e, n, r, o) {
    if (n === 0) return;
    const i = 32767 & n, a = n >>> 15;
    let s = 0, c = 0;
    for (let l, d = 0; d < e.length; d++, o++) {
      l = r.__digit(o);
      const h = e.__digit(d), f = 32767 & h, g = h >>> 15, y = u.__imul(f, i), b = u.__imul(f, a), w = u.__imul(g, i), x = u.__imul(g, a);
      l += c + y + s, s = l >>> 30, l &= 1073741823, l += ((32767 & b) << 15) + ((32767 & w) << 15), s += l >>> 30, c = x + (b >>> 15) + (w >>> 15), r.__setDigit(o, 1073741823 & l);
    }
    for (; s != 0 || c !== 0; o++) {
      let l = r.__digit(o);
      l += s + c, c = 0, s = l >>> 30, r.__setDigit(o, 1073741823 & l);
    }
  }
  static __internalMultiplyAdd(e, n, r, o, i) {
    let a = r, s = 0;
    for (let c = 0; c < o; c++) {
      const l = e.__digit(c), d = u.__imul(32767 & l, n), h = u.__imul(l >>> 15, n), f = d + ((32767 & h) << 15) + s + a;
      a = f >>> 30, s = h >>> 15, i.__setDigit(c, 1073741823 & f);
    }
    if (i.length > o) for (i.__setDigit(o++, a + s); o < i.length; ) i.__setDigit(o++, 0);
    else if (a + s !== 0) throw new Error("implementation bug");
  }
  __inplaceMultiplyAdd(e, n, r) {
    r > this.length && (r = this.length);
    const o = 32767 & e, i = e >>> 15;
    let a = 0, s = n;
    for (let c = 0; c < r; c++) {
      const l = this.__digit(c), d = 32767 & l, h = l >>> 15, f = u.__imul(d, o), g = u.__imul(d, i), y = u.__imul(h, o), b = u.__imul(h, i);
      let w = s + f + a;
      a = w >>> 30, w &= 1073741823, w += ((32767 & g) << 15) + ((32767 & y) << 15), a += w >>> 30, s = b + (g >>> 15) + (y >>> 15), this.__setDigit(c, 1073741823 & w);
    }
    if (a != 0 || s !== 0) throw new Error("implementation bug");
  }
  static __absoluteDivSmall(e, n, r = null) {
    r === null && (r = new u(e.length, !1));
    let o = 0;
    for (let i, a = 2 * e.length - 1; 0 <= a; a -= 2) {
      i = (o << 15 | e.__halfDigit(a)) >>> 0;
      const s = 0 | i / n;
      o = 0 | i % n, i = (o << 15 | e.__halfDigit(a - 1)) >>> 0;
      const c = 0 | i / n;
      o = 0 | i % n, r.__setDigit(a >>> 1, s << 15 | c);
    }
    return r;
  }
  static __absoluteModSmall(e, n) {
    let r = 0;
    for (let o = 2 * e.length - 1; 0 <= o; o--)
      r = 0 | ((r << 15 | e.__halfDigit(o)) >>> 0) % n;
    return r;
  }
  static __absoluteDivLarge(e, n, r, o) {
    const i = n.__halfDigitLength(), a = n.length, s = e.__halfDigitLength() - i;
    let c = null;
    r && (c = new u(s + 2 >>> 1, !1), c.__initializeDigits());
    const l = new u(i + 2 >>> 1, !1);
    l.__initializeDigits();
    const d = u.__clz15(n.__halfDigit(i - 1));
    0 < d && (n = u.__specialLeftShift(n, d, 0));
    const h = u.__specialLeftShift(e, d, 1), f = n.__halfDigit(i - 1);
    let g = 0;
    for (let y, b = s; 0 <= b; b--) {
      y = 32767;
      const w = h.__halfDigit(b + i);
      if (w !== f) {
        const D = (w << 15 | h.__halfDigit(b + i - 1)) >>> 0;
        y = 0 | D / f;
        let E = 0 | D % f;
        const _ = n.__halfDigit(i - 2), M = h.__halfDigit(b + i - 2);
        for (; u.__imul(y, _) >>> 0 > (E << 16 | M) >>> 0 && (y--, E += f, !(32767 < E)); ) ;
      }
      u.__internalMultiplyAdd(n, y, 0, a, l);
      let x = h.__inplaceSub(l, b, i + 1);
      x !== 0 && (x = h.__inplaceAdd(n, b, i), h.__setHalfDigit(b + i, 32767 & h.__halfDigit(b + i) + x), y--), r && (1 & b ? g = y << 15 : c.__setDigit(b >>> 1, g | y));
    }
    if (o) return h.__inplaceRightShift(d), r ? { quotient: c, remainder: h } : h;
    if (r) return c;
    throw new Error("unreachable");
  }
  static __clz15(e) {
    return u.__clz30(e) - 15;
  }
  __inplaceAdd(e, n, r) {
    let o = 0;
    for (let i = 0; i < r; i++) {
      const a = this.__halfDigit(n + i) + e.__halfDigit(i) + o;
      o = a >>> 15, this.__setHalfDigit(n + i, 32767 & a);
    }
    return o;
  }
  __inplaceSub(e, n, r) {
    let o = 0;
    if (1 & n) {
      n >>= 1;
      let i = this.__digit(n), a = 32767 & i, s = 0;
      for (; s < r - 1 >>> 1; s++) {
        const d = e.__digit(s), h = (i >>> 15) - (32767 & d) - o;
        o = 1 & h >>> 15, this.__setDigit(n + s, (32767 & h) << 15 | 32767 & a), i = this.__digit(n + s + 1), a = (32767 & i) - (d >>> 15) - o, o = 1 & a >>> 15;
      }
      const c = e.__digit(s), l = (i >>> 15) - (32767 & c) - o;
      if (o = 1 & l >>> 15, this.__setDigit(n + s, (32767 & l) << 15 | 32767 & a), n + s + 1 >= this.length) throw new RangeError("out of bounds");
      (1 & r) == 0 && (i = this.__digit(n + s + 1), a = (32767 & i) - (c >>> 15) - o, o = 1 & a >>> 15, this.__setDigit(n + e.length, 1073709056 & i | 32767 & a));
    } else {
      n >>= 1;
      let i = 0;
      for (; i < e.length - 1; i++) {
        const d = this.__digit(n + i), h = e.__digit(i), f = (32767 & d) - (32767 & h) - o;
        o = 1 & f >>> 15;
        const g = (d >>> 15) - (h >>> 15) - o;
        o = 1 & g >>> 15, this.__setDigit(n + i, (32767 & g) << 15 | 32767 & f);
      }
      const a = this.__digit(n + i), s = e.__digit(i), c = (32767 & a) - (32767 & s) - o;
      o = 1 & c >>> 15;
      let l = 0;
      (1 & r) == 0 && (l = (a >>> 15) - (s >>> 15) - o, o = 1 & l >>> 15), this.__setDigit(n + i, (32767 & l) << 15 | 32767 & c);
    }
    return o;
  }
  __inplaceRightShift(e) {
    if (e === 0) return;
    let n = this.__digit(0) >>> e;
    const r = this.length - 1;
    for (let o = 0; o < r; o++) {
      const i = this.__digit(o + 1);
      this.__setDigit(o, 1073741823 & i << 30 - e | n), n = i >>> e;
    }
    this.__setDigit(r, n);
  }
  static __specialLeftShift(e, n, r) {
    const o = e.length, i = new u(o + r, !1);
    if (n === 0) {
      for (let s = 0; s < o; s++) i.__setDigit(s, e.__digit(s));
      return 0 < r && i.__setDigit(o, 0), i;
    }
    let a = 0;
    for (let s = 0; s < o; s++) {
      const c = e.__digit(s);
      i.__setDigit(s, 1073741823 & c << n | a), a = c >>> 30 - n;
    }
    return 0 < r && i.__setDigit(o, a), i;
  }
  static __leftShiftByAbsolute(e, n) {
    const r = u.__toShiftAmount(n);
    if (0 > r) throw new RangeError("BigInt too big");
    const o = 0 | r / 30, i = r % 30, a = e.length, s = i !== 0 && e.__digit(a - 1) >>> 30 - i != 0, c = a + o + (s ? 1 : 0), l = new u(c, e.sign);
    if (i === 0) {
      let d = 0;
      for (; d < o; d++) l.__setDigit(d, 0);
      for (; d < c; d++) l.__setDigit(d, e.__digit(d - o));
    } else {
      let d = 0;
      for (let h = 0; h < o; h++) l.__setDigit(h, 0);
      for (let h = 0; h < a; h++) {
        const f = e.__digit(h);
        l.__setDigit(h + o, 1073741823 & f << i | d), d = f >>> 30 - i;
      }
      if (s) l.__setDigit(a + o, d);
      else if (d !== 0) throw new Error("implementation bug");
    }
    return l.__trim();
  }
  static __rightShiftByAbsolute(e, n) {
    const r = e.length, o = e.sign, i = u.__toShiftAmount(n);
    if (0 > i) return u.__rightShiftByMaximum(o);
    const a = 0 | i / 30, s = i % 30;
    let c = r - a;
    if (0 >= c) return u.__rightShiftByMaximum(o);
    let l = !1;
    if (o) {
      if ((e.__digit(a) & (1 << s) - 1) != 0) l = !0;
      else for (let h = 0; h < a; h++) if (e.__digit(h) !== 0) {
        l = !0;
        break;
      }
    }
    l && s === 0 && ~e.__digit(r - 1) == 0 && c++;
    let d = new u(c, o);
    if (s === 0) {
      d.__setDigit(c - 1, 0);
      for (let h = a; h < r; h++) d.__setDigit(h - a, e.__digit(h));
    } else {
      let h = e.__digit(a) >>> s;
      const f = r - a - 1;
      for (let g = 0; g < f; g++) {
        const y = e.__digit(g + a + 1);
        d.__setDigit(g, 1073741823 & y << 30 - s | h), h = y >>> s;
      }
      d.__setDigit(f, h);
    }
    return l && (d = u.__absoluteAddOne(d, !0, d)), d.__trim();
  }
  static __rightShiftByMaximum(e) {
    return e ? u.__oneDigit(1, !0) : u.__zero();
  }
  static __toShiftAmount(e) {
    if (1 < e.length) return -1;
    const n = e.__unsignedDigit(0);
    return n > u.__kMaxLengthBits ? -1 : n;
  }
  static __toPrimitive(e, n = "default") {
    if (typeof e != "object" || e.constructor === u) return e;
    if (typeof Symbol < "u" && typeof Symbol.toPrimitive == "symbol" && e[Symbol.toPrimitive]) {
      const i = e[Symbol.toPrimitive](n);
      if (typeof i != "object") return i;
      throw new TypeError("Cannot convert object to primitive value");
    }
    const r = e.valueOf;
    if (r) {
      const i = r.call(e);
      if (typeof i != "object") return i;
    }
    const o = e.toString;
    if (o) {
      const i = o.call(e);
      if (typeof i != "object") return i;
    }
    throw new TypeError("Cannot convert object to primitive value");
  }
  static __toNumeric(e) {
    return u.__isBigInt(e) ? e : +e;
  }
  static __isBigInt(e) {
    return typeof e == "object" && e !== null && e.constructor === u;
  }
  static __truncateToNBits(e, n) {
    const r = 0 | (e + 29) / 30, o = new u(r, n.sign), i = r - 1;
    for (let s = 0; s < i; s++) o.__setDigit(s, n.__digit(s));
    let a = n.__digit(i);
    if (e % 30 != 0) {
      const s = 32 - e % 30;
      a = a << s >>> s;
    }
    return o.__setDigit(i, a), o.__trim();
  }
  static __truncateAndSubFromPowerOfTwo(e, n, r) {
    var o = Math.min;
    const i = 0 | (e + 29) / 30, a = new u(i, r);
    let s = 0;
    const c = i - 1;
    let l = 0;
    for (const g = o(c, n.length); s < g; s++) {
      const y = 0 - n.__digit(s) - l;
      l = 1 & y >>> 30, a.__setDigit(s, 1073741823 & y);
    }
    for (; s < c; s++) a.__setDigit(s, 0 | 1073741823 & -l);
    let d = c < n.length ? n.__digit(c) : 0;
    const h = e % 30;
    let f;
    if (h == 0) f = 0 - d - l, f &= 1073741823;
    else {
      const g = 32 - h;
      d = d << g >>> g;
      const y = 1 << 32 - g;
      f = y - d - l, f &= y - 1;
    }
    return a.__setDigit(c, f), a.__trim();
  }
  __digit(e) {
    return this[e];
  }
  __unsignedDigit(e) {
    return this[e] >>> 0;
  }
  __setDigit(e, n) {
    this[e] = 0 | n;
  }
  __setDigitGrow(e, n) {
    this[e] = 0 | n;
  }
  __halfDigitLength() {
    const e = this.length;
    return 32767 >= this.__unsignedDigit(e - 1) ? 2 * e - 1 : 2 * e;
  }
  __halfDigit(e) {
    return 32767 & this[e >>> 1] >>> 15 * (1 & e);
  }
  __setHalfDigit(e, n) {
    const r = e >>> 1, o = this.__digit(r), i = 1 & e ? 32767 & o | n << 15 : 1073709056 & o | 32767 & n;
    this.__setDigit(r, i);
  }
  static __digitPow(e, n) {
    let r = 1;
    for (; 0 < n; ) 1 & n && (r *= e), n >>>= 1, e *= e;
    return r;
  }
  static __detectBigEndian() {
    return u.__kBitConversionDouble[0] = -0, u.__kBitConversionInts[0] !== 0;
  }
  static __isOneDigitInt(e) {
    return (1073741823 & e) === e;
  }
}
u.__kMaxLength = 33554432, u.__kMaxLengthBits = u.__kMaxLength << 5, u.__kMaxBitsPerChar = [0, 0, 32, 51, 64, 75, 83, 90, 96, 102, 107, 111, 115, 119, 122, 126, 128, 131, 134, 136, 139, 141, 143, 145, 147, 149, 151, 153, 154, 156, 158, 159, 160, 162, 163, 165, 166], u.__kBitsPerCharTableShift = 5, u.__kBitsPerCharTableMultiplier = 1 << u.__kBitsPerCharTableShift, u.__kConversionChars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"], u.__kBitConversionBuffer = new ArrayBuffer(8), u.__kBitConversionDouble = new Float64Array(u.__kBitConversionBuffer), u.__kBitConversionInts = new Int32Array(u.__kBitConversionBuffer), u.__kBitConversionIntHigh = u.__detectBigEndian() ? 0 : 1, u.__kBitConversionIntLow = u.__detectBigEndian() ? 1 : 0, u.__clz30 = Math.clz32 ? function(t) {
  return Math.clz32(t) - 2;
} : function(t) {
  return t === 0 ? 30 : 0 | 29 - (0 | Math.log(t >>> 0) / Math.LN2);
}, u.__imul = Math.imul || function(t, e) {
  return 0 | t * e;
};
const st = u.BigInt(0), Yr = u.BigInt(1), Ai = u.BigInt(2), Il = u.BigInt(10), Ll = u.BigInt(24), Sl = u.BigInt(60), Yl = u.BigInt(1e3), Vr = u.BigInt(1e6), Tr = u.BigInt(1e9), Os = u.multiply(u.BigInt(3600), Tr), Pl = u.multiply(Sl, Tr), fn = u.multiply(Os, Ll);
function Ht(t) {
  return typeof t == "bigint" ? u.BigInt(t.toString(10)) : t;
}
function $s(t) {
  return u.equal(u.remainder(t, Ai), st);
}
function Cn(t) {
  return u.lessThan(t, st) ? u.unaryMinus(t) : t;
}
function bo(t, e) {
  return u.lessThan(t, e) ? -1 : u.greaterThan(t, e) ? 1 : 0;
}
function vr(t, e) {
  return { quotient: u.divide(t, e), remainder: u.remainder(t, e) };
}
var Sa, Ya;
const S = "slot-epochNanoSeconds", Y = "slot-iso-date", re = "slot-iso-date-time", de = "slot-time", T = "slot-calendar", Is = "slot-date-brand", Ls = "slot-year-month-brand", Ss = "slot-month-day-brand", X = "slot-time-zone", Ye = "slot-years", Pe = "slot-months", et = "slot-weeks", ze = "slot-days", Ue = "slot-hours", je = "slot-minutes", Ae = "slot-seconds", Fe = "slot-milliseconds", qe = "slot-microseconds", tt = "slot-nanoseconds", Ys = "date", Ps = "ym", zs = "md", Us = "time", js = "datetime", As = "instant", Ln = "original", Zn = "timezone-canonical", fi = "timezone-original", wr = "calendar-id", Fs = "locale", gi = "options", qs = /* @__PURE__ */ new WeakMap(), pi = Symbol.for("@@Temporal__GetSlots");
(Sa = globalThis)[pi] || (Sa[pi] = function(t) {
  return qs.get(t);
});
const Yo = globalThis[pi], yi = Symbol.for("@@Temporal__CreateSlots");
(Ya = globalThis)[yi] || (Ya[yi] = function(t) {
  qs.set(t, /* @__PURE__ */ Object.create(null));
});
const rn = globalThis[yi];
function Xe(t, ...e) {
  if (!t || typeof t != "object") return !1;
  const n = Yo(t);
  return !!n && e.every(((r) => r in n));
}
function m(t, e) {
  var r;
  const n = (r = Yo(t)) == null ? void 0 : r[e];
  if (n === void 0) throw new TypeError(`Missing internal slot ${e}`);
  return n;
}
function F(t, e, n) {
  const r = Yo(t);
  if (r === void 0) throw new TypeError("Missing slots for the given container");
  if (r[e]) throw new TypeError(`${e} already has set`);
  r[e] = n;
}
const vi = {};
function on(t, e) {
  Object.defineProperty(t.prototype, Symbol.toStringTag, { value: e, writable: !1, enumerable: !1, configurable: !0 });
  const n = Object.getOwnPropertyNames(t);
  for (let o = 0; o < n.length; o++) {
    const i = n[o], a = Object.getOwnPropertyDescriptor(t, i);
    a.configurable && a.enumerable && (a.enumerable = !1, Object.defineProperty(t, i, a));
  }
  const r = Object.getOwnPropertyNames(t.prototype);
  for (let o = 0; o < r.length; o++) {
    const i = r[o], a = Object.getOwnPropertyDescriptor(t.prototype, i);
    a.configurable && a.enumerable && (a.enumerable = !1, Object.defineProperty(t.prototype, i, a));
  }
  wi(e, t), wi(`${e}.prototype`, t.prototype);
}
function wi(t, e) {
  const n = `%${t}%`;
  if (vi[n] !== void 0) throw new Error(`intrinsic ${t} already exists`);
  vi[n] = e;
}
function _e(t) {
  return vi[t];
}
function Wn(t, e) {
  let n = t;
  if (n === 0) return { div: n, mod: n };
  const r = Math.sign(n);
  n = Math.abs(n);
  const o = Math.trunc(1 + Math.log10(n));
  if (e >= o) return { div: 0 * r, mod: r * n };
  if (e === 0) return { div: r * n, mod: 0 * r };
  const i = n.toPrecision(o);
  return { div: r * Number.parseInt(i.slice(0, o - e), 10), mod: r * Number.parseInt(i.slice(o - e), 10) };
}
function ri(t, e, n) {
  let r = t, o = n;
  if (r === 0) return o;
  const i = Math.sign(r) || Math.sign(o);
  r = Math.abs(r), o = Math.abs(o);
  const a = r.toPrecision(Math.trunc(1 + Math.log10(r)));
  if (o === 0) return i * Number.parseInt(a + "0".repeat(e), 10);
  const s = a + o.toPrecision(Math.trunc(1 + Math.log10(o))).padStart(e, "0");
  return i * Number.parseInt(s, 10);
}
function Po(t, e) {
  const n = e === "negative";
  switch (t) {
    case "ceil":
      return n ? "zero" : "infinity";
    case "floor":
      return n ? "infinity" : "zero";
    case "expand":
      return "infinity";
    case "trunc":
      return "zero";
    case "halfCeil":
      return n ? "half-zero" : "half-infinity";
    case "halfFloor":
      return n ? "half-infinity" : "half-zero";
    case "halfExpand":
      return "half-infinity";
    case "halfTrunc":
      return "half-zero";
    case "halfEven":
      return "half-even";
  }
}
function zo(t, e, n, r, o) {
  return o === "zero" ? t : o === "infinity" ? e : n < 0 ? t : n > 0 ? e : o === "half-zero" ? t : o === "half-infinity" ? e : r ? t : e;
}
class Z {
  constructor(e) {
    this.totalNs = Ht(e), this.sec = u.toNumber(u.divide(this.totalNs, Tr)), this.subsec = u.toNumber(u.remainder(this.totalNs, Tr));
  }
  static validateNew(e, n) {
    if (u.greaterThan(Cn(e), Z.MAX)) throw new RangeError(`${n} of duration time units cannot exceed ${Z.MAX} s`);
    return new Z(e);
  }
  static fromEpochNsDiff(e, n) {
    const r = u.subtract(Ht(e), Ht(n));
    return new Z(r);
  }
  static fromComponents(e, n, r, o, i, a) {
    const s = u.add(u.add(u.add(u.add(u.add(u.BigInt(a), u.multiply(u.BigInt(i), Yl)), u.multiply(u.BigInt(o), Vr)), u.multiply(u.BigInt(r), Tr)), u.multiply(u.BigInt(n), Pl)), u.multiply(u.BigInt(e), Os));
    return Z.validateNew(s, "total");
  }
  abs() {
    return new Z(Cn(this.totalNs));
  }
  add(e) {
    return Z.validateNew(u.add(this.totalNs, e.totalNs), "sum");
  }
  add24HourDays(e) {
    return Z.validateNew(u.add(this.totalNs, u.multiply(u.BigInt(e), fn)), "sum");
  }
  addToEpochNs(e) {
    return u.add(Ht(e), this.totalNs);
  }
  cmp(e) {
    return bo(this.totalNs, e.totalNs);
  }
  divmod(e) {
    const { quotient: n, remainder: r } = vr(this.totalNs, u.BigInt(e));
    return { quotient: u.toNumber(n), remainder: new Z(r) };
  }
  fdiv(e) {
    const n = Ht(e), r = u.BigInt(n);
    let { quotient: o, remainder: i } = vr(this.totalNs, r);
    const a = [];
    let s;
    const c = (u.lessThan(this.totalNs, st) ? -1 : 1) * Math.sign(u.toNumber(n));
    for (; !u.equal(i, st) && a.length < 50; ) i = u.multiply(i, Il), { quotient: s, remainder: i } = vr(i, r), a.push(Math.abs(u.toNumber(s)));
    return c * +(Cn(o).toString() + "." + a.join(""));
  }
  isZero() {
    return u.equal(this.totalNs, st);
  }
  round(e, n) {
    const r = Ht(e);
    if (u.equal(r, Yr)) return this;
    const { quotient: o, remainder: i } = vr(this.totalNs, r), a = u.lessThan(this.totalNs, st) ? "negative" : "positive", s = u.multiply(Cn(o), r), c = u.add(s, r), l = bo(Cn(u.multiply(i, Ai)), r), d = Po(n, a), h = u.equal(Cn(this.totalNs), s) ? s : zo(s, c, l, $s(o), d), f = a === "positive" ? h : u.unaryMinus(h);
    return Z.validateNew(f, "rounding");
  }
  sign() {
    return this.cmp(new Z(st));
  }
  subtract(e) {
    return Z.validateNew(u.subtract(this.totalNs, e.totalNs), "difference");
  }
}
Z.MAX = u.BigInt("9007199254740991999999999"), Z.ZERO = new Z(st);
const Pa = /[A-Za-z._][A-Za-z._0-9+-]*/, Xr = new RegExp(`(?:${/(?:[+-](?:[01][0-9]|2[0-3])(?::?[0-5][0-9])?)/.source}|(?:${Pa.source})(?:\\/(?:${Pa.source}))*)`), Zs = /(?:[+-]\d{6}|\d{4})/, xo = /(?:0[1-9]|1[0-2])/, bi = /(?:0[1-9]|[12]\d|3[01])/, zl = new RegExp(`(${Zs.source})(?:-(${xo.source})-(${bi.source})|(${xo.source})(${bi.source}))`), Hs = /(\d{2})(?::(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?|(\d{2})(?:(\d{2})(?:[.,](\d{1,9}))?)?)?/, Ws = /((?:[+-])(?:[01][0-9]|2[0-3])(?::?(?:[0-5][0-9])(?::?(?:[0-5][0-9])(?:[.,](?:\d{1,9}))?)?)?)/, Gs = new RegExp(`([zZ])|${Ws.source}?`), Xn = /\[(!)?([a-z_][a-z0-9_-]*)=([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)\]/g, Ul = new RegExp([`^${zl.source}`, `(?:(?:[tT]|\\s+)${Hs.source}(?:${Gs.source})?)?`, `(?:\\[!?(${Xr.source})\\])?`, `((?:${Xn.source})*)$`].join("")), jl = new RegExp([`^[tT]?${Hs.source}`, `(?:${Gs.source})?`, `(?:\\[!?${Xr.source}\\])?`, `((?:${Xn.source})*)$`].join("")), Al = new RegExp(`^(${Zs.source})-?(${xo.source})(?:\\[!?${Xr.source}\\])?((?:${Xn.source})*)$`), Fl = new RegExp(`^(?:--)?(${xo.source})-?(${bi.source})(?:\\[!?${Xr.source}\\])?((?:${Xn.source})*)$`), oi = /(\d+)(?:[.,](\d{1,9}))?/, ql = new RegExp(`(?:${oi.source}H)?(?:${oi.source}M)?(?:${oi.source}S)?`), Zl = new RegExp(`^([+-])?P${/(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?/.source}(?:T(?!$)${ql.source})?$`, "i"), gn = 864e5, Co = 1e6 * gn, Hl = 6e10, Ks = 1e8 * gn, Qn = $t(Ks), Pr = u.unaryMinus(Qn), Wl = u.add(u.subtract(Pr, fn), Yr), Gl = u.subtract(u.add(Qn, fn), Yr), Kl = 146097 * gn, za = -271821, Ua = 275760, _r = Date.UTC(1847, 0, 1), Vl = ["iso8601", "hebrew", "islamic", "islamic-umalqura", "islamic-tbla", "islamic-civil", "islamic-rgsa", "islamicc", "persian", "ethiopic", "ethioaa", "ethiopic-amete-alem", "coptic", "chinese", "dangi", "roc", "indian", "buddhist", "japanese", "gregory"], Xl = /* @__PURE__ */ new Set(["ACT", "AET", "AGT", "ART", "AST", "BET", "BST", "CAT", "CNT", "CST", "CTT", "EAT", "ECT", "IET", "IST", "JST", "MIT", "NET", "NST", "PLT", "PNT", "PRT", "PST", "SST", "VST"]);
function ue(t) {
  return typeof t == "object" && t !== null || typeof t == "function";
}
function Uo(t) {
  if (typeof t == "bigint") throw new TypeError("Cannot convert BigInt to number");
  return Number(t);
}
function jo(t) {
  if (typeof t == "symbol") throw new TypeError("Cannot convert a Symbol value to a String");
  return String(t);
}
function U(t) {
  const e = Uo(t);
  if (e === 0) return 0;
  if (Number.isNaN(e) || e === 1 / 0 || e === -1 / 0) throw new RangeError("invalid number value");
  const n = Math.trunc(e);
  return n === 0 ? 0 : n;
}
function ja(t, e) {
  const n = U(t);
  if (n <= 0)
    throw e !== void 0 ? new RangeError(`property '${e}' cannot be a a number less than one`) : new RangeError("Cannot convert a number less than one to a positive integer");
  return n;
}
function Dt(t) {
  const e = Uo(t);
  if (Number.isNaN(e)) throw new RangeError("not a number");
  if (e === 1 / 0 || e === -1 / 0) throw new RangeError("infinity is out of range");
  if (!(function(n) {
    if (typeof n != "number" || Number.isNaN(n) || n === 1 / 0 || n === -1 / 0) return !1;
    const r = Math.abs(n);
    return Math.floor(r) === r;
  })(e)) throw new RangeError(`unsupported fractional value ${t}`);
  return e === 0 ? 0 : e;
}
function zr(t, e) {
  return String(t).padStart(e, "0");
}
function ve(t) {
  if (typeof t != "string") throw new TypeError(`expected a string, not ${String(t)}`);
  return t;
}
function xi(t, e) {
  if (ue(t)) {
    const n = t == null ? void 0 : t.toString();
    if (typeof n == "string" || typeof n == "number") return n;
    throw new TypeError("Cannot convert object to primitive value");
  }
  return t;
}
const Ci = ["era", "eraYear", "year", "month", "monthCode", "day", "hour", "minute", "second", "millisecond", "microsecond", "nanosecond", "offset", "timeZone"], Ql = { era: jo, eraYear: U, year: U, month: ja, monthCode: function(t) {
  const e = ve(xi(t));
  if (e.length < 3 || e.length > 4 || e[0] !== "M" || "0123456789".indexOf(e[1]) === -1 || "0123456789".indexOf(e[2]) === -1 || e[1] + e[2] === "00" && e[3] !== "L" || e[3] !== "L" && e[3] !== void 0) throw new RangeError(`bad month code ${e}; must match M01-M99 or M00L-M99L`);
  return e;
}, day: ja, hour: U, minute: U, second: U, millisecond: U, microsecond: U, nanosecond: U, offset: function(t) {
  const e = ve(xi(t));
  return dr(e), e;
}, timeZone: Ge }, Bl = { hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }, Bn = [["years", "year", "date"], ["months", "month", "date"], ["weeks", "week", "date"], ["days", "day", "date"], ["hours", "hour", "time"], ["minutes", "minute", "time"], ["seconds", "second", "time"], ["milliseconds", "millisecond", "time"], ["microseconds", "microsecond", "time"], ["nanoseconds", "nanosecond", "time"]], Aa = Object.fromEntries(Bn.map(((t) => [t[0], t[1]]))), Jl = Object.fromEntries(Bn.map((([t, e]) => [e, t]))), Mr = Bn.map((([, t]) => t)), Jn = { day: Co, hour: 36e11, minute: 6e10, second: 1e9, millisecond: 1e6, microsecond: 1e3, nanosecond: 1 }, Do = ["days", "hours", "microseconds", "milliseconds", "minutes", "months", "nanoseconds", "seconds", "weeks", "years"], ed = Intl.DateTimeFormat, Fa = /* @__PURE__ */ new Map();
function Vs(t) {
  const e = qr(t);
  let n = Fa.get(e);
  return n === void 0 && (n = new ed("en-us", { timeZone: e, hour12: !1, era: "short", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" }), Fa.set(e, n)), n;
}
function Ce(t) {
  return Xe(t, S) && !Xe(t, X, T);
}
function ce(t) {
  return Xe(t, Ye, Pe, ze, Ue, je, Ae, Fe, qe, tt);
}
function le(t) {
  return Xe(t, Is);
}
function me(t) {
  return Xe(t, de);
}
function ne(t) {
  return Xe(t, re);
}
function De(t) {
  return Xe(t, Ls);
}
function at(t) {
  return Xe(t, Ss);
}
function q(t) {
  return Xe(t, S, X, T);
}
function C(t, e) {
  if (!e(t)) throw new TypeError("invalid receiver: method called with the wrong type of this-object");
}
function sr(t) {
  if (Xe(t, T) || Xe(t, X)) throw new TypeError("with() does not support a calendar or timeZone property");
  if (me(t)) throw new TypeError("with() does not accept Temporal.PlainTime, use withPlainTime() instead");
  if (t.calendar !== void 0) throw new TypeError("with() does not support a calendar property");
  if (t.timeZone !== void 0) throw new TypeError("with() does not support a timeZone property");
}
function Qr(t, e) {
  return e === "never" || e === "auto" && t === "iso8601" ? "" : `[${e === "critical" ? "!" : ""}u-ca=${t}]`;
}
function Ao(t) {
  let e, n, r = !1;
  for (Xn.lastIndex = 0; n = Xn.exec(t); ) {
    const { 1: o, 2: i, 3: a } = n;
    if (i === "u-ca") {
      if (e === void 0) e = a, r = o === "!";
      else if (o === "!" || r) throw new RangeError(`Invalid annotations in ${t}: more than one u-ca present with critical flag`);
    } else if (o === "!") throw new RangeError(`Unrecognized annotation: !${i}=${a}`);
  }
  return e;
}
function jt(t) {
  const e = Ul.exec(t);
  if (!e) throw new RangeError(`invalid RFC 9557 string: ${t}`);
  const n = Ao(e[16]);
  let r = e[1];
  if (r === "-000000") throw new RangeError(`invalid RFC 9557 string: ${t}`);
  const o = +r, i = +(e[2] ?? e[4] ?? 1), a = +(e[3] ?? e[5] ?? 1), s = e[6] !== void 0, c = +(e[6] ?? 0), l = +(e[7] ?? e[10] ?? 0);
  let d = +(e[8] ?? e[11] ?? 0);
  d === 60 && (d = 59);
  const h = (e[9] ?? e[12] ?? "") + "000000000", f = +h.slice(0, 3), g = +h.slice(3, 6), y = +h.slice(6, 9);
  let b, w = !1;
  e[13] ? (b = void 0, w = !0) : e[14] && (b = e[14]);
  const x = e[15];
  return Gi(o, i, a, c, l, d, f, g, y), { year: o, month: i, day: a, time: s ? { hour: c, minute: l, second: d, millisecond: f, microsecond: g, nanosecond: y } : "start-of-day", tzAnnotation: x, offset: b, z: w, calendar: n };
}
function Xs(t) {
  const e = jl.exec(t);
  let n, r, o, i, a, s, c;
  if (e) {
    c = Ao(e[10]), n = +(e[1] ?? 0), r = +(e[2] ?? e[5] ?? 0), o = +(e[3] ?? e[6] ?? 0), o === 60 && (o = 59);
    const l = (e[4] ?? e[7] ?? "") + "000000000";
    if (i = +l.slice(0, 3), a = +l.slice(3, 6), s = +l.slice(6, 9), e[8]) throw new RangeError("Z designator not supported for PlainTime");
  } else {
    let l, d;
    if ({ time: l, z: d, calendar: c } = jt(t), l === "start-of-day") throw new RangeError(`time is missing in string: ${t}`);
    if (d) throw new RangeError("Z designator not supported for PlainTime");
    ({ hour: n, minute: r, second: o, millisecond: i, microsecond: a, nanosecond: s } = l);
  }
  if (Ho(n, r, o, i, a, s), /[tT ][0-9][0-9]/.test(t)) return { hour: n, minute: r, second: o, millisecond: i, microsecond: a, nanosecond: s, calendar: c };
  try {
    const { month: l, day: d } = qi(t);
    Mn(1972, l, d);
  } catch {
    try {
      const { year: l, month: d } = Fi(t);
      Mn(l, d, 1);
    } catch {
      return { hour: n, minute: r, second: o, millisecond: i, microsecond: a, nanosecond: s, calendar: c };
    }
  }
  throw new RangeError(`invalid RFC 9557 time-only string ${t}; may need a T prefix`);
}
function Fi(t) {
  const e = Al.exec(t);
  let n, r, o, i;
  if (e) {
    o = Ao(e[3]);
    let a = e[1];
    if (a === "-000000") throw new RangeError(`invalid RFC 9557 string: ${t}`);
    if (n = +a, r = +e[2], i = 1, o !== void 0 && o !== "iso8601") throw new RangeError("YYYY-MM format is only valid with iso8601 calendar");
  } else {
    let a;
    if ({ year: n, month: r, calendar: o, day: i, z: a } = jt(t), a) throw new RangeError("Z designator not supported for PlainYearMonth");
  }
  return { year: n, month: r, calendar: o, referenceISODay: i };
}
function qi(t) {
  const e = Fl.exec(t);
  let n, r, o, i;
  if (e) {
    if (o = Ao(e[3]), n = +e[1], r = +e[2], o !== void 0 && o !== "iso8601") throw new RangeError("MM-DD format is only valid with iso8601 calendar");
  } else {
    let a;
    if ({ month: n, day: r, calendar: o, year: i, z: a } = jt(t), a) throw new RangeError("Z designator not supported for PlainMonthDay");
  }
  return { month: n, day: r, calendar: o, referenceISOYear: i };
}
const Qs = new RegExp(`^${Xr.source}$`, "i"), Bs = new RegExp(`^${/([+-])([01][0-9]|2[0-3])(?::?([0-5][0-9])?)?/.source}$`);
function Js(t) {
  const e = nd.test(t) ? "Seconds not allowed in offset time zone" : "Invalid time zone";
  throw new RangeError(`${e}: ${t}`);
}
function hn(t) {
  return Qs.test(t) || Js(t), Bs.test(t) ? { offsetMinutes: dr(t) / 6e10 } : { tzName: t };
}
function Nr(t, e, n, r) {
  let o = t, i = e, a = n;
  switch (r) {
    case "reject":
      Mn(o, i, a);
      break;
    case "constrain":
      ({ year: o, month: i, day: a } = pc(o, i, a));
  }
  return { year: o, month: i, day: a };
}
function Fo(t, e, n, r, o, i, a) {
  let s = t, c = e, l = n, d = r, h = o, f = i;
  switch (a) {
    case "reject":
      Ho(s, c, l, d, h, f);
      break;
    case "constrain":
      s = Ze(s, 0, 23), c = Ze(c, 0, 59), l = Ze(l, 0, 59), d = Ze(d, 0, 999), h = Ze(h, 0, 999), f = Ze(f, 0, 999);
  }
  return { hour: s, minute: c, second: l, millisecond: d, microsecond: h, nanosecond: f };
}
function ec(t) {
  if (!ue(t)) throw new TypeError("invalid duration-like");
  const e = { years: void 0, months: void 0, weeks: void 0, days: void 0, hours: void 0, minutes: void 0, seconds: void 0, milliseconds: void 0, microseconds: void 0, nanoseconds: void 0 };
  let n = !1;
  for (let r = 0; r < Do.length; r++) {
    const o = Do[r], i = t[o];
    i !== void 0 && (n = !0, e[o] = Dt(i));
  }
  if (!n) throw new TypeError("invalid duration-like");
  return e;
}
function Re({ years: t, months: e, weeks: n, days: r }, o, i, a) {
  return { years: t, months: a ?? e, weeks: i ?? n, days: o ?? r };
}
function K(t, e) {
  return { isoDate: t, time: e };
}
function G(t) {
  return Bt(t, "overflow", ["constrain", "reject"], "constrain");
}
function Rr(t) {
  return Bt(t, "disambiguation", ["compatible", "earlier", "later", "reject"], "compatible");
}
function Et(t, e) {
  return Bt(t, "roundingMode", ["ceil", "floor", "expand", "trunc", "halfCeil", "halfFloor", "halfExpand", "halfTrunc", "halfEven"], e);
}
function yo(t, e) {
  return Bt(t, "offset", ["prefer", "use", "ignore", "reject"], e);
}
function Br(t) {
  return Bt(t, "calendarName", ["auto", "always", "never", "critical"], "auto");
}
function cr(t) {
  let e = t.roundingIncrement;
  if (e === void 0) return 1;
  const n = U(e);
  if (n < 1 || n > 1e9) throw new RangeError(`roundingIncrement must be at least 1 and at most 1e9, not ${e}`);
  return n;
}
function lr(t, e, n) {
  const r = n ? e : e - 1;
  if (t > r) throw new RangeError(`roundingIncrement must be at least 1 and less than ${r}, not ${t}`);
  if (e % t != 0) throw new RangeError(`Rounding increment must divide evenly into ${e}`);
}
function Jr(t) {
  const e = t.fractionalSecondDigits;
  if (e === void 0) return "auto";
  if (typeof e != "number") {
    if (jo(e) !== "auto") throw new RangeError(`fractionalSecondDigits must be 'auto' or 0 through 9, not ${e}`);
    return "auto";
  }
  const n = Math.floor(e);
  if (!Number.isFinite(n) || n < 0 || n > 9) throw new RangeError(`fractionalSecondDigits must be 'auto' or 0 through 9, not ${e}`);
  return n;
}
function eo(t, e) {
  switch (t) {
    case "minute":
      return { precision: "minute", unit: "minute", increment: 1 };
    case "second":
      return { precision: 0, unit: "second", increment: 1 };
    case "millisecond":
      return { precision: 3, unit: "millisecond", increment: 1 };
    case "microsecond":
      return { precision: 6, unit: "microsecond", increment: 1 };
    case "nanosecond":
      return { precision: 9, unit: "nanosecond", increment: 1 };
  }
  switch (e) {
    case "auto":
      return { precision: e, unit: "nanosecond", increment: 1 };
    case 0:
      return { precision: e, unit: "second", increment: 1 };
    case 1:
    case 2:
    case 3:
      return { precision: e, unit: "millisecond", increment: 10 ** (3 - e) };
    case 4:
    case 5:
    case 6:
      return { precision: e, unit: "microsecond", increment: 10 ** (6 - e) };
    case 7:
    case 8:
    case 9:
      return { precision: e, unit: "nanosecond", increment: 10 ** (9 - e) };
    default:
      throw new RangeError(`fractionalSecondDigits must be 'auto' or 0 through 9, not ${e}`);
  }
}
const nn = Symbol("~required~");
function rt(t, e, n, r, o = []) {
  let i = [];
  for (let l = 0; l < Bn.length; l++) {
    const d = Bn[l], h = d[1], f = d[2];
    n !== "datetime" && n !== f || i.push(h);
  }
  i = i.concat(o);
  let a = r;
  a === nn ? a = void 0 : a !== void 0 && i.push(a);
  let s = [];
  s = s.concat(i);
  for (let l = 0; l < i.length; l++) {
    const d = i[l], h = Jl[d];
    h !== void 0 && s.push(h);
  }
  let c = Bt(t, e, s, a);
  if (c === void 0 && r === nn) throw new RangeError(`${e} is required`);
  return c && c in Aa ? Aa[c] : c;
}
function ii(t) {
  const e = t.relativeTo;
  if (e === void 0) return {};
  let n, r, o, i, a, s = "option", c = !1;
  if (ue(e)) {
    if (q(e)) return { zonedRelativeTo: e };
    if (le(e)) return { plainRelativeTo: e };
    if (ne(e)) return { plainRelativeTo: We(m(e, re).isoDate, m(e, T)) };
    o = io(e);
    const l = ut(o, e, ["year", "month", "monthCode", "day"], ["hour", "minute", "second", "millisecond", "microsecond", "nanosecond", "offset", "timeZone"], []);
    ({ isoDate: n, time: r } = no(o, l, "constrain")), { offset: a, timeZone: i } = l, a === void 0 && (s = "wall");
  } else {
    let l, d, h, f, g;
    if ({ year: h, month: f, day: g, time: r, calendar: o, tzAnnotation: l, offset: a, z: d } = jt(ve(e)), l) i = Ge(l), d ? s = "exact" : a || (s = "wall"), c = !0;
    else if (d) throw new RangeError("Z designator not supported for PlainDate relativeTo; either remove the Z or add a bracketed time zone");
    o || (o = "iso8601"), o = Qe(o), n = { year: h, month: f, day: g };
  }
  return i === void 0 ? { plainRelativeTo: We(n, o) } : { zonedRelativeTo: Ne(Eo(n, r, s, s === "option" ? dr(a) : 0, i, "compatible", "reject", c), i, o) };
}
function Wt(t) {
  return m(t, Ye) !== 0 ? "year" : m(t, Pe) !== 0 ? "month" : m(t, et) !== 0 ? "week" : m(t, ze) !== 0 ? "day" : m(t, Ue) !== 0 ? "hour" : m(t, je) !== 0 ? "minute" : m(t, Ae) !== 0 ? "second" : m(t, Fe) !== 0 ? "millisecond" : m(t, qe) !== 0 ? "microsecond" : "nanosecond";
}
function Xt(t, e) {
  return Mr.indexOf(t) > Mr.indexOf(e) ? e : t;
}
function Tt(t) {
  return t === "year" || t === "month" || t === "week";
}
function Gt(t) {
  return Tt(t) || t === "day" ? "date" : "time";
}
function vn(t) {
  return _e("%calendarImpl%")(t);
}
function to(t) {
  return _e("%calendarImpl%")(m(t, T));
}
function Ke(t, e, n = "date") {
  const r = /* @__PURE__ */ Object.create(null), o = vn(t).isoToDate(e, { year: !0, monthCode: !0, day: !0 });
  return r.monthCode = o.monthCode, n !== "month-day" && n !== "date" || (r.day = o.day), n !== "year-month" && n !== "date" || (r.year = o.year), r;
}
function ut(t, e, n, r, o) {
  const i = vn(t).extraFields(n), a = n.concat(r, i), s = /* @__PURE__ */ Object.create(null);
  let c = !1;
  a.sort();
  for (let l = 0; l < a.length; l++) {
    const d = a[l], h = e[d];
    if (h !== void 0) c = !0, s[d] = (0, Ql[d])(h);
    else if (o !== "partial") {
      if (o.includes(d)) throw new TypeError(`required property '${d}' missing or undefined`);
      s[d] = Bl[d];
    }
  }
  if (o === "partial" && !c) throw new TypeError("no supported properties found");
  return s;
}
function Di(t, e = "complete") {
  const n = ["hour", "microsecond", "millisecond", "minute", "nanosecond", "second"];
  let r = !1;
  const o = /* @__PURE__ */ Object.create(null);
  for (let i = 0; i < n.length; i++) {
    const a = n[i], s = t[a];
    s !== void 0 ? (o[a] = U(s), r = !0) : e === "complete" && (o[a] = 0);
  }
  if (!r) throw new TypeError("invalid time-like");
  return o;
}
function br(t, e) {
  if (ue(t)) {
    if (le(t)) return G(O(e)), We(m(t, Y), m(t, T));
    if (q(t)) {
      const c = xt(m(t, X), m(t, S));
      return G(O(e)), We(c.isoDate, m(t, T));
    }
    if (ne(t)) return G(O(e)), We(m(t, re).isoDate, m(t, T));
    const s = io(t);
    return We(pn(s, ut(s, t, ["year", "month", "monthCode", "day"], [], []), G(O(e))), s);
  }
  let { year: n, month: r, day: o, calendar: i, z: a } = jt(ve(t));
  if (a) throw new RangeError("Z designator not supported for PlainDate");
  return i || (i = "iso8601"), i = Qe(i), G(O(e)), We({ year: n, month: r, day: o }, i);
}
function no(t, e, n) {
  return K(pn(t, e, n), Fo(e.hour, e.minute, e.second, e.millisecond, e.microsecond, e.nanosecond, n));
}
function xr(t, e) {
  let n, r, o;
  if (ue(t)) {
    if (ne(t)) return G(O(e)), gt(m(t, re), m(t, T));
    if (q(t)) {
      const s = xt(m(t, X), m(t, S));
      return G(O(e)), gt(s, m(t, T));
    }
    if (le(t)) return G(O(e)), gt(K(m(t, Y), { deltaDays: 0, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }), m(t, T));
    o = io(t);
    const i = ut(o, t, ["year", "month", "monthCode", "day"], ["hour", "minute", "second", "millisecond", "microsecond", "nanosecond"], []), a = G(O(e));
    ({ isoDate: n, time: r } = no(o, i, a));
  } else {
    let i, a, s, c;
    if ({ year: a, month: s, day: c, time: r, calendar: o, z: i } = jt(ve(t)), i) throw new RangeError("Z designator not supported for PlainDateTime");
    r === "start-of-day" && (r = { deltaDays: 0, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }), Gi(a, s, c, r.hour, r.minute, r.second, r.millisecond, r.microsecond, r.nanosecond), o || (o = "iso8601"), o = Qe(o), G(O(e)), n = { year: a, month: s, day: c };
  }
  return gt(K(n, r), o);
}
function bt(t) {
  const e = _e("%Temporal.Duration%");
  if (ce(t)) return new e(m(t, Ye), m(t, Pe), m(t, et), m(t, ze), m(t, Ue), m(t, je), m(t, Ae), m(t, Fe), m(t, qe), m(t, tt));
  if (!ue(t)) return (function(o) {
    const { years: i, months: a, weeks: s, days: c, hours: l, minutes: d, seconds: h, milliseconds: f, microseconds: g, nanoseconds: y } = (function(b) {
      const w = Zl.exec(b);
      if (!w) throw new RangeError(`invalid duration: ${b}`);
      if (w.every(((ae, fe) => fe < 2 || ae === void 0))) throw new RangeError(`invalid duration: ${b}`);
      const x = w[1] === "-" ? -1 : 1, D = w[2] === void 0 ? 0 : U(w[2]) * x, E = w[3] === void 0 ? 0 : U(w[3]) * x, _ = w[4] === void 0 ? 0 : U(w[4]) * x, M = w[5] === void 0 ? 0 : U(w[5]) * x, N = w[6] === void 0 ? 0 : U(w[6]) * x, H = w[7], W = w[8], A = w[9], B = w[10], $ = w[11];
      let z = 0, Q = 0, J = 0;
      if (H !== void 0) {
        if (W ?? A ?? B ?? $) throw new RangeError("only the smallest unit can be fractional");
        J = 3600 * U((H + "000000000").slice(0, 9)) * x;
      } else if (z = W === void 0 ? 0 : U(W) * x, A !== void 0) {
        if (B ?? $) throw new RangeError("only the smallest unit can be fractional");
        J = 60 * U((A + "000000000").slice(0, 9)) * x;
      } else Q = B === void 0 ? 0 : U(B) * x, $ !== void 0 && (J = U(($ + "000000000").slice(0, 9)) * x);
      const he = J % 1e3, L = Math.trunc(J / 1e3) % 1e3, V = Math.trunc(J / 1e6) % 1e3;
      return Q += Math.trunc(J / 1e9) % 60, z += Math.trunc(J / 6e10), Wo(D, E, _, M, N, z, Q, V, L, he), { years: D, months: E, weeks: _, days: M, hours: N, minutes: z, seconds: Q, milliseconds: V, microseconds: L, nanoseconds: he };
    })(o);
    return new (_e("%Temporal.Duration%"))(i, a, s, c, l, d, h, f, g, y);
  })(ve(t));
  const n = { years: 0, months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0, microseconds: 0, nanoseconds: 0 };
  let r = ec(t);
  for (let o = 0; o < Do.length; o++) {
    const i = Do[o], a = r[i];
    a !== void 0 && (n[i] = a);
  }
  return new e(n.years, n.months, n.weeks, n.days, n.hours, n.minutes, n.seconds, n.milliseconds, n.microseconds, n.nanoseconds);
}
function Cr(t) {
  let e;
  if (ue(t)) {
    if (Ce(t) || q(t)) return Rt(m(t, S));
    e = xi(t);
  } else e = t;
  const { year: n, month: r, day: o, time: i, offset: a, z: s } = (function(b) {
    const w = jt(b);
    if (!w.z && !w.offset) throw new RangeError("Temporal.Instant requires a time zone offset");
    return w;
  })(ve(e)), { hour: c = 0, minute: l = 0, second: d = 0, millisecond: h = 0, microsecond: f = 0, nanosecond: g = 0 } = i === "start-of-day" ? {} : i, y = Fr(n, r, o, c, l, d, h, f, g - (s ? 0 : dr(a)));
  return Vn(y.isoDate), Rt(Te(y));
}
function qa(t, e) {
  if (ue(t)) {
    if (at(t)) return G(O(e)), Gn(m(t, Y), m(t, T));
    let s;
    return Xe(t, T) ? s = m(t, T) : (s = t.calendar, s === void 0 && (s = "iso8601"), s = oo(s)), Gn(ko(s, ut(s, t, ["year", "month", "monthCode", "day"], [], []), G(O(e))), s);
  }
  let { month: n, day: r, referenceISOYear: o, calendar: i } = qi(ve(t));
  if (i === void 0 && (i = "iso8601"), i = Qe(i), G(O(e)), i === "iso8601") return Gn({ year: 1972, month: n, day: r }, i);
  let a = { year: o, month: n, day: r };
  return Sn(a), a = ko(i, Ke(i, a, "month-day"), "constrain"), Gn(a, i);
}
function ln(t, e) {
  let n;
  if (ue(t)) {
    if (me(t)) return G(O(e)), Kt(m(t, de));
    if (ne(t)) return G(O(e)), Kt(m(t, re).time);
    if (q(t)) {
      const l = xt(m(t, X), m(t, S));
      return G(O(e)), Kt(l.time);
    }
    const { hour: r, minute: o, second: i, millisecond: a, microsecond: s, nanosecond: c } = Di(t);
    n = Fo(r, o, i, a, s, c, G(O(e)));
  } else n = Xs(ve(t)), G(O(e));
  return Kt(n);
}
function tc(t) {
  return t === void 0 ? { deltaDays: 0, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 } : m(ln(t), de);
}
function Dr(t, e) {
  if (ue(t)) {
    if (De(t)) return G(O(e)), Kn(m(t, Y), m(t, T));
    const s = io(t);
    return Kn(Ur(s, ut(s, t, ["year", "month", "monthCode"], [], []), G(O(e))), s);
  }
  let { year: n, month: r, referenceISODay: o, calendar: i } = Fi(ve(t));
  i === void 0 && (i = "iso8601"), i = Qe(i), G(O(e));
  let a = { year: n, month: r, day: o };
  return Ki(a), a = Ur(i, Ke(i, a, "year-month"), "constrain"), Kn(a, i);
}
function Eo(t, e, n, r, o, i, a, s) {
  if (e === "start-of-day") return an(o, t);
  const c = K(t, e);
  if (n === "wall" || a === "ignore") return Oe(o, c, i);
  if (n === "exact" || a === "use") {
    const h = Fr(t.year, t.month, t.day, e.hour, e.minute, e.second, e.millisecond, e.microsecond, e.nanosecond - r);
    Vn(h.isoDate);
    const f = Te(h);
    return Yt(f), f;
  }
  Vn(t);
  const l = Te(c), d = jr(o, c);
  for (let h = 0; h < d.length; h++) {
    const f = d[h], g = u.toNumber(u.subtract(l, f)), y = dn(g, 6e10, "halfExpand");
    if (g === r || s && y === r) return f;
  }
  if (a === "reject") {
    const h = Ei(r), f = Ar(c, "iso8601", "auto");
    throw new RangeError(`Offset ${h} is invalid for ${f} in ${o}`);
  }
  return dc(d, o, c, i);
}
function Er(t, e) {
  let n, r, o, i, a, s, c, l = !1, d = "option";
  if (ue(t)) {
    if (q(t)) {
      const b = O(e);
      return Rr(b), yo(b, "reject"), G(b), Ne(m(t, S), m(t, X), m(t, T));
    }
    a = io(t);
    const f = ut(a, t, ["year", "month", "monthCode", "day"], ["hour", "minute", "second", "millisecond", "microsecond", "nanosecond", "offset", "timeZone"], ["timeZone"]);
    ({ offset: i, timeZone: o } = f), i === void 0 && (d = "wall");
    const g = O(e);
    s = Rr(g), c = yo(g, "reject");
    const y = G(g);
    ({ isoDate: n, time: r } = no(a, f, y));
  } else {
    let f, g, y, b, w;
    ({ year: y, month: b, day: w, time: r, tzAnnotation: f, offset: i, z: g, calendar: a } = (function(D) {
      const E = jt(D);
      if (!E.tzAnnotation) throw new RangeError("Temporal.ZonedDateTime requires a time zone ID in brackets");
      return E;
    })(ve(t))), o = Ge(f), g ? d = "exact" : i || (d = "wall"), a || (a = "iso8601"), a = Qe(a), l = !0;
    const x = O(e);
    s = Rr(x), c = yo(x, "reject"), G(x), n = { year: y, month: b, day: w };
  }
  let h = 0;
  return d === "option" && (h = dr(i)), Ne(Eo(n, r, d, h, o, s, c, l), o, a);
}
function nc(t, e, n) {
  Sn(e), rn(t), F(t, Y, e), F(t, T, n), F(t, Is, !0);
}
function We(t, e) {
  const n = _e("%Temporal.PlainDate%"), r = Object.create(n.prototype);
  return nc(r, t, e), r;
}
function rc(t, e, n) {
  Nn(e), rn(t), F(t, re, e), F(t, T, n);
}
function gt(t, e) {
  const n = _e("%Temporal.PlainDateTime%"), r = Object.create(n.prototype);
  return rc(r, t, e), r;
}
function oc(t, e, n) {
  Sn(e), rn(t), F(t, Y, e), F(t, T, n), F(t, Ss, !0);
}
function Gn(t, e) {
  const n = _e("%Temporal.PlainMonthDay%"), r = Object.create(n.prototype);
  return oc(r, t, e), r;
}
function ic(t, e) {
  rn(t), F(t, de, e);
}
function Kt(t) {
  const e = _e("%Temporal.PlainTime%"), n = Object.create(e.prototype);
  return ic(n, t), n;
}
function ac(t, e, n) {
  Ki(e), rn(t), F(t, Y, e), F(t, T, n), F(t, Ls, !0);
}
function Kn(t, e) {
  const n = _e("%Temporal.PlainYearMonth%"), r = Object.create(n.prototype);
  return ac(r, t, e), r;
}
function sc(t, e) {
  Yt(e), rn(t), F(t, S, e);
}
function Rt(t) {
  const e = _e("%Temporal.Instant%"), n = Object.create(e.prototype);
  return sc(n, t), n;
}
function cc(t, e, n, r) {
  Yt(e), rn(t), F(t, S, e), F(t, X, n), F(t, T, r);
}
function Ne(t, e, n = "iso8601") {
  const r = _e("%Temporal.ZonedDateTime%"), o = Object.create(r.prototype);
  return cc(o, t, e, n), o;
}
function Za(t) {
  return Ci.filter(((e) => t[e] !== void 0));
}
function _n(t, e, n) {
  const r = Za(n), o = vn(t).fieldKeysToIgnore(r), i = /* @__PURE__ */ Object.create(null), a = Za(e);
  for (let s = 0; s < Ci.length; s++) {
    let c;
    const l = Ci[s];
    a.includes(l) && !o.includes(l) && (c = e[l]), r.includes(l) && (c = n[l]), c !== void 0 && (i[l] = c);
  }
  return i;
}
function lt(t, e, n, r) {
  const o = vn(t).dateAdd(e, n, r);
  return Sn(o), o;
}
function ro(t, e, n, r) {
  return vn(t).dateUntil(e, n, r);
}
function oo(t) {
  if (ue(t) && Xe(t, T)) return m(t, T);
  const e = ve(t);
  try {
    return Qe(e);
  } catch {
  }
  let n;
  try {
    ({ calendar: n } = jt(e));
  } catch {
    try {
      ({ calendar: n } = Xs(e));
    } catch {
      try {
        ({ calendar: n } = Fi(e));
      } catch {
        ({ calendar: n } = qi(e));
      }
    }
  }
  return n || (n = "iso8601"), Qe(n);
}
function io(t) {
  if (Xe(t, T)) return m(t, T);
  const { calendar: e } = t;
  return e === void 0 ? "iso8601" : oo(e);
}
function St(t, e) {
  return Qe(t) === Qe(e);
}
function pn(t, e, n) {
  const r = vn(t);
  r.resolveFields(e, "date");
  const o = r.dateToISO(e, n);
  return Sn(o), o;
}
function Ur(t, e, n) {
  const r = vn(t);
  r.resolveFields(e, "year-month"), e.day = 1;
  const o = r.dateToISO(e, n);
  return Ki(o), o;
}
function ko(t, e, n) {
  const r = vn(t);
  r.resolveFields(e, "month-day");
  const o = r.monthDayToISOReferenceDate(e, n);
  return Sn(o), o;
}
function Ge(t) {
  if (ue(t) && q(t)) return m(t, X);
  const e = ve(t);
  if (e === "UTC") return "UTC";
  const { tzName: n, offsetMinutes: r } = (function(i) {
    const { tzAnnotation: a, offset: s, z: c } = (function(l) {
      if (Qs.test(l)) return { tzAnnotation: l, offset: void 0, z: !1 };
      try {
        const { tzAnnotation: d, offset: h, z: f } = jt(l);
        if (f || d || h) return { tzAnnotation: d, offset: h, z: f };
      } catch {
      }
      Js(l);
    })(i);
    return a ? hn(a) : c ? hn("UTC") : s ? hn(s) : void 0;
  })(e);
  if (r !== void 0) return Zi(r);
  const o = To(n);
  if (!o) throw new RangeError(`Unrecognized time zone ${n}`);
  return o.identifier;
}
function lc(t, e) {
  if (t === e) return !0;
  const n = hn(t).offsetMinutes, r = hn(e).offsetMinutes;
  if (n === void 0 && r === void 0) {
    const o = To(e);
    if (!o) return !1;
    const i = To(t);
    return !!i && i.primaryIdentifier === o.primaryIdentifier;
  }
  return n === r;
}
function Vt(t, e) {
  const n = hn(t).offsetMinutes;
  return n !== void 0 ? 6e10 * n : ki(t, e);
}
function Ei(t) {
  const e = t < 0 ? "-" : "+", n = Math.abs(t), r = Math.floor(n / 36e11), o = Math.floor(n / 6e10) % 60, i = Math.floor(n / 1e9) % 60, a = n % 1e9;
  return `${e}${qo(r, o, i, a, i === 0 && a === 0 ? "minute" : "auto")}`;
}
function xt(t, e) {
  const n = Vt(t, e);
  let { isoDate: { year: r, month: o, day: i }, time: { hour: a, minute: s, second: c, millisecond: l, microsecond: d, nanosecond: h } } = mc(e);
  return Fr(r, o, i, a, s, c, l, d, h + n);
}
function Oe(t, e, n) {
  return dc(jr(t, e), t, e, n);
}
function dc(t, e, n, r) {
  const o = t.length;
  if (o === 1) return t[0];
  if (o) switch (r) {
    case "compatible":
    case "earlier":
      return t[0];
    case "later":
      return t[o - 1];
    case "reject":
      throw new RangeError("multiple instants found");
  }
  if (r === "reject") throw new RangeError("multiple instants found");
  const i = Te(n), a = u.subtract(i, fn);
  Yt(a);
  const s = Vt(e, a), c = u.add(i, fn);
  Yt(c);
  const l = Vt(e, c) - s;
  switch (r) {
    case "earlier": {
      const d = Z.fromComponents(0, 0, 0, 0, 0, -l), h = er(n.time, d);
      return jr(e, K(ot(n.isoDate.year, n.isoDate.month, n.isoDate.day + h.deltaDays), h))[0];
    }
    case "compatible":
    case "later": {
      const d = Z.fromComponents(0, 0, 0, 0, 0, l), h = er(n.time, d), f = jr(e, K(ot(n.isoDate.year, n.isoDate.month, n.isoDate.day + h.deltaDays), h));
      return f[f.length - 1];
    }
  }
}
function jr(t, e) {
  if (t === "UTC") return Vn(e.isoDate), [Te(e)];
  const n = hn(t).offsetMinutes;
  if (n !== void 0) {
    const r = Fr(e.isoDate.year, e.isoDate.month, e.isoDate.day, e.time.hour, e.time.minute - n, e.time.second, e.time.millisecond, e.time.microsecond, e.time.nanosecond);
    Vn(r.isoDate);
    const o = Te(r);
    return Yt(o), [o];
  }
  return Vn(e.isoDate), (function(r, o) {
    let i = Te(o), a = u.subtract(i, fn);
    u.lessThan(a, Pr) && (a = i);
    let s = u.add(i, fn);
    u.greaterThan(s, Qn) && (s = i);
    const c = ki(r, a), l = ki(r, s);
    return (c === l ? [c] : [c, l]).map(((h) => {
      const f = u.subtract(i, u.BigInt(h)), g = (function(y, b) {
        const { epochMilliseconds: w, time: { millisecond: x, microsecond: D, nanosecond: E } } = mc(b), { year: _, month: M, day: N, hour: H, minute: W, second: A } = fc(y, w);
        return Fr(_, M, N, H, W, A, x, D, E);
      })(r, f);
      if (tr(o, g) === 0) return Yt(f), f;
    })).filter(((h) => h !== void 0));
  })(t, e);
}
function an(t, e) {
  const n = K(e, { deltaDays: 0, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }), r = jr(t, n);
  if (r.length) return r[0];
  const o = Te(n), i = u.subtract(o, fn);
  return Yt(i), Wi(t, i);
}
function ao(t) {
  let e;
  return e = t < 0 || t > 9999 ? (t < 0 ? "-" : "+") + zr(Math.abs(t), 6) : zr(t, 4), e;
}
function dt(t) {
  return zr(t, 2);
}
function uc(t, e) {
  let n;
  if (e === "auto") {
    if (t === 0) return "";
    n = zr(t, 9).replace(/0+$/, "");
  } else {
    if (e === 0) return "";
    n = zr(t, 9).slice(0, e);
  }
  return `.${n}`;
}
function qo(t, e, n, r, o) {
  let i = `${dt(t)}:${dt(e)}`;
  return o === "minute" || (i += `:${dt(n)}`, i += uc(r, o)), i;
}
function Ha(t, e, n) {
  let r = e;
  r === void 0 && (r = "UTC");
  const o = m(t, S), i = Ar(xt(r, o), "iso8601", n, "never");
  let a = "Z";
  return e !== void 0 && (a = hc(Vt(r, o))), `${i}${a}`;
}
function fo(t, e) {
  const n = m(t, Ye), r = m(t, Pe), o = m(t, et), i = m(t, ze), a = m(t, Ue), s = m(t, je), c = Mo(t);
  let l = "";
  n !== 0 && (l += `${Math.abs(n)}Y`), r !== 0 && (l += `${Math.abs(r)}M`), o !== 0 && (l += `${Math.abs(o)}W`), i !== 0 && (l += `${Math.abs(i)}D`);
  let d = "";
  a !== 0 && (d += `${Math.abs(a)}H`), s !== 0 && (d += `${Math.abs(s)}M`);
  const h = Z.fromComponents(0, 0, m(t, Ae), m(t, Fe), m(t, qe), m(t, tt));
  h.isZero() && !["second", "millisecond", "microsecond", "nanosecond"].includes(Wt(t)) && e === "auto" || (d += `${Math.abs(h.sec)}${uc(Math.abs(h.subsec), e)}S`);
  let f = `${c < 0 ? "-" : ""}P${l}`;
  return d && (f = `${f}T${d}`), f;
}
function Wa(t, e = "auto") {
  const { year: n, month: r, day: o } = m(t, Y);
  return `${ao(n)}-${dt(r)}-${dt(o)}${Qr(m(t, T), e)}`;
}
function Ga({ hour: t, minute: e, second: n, millisecond: r, microsecond: o, nanosecond: i }, a) {
  return qo(t, e, n, 1e6 * r + 1e3 * o + i, a);
}
function Ar(t, e, n, r = "auto") {
  const { isoDate: { year: o, month: i, day: a }, time: { hour: s, minute: c, second: l, millisecond: d, microsecond: h, nanosecond: f } } = t;
  return `${ao(o)}-${dt(i)}-${dt(a)}T${qo(s, c, l, 1e6 * d + 1e3 * h + f, n)}${Qr(e, r)}`;
}
function Ka(t, e = "auto") {
  const { year: n, month: r, day: o } = m(t, Y);
  let i = `${dt(r)}-${dt(o)}`;
  const a = m(t, T);
  e !== "always" && e !== "critical" && a === "iso8601" || (i = `${ao(n)}-${i}`);
  const s = Qr(a, e);
  return s && (i += s), i;
}
function Va(t, e = "auto") {
  const { year: n, month: r, day: o } = m(t, Y);
  let i = `${ao(n)}-${dt(r)}`;
  const a = m(t, T);
  e !== "always" && e !== "critical" && a === "iso8601" || (i += `-${dt(o)}`);
  const s = Qr(a, e);
  return s && (i += s), i;
}
function Xa(t, e, n = "auto", r = "auto", o = "auto", i = void 0) {
  let a = m(t, S);
  if (i) {
    const { unit: d, increment: h, roundingMode: f } = i;
    a = Ni(a, h, d, f);
  }
  const s = m(t, X), c = Vt(s, a);
  let l = Ar(xt(s, a), "iso8601", e, "never");
  return o !== "never" && (l += hc(c)), r !== "never" && (l += `[${r === "critical" ? "!" : ""}${s}]`), l += Qr(m(t, T), n), l;
}
function Qa(t) {
  return Bs.test(t);
}
function dr(t) {
  const e = rd.exec(t);
  if (!e) throw new RangeError(`invalid time zone offset: ${t}; must match ±HH:MM[:SS.SSSSSSSSS]`);
  return (e[1] === "-" ? -1 : 1) * (1e9 * (60 * (60 * +e[2] + +(e[3] || 0)) + +(e[4] || 0)) + +((e[5] || 0) + "000000000").slice(0, 9));
}
let xn;
const td = Object.assign(/* @__PURE__ */ Object.create(null), { "/": !0, "-": !0, _: !0 });
function To(t) {
  var i;
  if (xn === void 0) {
    const a = (i = Intl.supportedValuesOf) == null ? void 0 : i.call(Intl, "timeZone");
    if (a) {
      xn = /* @__PURE__ */ new Map();
      for (let s = 0; s < a.length; s++) {
        const c = a[s];
        xn.set(qr(c), c);
      }
    } else xn = null;
  }
  const e = qr(t);
  let n = xn == null ? void 0 : xn.get(e);
  if (n) return { identifier: n, primaryIdentifier: n };
  try {
    n = Vs(t).resolvedOptions().timeZone;
  } catch {
    return;
  }
  if (e === "antarctica/south_pole" && (n = "Antarctica/McMurdo"), Xl.has(t)) throw new RangeError(`${t} is a legacy time zone identifier from ICU. Use ${n} instead`);
  const r = [...e].map(((a, s) => s === 0 || td[e[s - 1]] ? a.toUpperCase() : a)).join("").split("/");
  if (r.length === 1) return e === "gb-eire" ? { identifier: "GB-Eire", primaryIdentifier: n } : { identifier: e.length <= 3 || /[-0-9]/.test(e) ? e.toUpperCase() : r[0], primaryIdentifier: n };
  if (r[0] === "Etc") return { identifier: `Etc/${["Zulu", "Greenwich", "Universal"].includes(r[1]) ? r[1] : r[1].toUpperCase()}`, primaryIdentifier: n };
  if (r[0] === "Us") return { identifier: `US/${r[1]}`, primaryIdentifier: n };
  const o = /* @__PURE__ */ new Map([["Act", "ACT"], ["Lhi", "LHI"], ["Nsw", "NSW"], ["Dar_Es_Salaam", "Dar_es_Salaam"], ["Port_Of_Spain", "Port_of_Spain"], ["Port-Au-Prince", "Port-au-Prince"], ["Isle_Of_Man", "Isle_of_Man"], ["Comodrivadavia", "ComodRivadavia"], ["Knox_In", "Knox_IN"], ["Dumontdurville", "DumontDUrville"], ["Mcmurdo", "McMurdo"], ["Denoronha", "DeNoronha"], ["Easterisland", "EasterIsland"], ["Bajanorte", "BajaNorte"], ["Bajasur", "BajaSur"]]);
  return r[1] = o.get(r[1]) ?? r[1], r.length > 2 && (r[2] = o.get(r[2]) ?? r[2]), { identifier: r.join("/"), primaryIdentifier: n };
}
function kn(t, e) {
  const { year: n, month: r, day: o, hour: i, minute: a, second: s } = fc(t, e);
  let c = e % 1e3;
  return c < 0 && (c += 1e3), 1e6 * (Hi({ isoDate: { year: n, month: r, day: o }, time: { hour: i, minute: a, second: s, millisecond: c } }) - e);
}
function ki(t, e) {
  return kn(t, Ct(e, "floor"));
}
function Zi(t) {
  const e = t < 0 ? "-" : "+", n = Math.abs(t);
  return `${e}${qo(Math.floor(n / 60), n % 60, 0, 0, "minute")}`;
}
function hc(t) {
  return Zi(dn(t, Hl, "halfExpand") / 6e10);
}
function Hi({ isoDate: { year: t, month: e, day: n }, time: { hour: r, minute: o, second: i, millisecond: a } }) {
  const s = t % 400, c = (t - s) / 400, l = /* @__PURE__ */ new Date();
  return l.setUTCHours(r, o, i, a), l.setUTCFullYear(s, e - 1, n), l.getTime() + Kl * c;
}
function Te(t) {
  const e = Hi(t), n = 1e3 * t.time.microsecond + t.time.nanosecond;
  return u.add($t(e), u.BigInt(n));
}
function mc(t) {
  let e = Ct(t, "trunc"), n = u.toNumber(u.remainder(t, Vr));
  n < 0 && (n += 1e6, e -= 1);
  const r = Math.floor(n / 1e3) % 1e3, o = n % 1e3, i = new Date(e);
  return { epochMilliseconds: e, isoDate: { year: i.getUTCFullYear(), month: i.getUTCMonth() + 1, day: i.getUTCDate() }, time: { hour: i.getUTCHours(), minute: i.getUTCMinutes(), second: i.getUTCSeconds(), millisecond: i.getUTCMilliseconds(), microsecond: r, nanosecond: o } };
}
function Wi(t, e) {
  if (t === "UTC") return null;
  const n = Ct(e, "floor");
  if (n < _r) return Wi(t, $t(_r));
  const r = Date.now(), o = Math.max(n, r) + 366 * gn * 3;
  let i = n, a = kn(t, i), s = i, c = a;
  for (; a === c && i < o; ) {
    if (s = i + 2 * gn * 7, s > Ks) return null;
    c = kn(t, s), a === c && (i = s);
  }
  return a === c ? null : $t(Ec(((l) => kn(t, l)), i, s, a, c));
}
function Ti(t, e) {
  if (t === "UTC") return null;
  const n = Ct(e, "ceil"), r = Date.now(), o = r + 366 * gn * 3;
  if (n > o) {
    const l = Ti(t, $t(o));
    if (l === null || u.lessThan(l, $t(r))) return l;
  }
  if (t === "Africa/Casablanca" || t === "Africa/El_Aaiun") {
    const l = Date.UTC(2088, 0, 1);
    if (l < n) return Ti(t, $t(l));
  }
  let i = n - 1;
  if (i < _r) return null;
  let a = kn(t, i), s = i, c = a;
  for (; a === c && i > _r; ) {
    if (s = i - 2 * gn * 7, s < _r) return null;
    c = kn(t, s), a === c && (i = s);
  }
  return a === c ? null : $t(Ec(((l) => kn(t, l)), s, i, c, a));
}
function fc(t, e) {
  return (function(n) {
    const r = n.split(/[^\w]+/);
    if (r.length !== 7) throw new RangeError(`expected 7 parts in "${n}`);
    const o = +r[0], i = +r[1];
    let a = +r[2];
    const s = r[3];
    if (s[0] === "b" || s[0] === "B") a = 1 - a;
    else if (s[0] !== "a" && s[0] !== "A") throw new RangeError(`Unknown era ${s} in "${n}`);
    const c = r[4] === "24" ? 0 : +r[4], l = +r[5], d = +r[6];
    if (!(Number.isFinite(a) && Number.isFinite(o) && Number.isFinite(i) && Number.isFinite(c) && Number.isFinite(l) && Number.isFinite(d))) throw new RangeError(`Invalid number in "${n}`);
    return { year: a, month: o, day: i, hour: c, minute: l, second: d };
  })(Vs(t).format(e));
}
function _o(t) {
  return t !== void 0 && !(t % 4 != 0 || t % 100 == 0 && t % 400 != 0);
}
function Tn(t, e) {
  return { standard: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], leapyear: [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] }[_o(t) ? "leapyear" : "standard"][e - 1];
}
function Mo(t) {
  const e = [m(t, Ye), m(t, Pe), m(t, et), m(t, ze), m(t, Ue), m(t, je), m(t, Ae), m(t, Fe), m(t, qe), m(t, tt)];
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    if (r !== 0) return r < 0 ? -1 : 1;
  }
  return 0;
}
function Zo(t) {
  const e = ["years", "months", "weeks", "days"];
  for (let n = 0; n < e.length; n++) {
    const r = t[e[n]];
    if (r !== 0) return r < 0 ? -1 : 1;
  }
  return 0;
}
function gc(t) {
  const e = Zo(t.date);
  return e !== 0 ? e : t.time.sign();
}
function En(t, e) {
  let n = t, r = e;
  if (!Number.isFinite(n) || !Number.isFinite(r)) throw new RangeError("infinity is out of range");
  return r -= 1, n += Math.floor(r / 12), r %= 12, r < 0 && (r += 12), r += 1, { year: n, month: r };
}
function ot(t, e, n) {
  let r = t, o = e, i = n;
  if (!Number.isFinite(i)) throw new RangeError("infinity is out of range");
  ({ year: r, month: o } = En(r, o));
  const a = 146097;
  if (Math.abs(i) > a) {
    const l = Math.trunc(i / a);
    r += 400 * l, i -= l * a;
  }
  let s = 0, c = o > 2 ? r : r - 1;
  for (; s = _o(c) ? 366 : 365, i < -s; ) r -= 1, c -= 1, i += s;
  for (c += 1; s = _o(c) ? 366 : 365, i > s; ) r += 1, c += 1, i -= s;
  for (; i < 1; ) ({ year: r, month: o } = En(r, o - 1)), i += Tn(r, o);
  for (; i > Tn(r, o); ) i -= Tn(r, o), { year: r, month: o } = En(r, o + 1);
  return { year: r, month: o, day: i };
}
function Fr(t, e, n, r, o, i, a, s, c) {
  const l = sn(r, o, i, a, s, c);
  return K(ot(t, e, n + l.deltaDays), l);
}
function sn(t, e, n, r, o, i) {
  let a, s = t, c = e, l = n, d = r, h = o, f = i;
  ({ div: a, mod: f } = Wn(f, 3)), h += a, f < 0 && (h -= 1, f += 1e3), { div: a, mod: h } = Wn(h, 3), d += a, h < 0 && (d -= 1, h += 1e3), l += Math.trunc(d / 1e3), d %= 1e3, d < 0 && (l -= 1, d += 1e3), c += Math.trunc(l / 60), l %= 60, l < 0 && (c -= 1, l += 60), s += Math.trunc(c / 60), c %= 60, c < 0 && (s -= 1, c += 60);
  let g = Math.trunc(s / 24);
  return s %= 24, s < 0 && (g -= 1, s += 24), g += 0, s += 0, c += 0, l += 0, d += 0, h += 0, f += 0, { deltaDays: g, hour: s, minute: c, second: l, millisecond: d, microsecond: h, nanosecond: f };
}
function Ba(t, e) {
  const n = Re(t, 0);
  if (Zo(n) === 0) return t.days;
  const r = m(e, Y), o = lt(m(e, T), r, n, "constrain"), i = Rn(r.year, r.month - 1, r.day), a = Rn(o.year, o.month - 1, o.day) - i;
  return t.days + a;
}
function it(t) {
  return new (_e("%Temporal.Duration%"))(-m(t, Ye), -m(t, Pe), -m(t, et), -m(t, ze), -m(t, Ue), -m(t, je), -m(t, Ae), -m(t, Fe), -m(t, qe), -m(t, tt));
}
function Ze(t, e, n) {
  return Math.min(n, Math.max(e, t));
}
function pc(t, e, n) {
  const r = Ze(e, 1, 12);
  return { year: t, month: r, day: Ze(n, 1, Tn(t, r)) };
}
function be(t, e, n) {
  if (t < e || t > n) throw new RangeError(`value out of range: ${e} <= ${t} <= ${n}`);
}
function Mn(t, e, n) {
  be(e, 1, 12), be(n, 1, Tn(t, e));
}
function Sn(t) {
  Nn(K(t, { deltaDays: 0, hour: 12, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }));
}
function Ho(t, e, n, r, o, i) {
  be(t, 0, 23), be(e, 0, 59), be(n, 0, 59), be(r, 0, 999), be(o, 0, 999), be(i, 0, 999);
}
function Gi(t, e, n, r, o, i, a, s, c) {
  Mn(t, e, n), Ho(r, o, i, a, s, c);
}
function Nn(t) {
  const e = Te(t);
  (u.lessThan(e, Wl) || u.greaterThan(e, Gl)) && Yt(e);
}
function _i(t) {
  Te(t);
}
function Yt(t) {
  if (u.lessThan(t, Pr) || u.greaterThan(t, Qn)) throw new RangeError("date/time value is outside of supported range");
}
function Ki({ year: t, month: e }) {
  be(t, za, Ua), t === za ? be(e, 4, 12) : t === Ua && be(e, 1, 9);
}
function Wo(t, e, n, r, o, i, a, s, c, l) {
  let d = 0;
  const h = [t, e, n, r, o, i, a, s, c, l];
  for (let x = 0; x < h.length; x++) {
    const D = h[x];
    if (D === 1 / 0 || D === -1 / 0) throw new RangeError("infinite values not allowed as duration fields");
    if (D !== 0) {
      const E = D < 0 ? -1 : 1;
      if (d !== 0 && E !== d) throw new RangeError("mixed-sign values not allowed as duration fields");
      d = E;
    }
  }
  if (Math.abs(t) >= 2 ** 32 || Math.abs(e) >= 2 ** 32 || Math.abs(n) >= 2 ** 32) throw new RangeError("years, months, and weeks must be < 2³²");
  const f = Wn(s, 3), g = Wn(c, 6), y = Wn(l, 9), b = Wn(1e6 * f.mod + 1e3 * g.mod + y.mod, 9).div, w = 86400 * r + 3600 * o + 60 * i + a + f.div + g.div + y.div + b;
  if (!Number.isSafeInteger(w)) throw new RangeError("total of duration time units cannot exceed 9007199254740991.999999999 s");
}
function Hn(t) {
  return { date: { years: m(t, Ye), months: m(t, Pe), weeks: m(t, et), days: m(t, ze) }, time: Z.fromComponents(m(t, Ue), m(t, je), m(t, Ae), m(t, Fe), m(t, qe), m(t, tt)) };
}
function Ot(t) {
  const e = Z.fromComponents(m(t, Ue), m(t, je), m(t, Ae), m(t, Fe), m(t, qe), m(t, tt)).add24HourDays(m(t, ze));
  return { date: { years: m(t, Ye), months: m(t, Pe), weeks: m(t, et), days: 0 }, time: e };
}
function yc(t) {
  const e = Ot(t), n = Math.trunc(e.time.sec / 86400);
  return Wo(e.date.years, e.date.months, e.date.weeks, n, 0, 0, 0, 0, 0, 0), { ...e.date, days: n };
}
function pt(t, e) {
  const n = t.time.sign();
  let r = t.time.abs().subsec, o = 0, i = 0, a = t.time.abs().sec, s = 0, c = 0, l = 0;
  switch (e) {
    case "year":
    case "month":
    case "week":
    case "day":
      o = Math.trunc(r / 1e3), r %= 1e3, i = Math.trunc(o / 1e3), o %= 1e3, a += Math.trunc(i / 1e3), i %= 1e3, s = Math.trunc(a / 60), a %= 60, c = Math.trunc(s / 60), s %= 60, l = Math.trunc(c / 24), c %= 24;
      break;
    case "hour":
      o = Math.trunc(r / 1e3), r %= 1e3, i = Math.trunc(o / 1e3), o %= 1e3, a += Math.trunc(i / 1e3), i %= 1e3, s = Math.trunc(a / 60), a %= 60, c = Math.trunc(s / 60), s %= 60;
      break;
    case "minute":
      o = Math.trunc(r / 1e3), r %= 1e3, i = Math.trunc(o / 1e3), o %= 1e3, a += Math.trunc(i / 1e3), i %= 1e3, s = Math.trunc(a / 60), a %= 60;
      break;
    case "second":
      o = Math.trunc(r / 1e3), r %= 1e3, i = Math.trunc(o / 1e3), o %= 1e3, a += Math.trunc(i / 1e3), i %= 1e3;
      break;
    case "millisecond":
      o = Math.trunc(r / 1e3), r %= 1e3, i = ri(a, 3, Math.trunc(o / 1e3)), o %= 1e3, a = 0;
      break;
    case "microsecond":
      o = ri(a, 6, Math.trunc(r / 1e3)), r %= 1e3, a = 0;
      break;
    case "nanosecond":
      r = ri(a, 9, r), a = 0;
  }
  return new (_e("%Temporal.Duration%"))(t.date.years, t.date.months, t.date.weeks, t.date.days + n * l, n * c, n * s, n * a, n * i, n * o, n * r);
}
function Qt(t, e) {
  return Zo(t), e.sign(), { date: t, time: e };
}
function Rn(t, e, n) {
  return Hi({ isoDate: { year: t, month: e + 1, day: n }, time: { hour: 0, minute: 0, second: 0, millisecond: 0 } }) / gn;
}
function Vn({ year: t, month: e, day: n }) {
  if (Math.abs(Rn(t, e - 1, n)) > 1e8) throw new RangeError("date/time value is outside the supported range");
}
function Vi(t, e) {
  const n = e.hour - t.hour, r = e.minute - t.minute, o = e.second - t.second, i = e.millisecond - t.millisecond, a = e.microsecond - t.microsecond, s = e.nanosecond - t.nanosecond;
  return Z.fromComponents(n, r, o, i, a, s);
}
function Xi(t, e, n, r, o) {
  let i = Z.fromEpochNsDiff(e, t);
  return i = No(i, n, r, o), Qt({ years: 0, months: 0, weeks: 0, days: 0 }, i);
}
function vc(t, e, n, r) {
  _i(t), _i(e);
  let o = Vi(t.time, e.time);
  const i = o.sign(), a = Pt(t.isoDate, e.isoDate);
  let s = e.isoDate;
  a === i && (s = ot(s.year, s.month, s.day + i), o = o.add24HourDays(-i));
  const c = Xt("day", r), l = ro(n, t.isoDate, s, c);
  return r !== c && (o = o.add24HourDays(l.days), l.days = 0), Qt(l, o);
}
function wc(t, e, n, r, o) {
  const i = u.subtract(e, t);
  if (u.equal(i, st)) return { date: { years: 0, months: 0, weeks: 0, days: 0 }, time: Z.ZERO };
  const a = u.lessThan(i, st) ? -1 : 1, s = xt(n, t), c = xt(n, e);
  let l, d = 0, h = a === 1 ? 2 : 1, f = Vi(s.time, c.time);
  for (f.sign() === -a && d++; d <= h; d++) {
    l = K(ot(c.isoDate.year, c.isoDate.month, c.isoDate.day - d * a), s.time);
    const y = Oe(n, l, "compatible");
    if (f = Z.fromEpochNsDiff(e, y), f.sign() !== -a) break;
  }
  const g = Xt("day", o);
  return Qt(ro(r, s.isoDate, l.isoDate, g), f);
}
function bc(t, e, n, r, o, i, a, s, c) {
  let l, d, h, f, g = e;
  switch (s) {
    case "year": {
      const z = dn(g.date.years, a, "trunc");
      l = z, d = z + a * t, h = { years: l, months: 0, weeks: 0, days: 0 }, f = { ...h, years: d };
      break;
    }
    case "month": {
      const z = dn(g.date.months, a, "trunc");
      l = z, d = z + a * t, h = Re(g.date, 0, 0, l), f = Re(g.date, 0, 0, d);
      break;
    }
    case "week": {
      const z = Re(g.date, 0, 0), Q = lt(i, r.isoDate, z, "constrain"), J = ro(i, Q, ot(Q.year, Q.month, Q.day + g.date.days), "week"), he = dn(g.date.weeks + J.weeks, a, "trunc");
      l = he, d = he + a * t, h = Re(g.date, 0, l), f = Re(g.date, 0, d);
      break;
    }
    case "day": {
      const z = dn(g.date.days, a, "trunc");
      l = z, d = z + a * t, h = Re(g.date, l), f = Re(g.date, d);
      break;
    }
  }
  const y = lt(i, r.isoDate, h, "constrain"), b = lt(i, r.isoDate, f, "constrain");
  let w, x;
  const D = K(y, r.time), E = K(b, r.time);
  o ? (w = Oe(o, D, "compatible"), x = Oe(o, E, "compatible")) : (w = Te(D), x = Te(E));
  const _ = Z.fromEpochNsDiff(n, w), M = Z.fromEpochNsDiff(x, w), N = Po(c, t < 0 ? "negative" : "positive"), H = _.add(_).abs().subtract(M.abs()).sign(), W = Math.abs(l) / a % 2 == 0, A = _.isZero() ? Math.abs(l) : _.cmp(M) ? zo(Math.abs(l), Math.abs(d), H, W, N) : Math.abs(d), B = new Z(u.add(u.multiply(M.totalNs, u.BigInt(l)), u.multiply(_.totalNs, u.BigInt(a * t)))).fdiv(M.totalNs), $ = A === Math.abs(d);
  return g = { date: $ ? f : h, time: Z.ZERO }, { nudgeResult: { duration: g, nudgedEpochNs: $ ? x : w, didExpandCalendarUnit: $ }, total: B };
}
function Go(t, e, n, r, o, i, a, s, c) {
  let l = t;
  const d = Tt(s) || r && s === "day", h = gc(l) < 0 ? -1 : 1;
  let f;
  return d ? { nudgeResult: f } = bc(h, l, e, n, r, o, a, s, c) : f = r ? (function(g, y, b, w, x, D, E, _) {
    let M = y;
    const N = lt(x, b.isoDate, M.date, "constrain"), H = K(N, b.time), W = K(ot(N.year, N.month, N.day + g), b.time), A = Oe(w, H, "compatible"), B = Oe(w, W, "compatible"), $ = Z.fromEpochNsDiff(B, A);
    if ($.sign() !== g) throw new RangeError("time zone returned inconsistent Instants");
    const z = u.BigInt(Jn[E] * D);
    let Q = M.time.round(z, _);
    const J = Q.subtract($), he = J.sign() !== -g;
    let L, V;
    return he ? (L = g, Q = J.round(z, _), V = Q.addToEpochNs(B)) : (L = 0, V = Q.addToEpochNs(A)), { duration: Qt(Re(M.date, M.date.days + L), Q), nudgedEpochNs: V, didExpandCalendarUnit: he };
  })(h, l, n, r, o, a, s, c) : (function(g, y, b, w, x, D) {
    let E = g;
    const _ = E.time.add24HourDays(E.date.days), M = _.round(u.BigInt(w * Jn[x]), D), N = M.subtract(_), { quotient: H } = _.divmod(Co), { quotient: W } = M.divmod(Co), A = Math.sign(W - H) === _.sign(), B = N.addToEpochNs(y);
    let $ = 0, z = M;
    return Gt(b) === "date" && ($ = W, z = M.add(Z.fromComponents(24 * -W, 0, 0, 0, 0, 0))), { duration: { date: Re(E.date, $), time: z }, nudgedEpochNs: B, didExpandCalendarUnit: A };
  })(l, e, i, a, s, c), l = f.duration, f.didExpandCalendarUnit && s !== "week" && (l = (function(g, y, b, w, x, D, E, _) {
    let M = y;
    if (_ === E) return M;
    const N = Mr.indexOf(E);
    for (let H = Mr.indexOf(_) - 1; H >= N; H--) {
      const W = Mr[H];
      if (W === "week" && E !== "week") continue;
      let A;
      switch (W) {
        case "year":
          A = { years: M.date.years + g, months: 0, weeks: 0, days: 0 };
          break;
        case "month": {
          const z = M.date.months + g;
          A = Re(M.date, 0, 0, z);
          break;
        }
        case "week": {
          const z = M.date.weeks + g;
          A = Re(M.date, 0, z);
          break;
        }
      }
      const B = K(lt(D, w.isoDate, A, "constrain"), w.time);
      let $;
      if ($ = x ? Oe(x, B, "compatible") : Te(B), bo(b, $) === -g) break;
      M = { date: A, time: Z.ZERO };
    }
    return M;
  })(h, l, f.nudgedEpochNs, n, r, o, i, Xt(s, "day"))), l;
}
function Ja(t, e, n, r, o, i) {
  return Tt(i) || r && i === "day" ? bc(gc(t) < 0 ? -1 : 1, t, e, n, r, o, 1, i, "trunc").total : Or(t.time.add24HourDays(t.date.days), i);
}
function xc(t, e, n, r, o, i, a) {
  if (tr(t, e) == 0) return { date: { years: 0, months: 0, weeks: 0, days: 0 }, time: Z.ZERO };
  Nn(t), Nn(e);
  const s = vc(t, e, n, r);
  return i === "nanosecond" && o === 1 ? s : Go(s, Te(e), t, null, n, r, o, i, a);
}
function Cc(t, e, n, r, o, i, a, s) {
  if (Gt(o) === "time") return Xi(t, e, i, a, s);
  const c = wc(t, e, n, r, o);
  return a === "nanosecond" && i === 1 ? c : Go(c, e, xt(n, t), n, r, o, i, a, s);
}
function ur(t, e, n, r, o, i) {
  const a = Bn.reduce(((g, y) => {
    const b = y[0], w = y[1], x = y[2];
    return n !== "datetime" && x !== n || r.includes(w) || g.push(w, b), g;
  }), []);
  let s = rt(e, "largestUnit", n, "auto");
  if (r.includes(s)) throw new RangeError(`largestUnit must be one of ${a.join(", ")}, not ${s}`);
  const c = cr(e);
  let l = Et(e, "trunc");
  t === "since" && (l = (function(g) {
    switch (g) {
      case "ceil":
        return "floor";
      case "floor":
        return "ceil";
      case "halfCeil":
        return "halfFloor";
      case "halfFloor":
        return "halfCeil";
      default:
        return g;
    }
  })(l));
  const d = rt(e, "smallestUnit", n, o);
  if (r.includes(d)) throw new RangeError(`smallestUnit must be one of ${a.join(", ")}, not ${d}`);
  const h = Xt(i, d);
  if (s === "auto" && (s = h), Xt(s, d) !== s) throw new RangeError(`largestUnit ${s} cannot be smaller than smallestUnit ${d}`);
  const f = { hour: 24, minute: 60, second: 60, millisecond: 1e3, microsecond: 1e3, nanosecond: 1e3 }[d];
  return f !== void 0 && lr(c, f, !1), { largestUnit: s, roundingIncrement: c, roundingMode: l, smallestUnit: d };
}
function es(t, e, n, r) {
  const o = Cr(n), i = ur(t, O(r), "time", [], "nanosecond", "second");
  let a = pt(Xi(m(e, S), m(o, S), i.roundingIncrement, i.smallestUnit, i.roundingMode), i.largestUnit);
  return t === "since" && (a = it(a)), a;
}
function ts(t, e, n, r) {
  const o = br(n), i = m(e, T), a = m(o, T);
  if (!St(i, a)) throw new RangeError(`cannot compute difference between dates of ${i} and ${a} calendars`);
  const s = ur(t, O(r), "date", [], "day", "day"), c = _e("%Temporal.Duration%"), l = m(e, Y), d = m(o, Y);
  if (Pt(l, d) === 0) return new c();
  let h = { date: ro(i, l, d, s.largestUnit), time: Z.ZERO };
  if (s.smallestUnit !== "day" || s.roundingIncrement !== 1) {
    const g = K(l, { deltaDays: 0, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
    h = Go(h, Te(K(d, { deltaDays: 0, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 })), g, null, i, s.largestUnit, s.roundingIncrement, s.smallestUnit, s.roundingMode);
  }
  let f = pt(h, "day");
  return t === "since" && (f = it(f)), f;
}
function ns(t, e, n, r) {
  const o = xr(n), i = m(e, T), a = m(o, T);
  if (!St(i, a)) throw new RangeError(`cannot compute difference between dates of ${i} and ${a} calendars`);
  const s = ur(t, O(r), "datetime", [], "nanosecond", "day"), c = _e("%Temporal.Duration%"), l = m(e, re), d = m(o, re);
  if (tr(l, d) === 0) return new c();
  let h = pt(xc(l, d, i, s.largestUnit, s.roundingIncrement, s.smallestUnit, s.roundingMode), s.largestUnit);
  return t === "since" && (h = it(h)), h;
}
function rs(t, e, n, r) {
  const o = ln(n), i = ur(t, O(r), "time", [], "nanosecond", "hour");
  let a = Vi(m(e, de), m(o, de));
  a = No(a, i.roundingIncrement, i.smallestUnit, i.roundingMode);
  let s = pt(Qt({ years: 0, months: 0, weeks: 0, days: 0 }, a), i.largestUnit);
  return t === "since" && (s = it(s)), s;
}
function os(t, e, n, r) {
  const o = Dr(n), i = m(e, T), a = m(o, T);
  if (!St(i, a)) throw new RangeError(`cannot compute difference between months of ${i} and ${a} calendars`);
  const s = ur(t, O(r), "date", ["week", "day"], "month", "year"), c = _e("%Temporal.Duration%");
  if (Pt(m(e, Y), m(o, Y)) == 0) return new c();
  const l = Ke(i, m(e, Y), "year-month");
  l.day = 1;
  const d = pn(i, l, "constrain"), h = Ke(i, m(o, Y), "year-month");
  h.day = 1;
  const f = pn(i, h, "constrain");
  let g = { date: Re(ro(i, d, f, s.largestUnit), 0, 0), time: Z.ZERO };
  if (s.smallestUnit !== "month" || s.roundingIncrement !== 1) {
    const b = K(d, { deltaDays: 0, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
    g = Go(g, Te(K(f, { deltaDays: 0, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 })), b, null, i, s.largestUnit, s.roundingIncrement, s.smallestUnit, s.roundingMode);
  }
  let y = pt(g, "day");
  return t === "since" && (y = it(y)), y;
}
function is(t, e, n, r) {
  const o = Er(n), i = m(e, T), a = m(o, T);
  if (!St(i, a)) throw new RangeError(`cannot compute difference between dates of ${i} and ${a} calendars`);
  const s = ur(t, O(r), "datetime", [], "nanosecond", "hour"), c = m(e, S), l = m(o, S), d = _e("%Temporal.Duration%");
  let h;
  if (Gt(s.largestUnit) !== "date") h = pt(Xi(c, l, s.roundingIncrement, s.smallestUnit, s.roundingMode), s.largestUnit);
  else {
    const f = m(e, X);
    if (!lc(f, m(o, X))) throw new RangeError("When calculating difference between time zones, largestUnit must be 'hours' or smaller because day lengths can vary between time zones due to DST or time zone offset changes.");
    if (u.equal(c, l)) return new d();
    h = pt(Cc(c, l, f, i, s.largestUnit, s.roundingIncrement, s.smallestUnit, s.roundingMode), "hour");
  }
  return t === "since" && (h = it(h)), h;
}
function er({ hour: t, minute: e, second: n, millisecond: r, microsecond: o, nanosecond: i }, a) {
  let s = n, c = i;
  return s += a.sec, c += a.subsec, sn(t, e, s, r, o, c);
}
function Mi(t, e) {
  const n = e.addToEpochNs(t);
  return Yt(n), n;
}
function kr(t, e, n, r, o = "constrain") {
  if (Zo(r.date) === 0) return Mi(t, r.time);
  const i = xt(e, t);
  return Mi(Oe(e, K(lt(n, i.isoDate, r.date, o), i.time), "compatible"), r.time);
}
function as(t, e, n) {
  let r = bt(n);
  t === "subtract" && (r = it(r));
  const o = Xt(Wt(e), Wt(r));
  if (Tt(o)) throw new RangeError("For years, months, or weeks arithmetic, use date arithmetic relative to a starting point");
  const i = Ot(e), a = Ot(r);
  return pt(Qt({ years: 0, months: 0, weeks: 0, days: 0 }, i.time.add(a.time)), o);
}
function ss(t, e, n) {
  let r = bt(n);
  t === "subtract" && (r = it(r));
  const o = Wt(r);
  if (Gt(o) === "date") throw new RangeError(`Duration field ${o} not supported by Temporal.Instant. Try Temporal.ZonedDateTime instead.`);
  const i = Ot(r);
  return Rt(Mi(m(e, S), i.time));
}
function cs(t, e, n, r) {
  const o = m(e, T);
  let i = bt(n);
  t === "subtract" && (i = it(i));
  const a = yc(i), s = G(O(r));
  return We(lt(o, m(e, Y), a, s), o);
}
function ls(t, e, n, r) {
  let o = bt(n);
  t === "subtract" && (o = it(o));
  const i = G(O(r)), a = m(e, T), s = Ot(o), c = m(e, re), l = er(c.time, s.time), d = Re(s.date, l.deltaDays);
  return Wo(d.years, d.months, d.weeks, d.days, 0, 0, 0, 0, 0, 0), gt(K(lt(a, c.isoDate, d, i), l), a);
}
function ds(t, e, n) {
  let r = bt(n);
  t === "subtract" && (r = it(r));
  const o = Ot(r), { hour: i, minute: a, second: s, millisecond: c, microsecond: l, nanosecond: d } = er(m(e, de), o.time);
  return Kt(Fo(i, a, s, c, l, d, "reject"));
}
function us(t, e, n, r) {
  let o = bt(n);
  t === "subtract" && (o = it(o));
  const i = G(O(r)), a = Mo(o), s = m(e, T), c = Ke(s, m(e, Y), "year-month");
  c.day = 1;
  let l = pn(s, c, "constrain");
  if (a < 0) {
    const h = lt(s, l, { months: 1 }, "constrain");
    l = ot(h.year, h.month, h.day - 1);
  }
  const d = yc(o);
  return Sn(l), Kn(Ur(s, Ke(s, lt(s, l, d, i), "year-month"), i), s);
}
function hs(t, e, n, r) {
  let o = bt(n);
  t === "subtract" && (o = it(o));
  const i = G(O(r)), a = m(e, X), s = m(e, T), c = Hn(o);
  return Ne(kr(m(e, S), a, s, c, i), a, s);
}
function dn(t, e, n) {
  const r = Math.trunc(t / e), o = t % e, i = t < 0 ? "negative" : "positive", a = Math.abs(r), s = a + 1, c = nt(Math.abs(2 * o) - e), l = a % 2 == 0, d = Po(n, i), h = o === 0 ? a : zo(a, s, c, l, d);
  return e * (i === "positive" ? h : -h);
}
function Ni(t, e, n, r) {
  const o = Jn[n] * e;
  return (function(i, a, s) {
    const c = Ht(i), l = Ht(a), d = u.divide(c, l), h = u.remainder(c, l), f = Po(s, "positive");
    let g, y;
    u.lessThan(c, st) ? (g = u.subtract(d, Yr), y = d) : (g = d, y = u.add(d, Yr));
    const b = bo(Cn(u.multiply(h, Ai)), l) * (u.lessThan(c, st) ? -1 : 1) + 0, w = u.equal(h, st) ? d : zo(g, y, b, $s(g), f);
    return u.multiply(w, l);
  })(t, u.BigInt(o), r);
}
function Ri(t, e, n, r) {
  _i(t);
  const { year: o, month: i, day: a } = t.isoDate, s = Oi(t.time, e, n, r);
  return K(ot(o, i, a + s.deltaDays), s);
}
function Oi({ hour: t, minute: e, second: n, millisecond: r, microsecond: o, nanosecond: i }, a, s, c) {
  let l;
  switch (s) {
    case "day":
    case "hour":
      l = 1e3 * (1e3 * (1e3 * (60 * (60 * t + e) + n) + r) + o) + i;
      break;
    case "minute":
      l = 1e3 * (1e3 * (1e3 * (60 * e + n) + r) + o) + i;
      break;
    case "second":
      l = 1e3 * (1e3 * (1e3 * n + r) + o) + i;
      break;
    case "millisecond":
      l = 1e3 * (1e3 * r + o) + i;
      break;
    case "microsecond":
      l = 1e3 * o + i;
      break;
    case "nanosecond":
      l = i;
  }
  const d = Jn[s], h = dn(l, d * a, c) / d;
  switch (s) {
    case "day":
      return { deltaDays: h, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 };
    case "hour":
      return sn(h, 0, 0, 0, 0, 0);
    case "minute":
      return sn(t, h, 0, 0, 0, 0);
    case "second":
      return sn(t, e, h, 0, 0, 0);
    case "millisecond":
      return sn(t, e, n, h, 0, 0);
    case "microsecond":
      return sn(t, e, n, r, h, 0);
    case "nanosecond":
      return sn(t, e, n, r, o, h);
    default:
      throw new Error(`Invalid unit ${s}`);
  }
}
function No(t, e, n, r) {
  const o = Jn[n];
  return t.round(u.BigInt(o * e), r);
}
function Or(t, e) {
  const n = Jn[e];
  return t.fdiv(u.BigInt(n));
}
function Pt(t, e) {
  return t.year !== e.year ? nt(t.year - e.year) : t.month !== e.month ? nt(t.month - e.month) : t.day !== e.day ? nt(t.day - e.day) : 0;
}
function $i(t, e) {
  return t.hour !== e.hour ? nt(t.hour - e.hour) : t.minute !== e.minute ? nt(t.minute - e.minute) : t.second !== e.second ? nt(t.second - e.second) : t.millisecond !== e.millisecond ? nt(t.millisecond - e.millisecond) : t.microsecond !== e.microsecond ? nt(t.microsecond - e.microsecond) : t.nanosecond !== e.nanosecond ? nt(t.nanosecond - e.nanosecond) : 0;
}
function tr(t, e) {
  const n = Pt(t.isoDate, e.isoDate);
  return n !== 0 ? n : $i(t.time, e.time);
}
function Dc(t) {
  const e = Ro(t);
  return globalThis.BigInt !== void 0 ? globalThis.BigInt(e.toString(10)) : e;
}
function Ct(t, e) {
  const n = Ht(t), { quotient: r, remainder: o } = vr(n, Vr);
  let i = u.toNumber(r);
  return e === "floor" && u.toNumber(o) < 0 && (i -= 1), e === "ceil" && u.toNumber(o) > 0 && (i += 1), i;
}
function $t(t) {
  if (!Number.isInteger(t)) throw new RangeError("epoch milliseconds must be an integer");
  return u.multiply(u.BigInt(t), Vr);
}
function Ro(t) {
  let e = t;
  if (typeof t == "object") {
    const n = t[Symbol.toPrimitive];
    n && typeof n == "function" && (e = n.call(t, "number"));
  }
  if (typeof e == "number") throw new TypeError("cannot convert number to bigint");
  return typeof e == "bigint" ? u.BigInt(e.toString(10)) : u.BigInt(e);
}
const Ii = (() => {
  let t = u.BigInt(Date.now() % 1e6);
  return () => {
    const e = Date.now(), n = u.BigInt(e), r = u.add($t(e), t);
    return t = u.remainder(n, Vr), u.greaterThan(r, Qn) ? Qn : u.lessThan(r, Pr) ? Pr : r;
  };
})();
function pr() {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone;
}
function nt(t) {
  return t < 0 ? -1 : t > 0 ? 1 : t;
}
function O(t) {
  if (t === void 0) return /* @__PURE__ */ Object.create(null);
  if (ue(t) && t !== null) return t;
  throw new TypeError("Options parameter must be an object, not " + (t === null ? "null" : typeof t));
}
function On(t, e) {
  const n = /* @__PURE__ */ Object.create(null);
  return n[t] = e, n;
}
function Bt(t, e, n, r) {
  let o = t[e];
  if (o !== void 0) {
    if (o = jo(o), !n.includes(o)) throw new RangeError(`${e} must be one of ${n.join(", ")}, not ${o}`);
    return o;
  }
  if (r === nn) throw new RangeError(`${e} option is required`);
  return r;
}
function Qe(t) {
  const e = qr(t);
  if (!Vl.includes(qr(e))) throw new RangeError(`invalid calendar identifier ${e}`);
  switch (e) {
    case "ethiopic-amete-alem":
      return "ethioaa";
    case "islamicc":
      return "islamic-civil";
  }
  return e;
}
function qr(t) {
  let e = "";
  for (let n = 0; n < t.length; n++) {
    const r = t.charCodeAt(n);
    e += r >= 65 && r <= 90 ? String.fromCharCode(r + 32) : String.fromCharCode(r);
  }
  return e;
}
function wn(t) {
  throw new TypeError(`Do not use built-in arithmetic operators with Temporal objects. When comparing, use ${t === "PlainMonthDay" ? "Temporal.PlainDate.compare(obj1.toPlainDate(year), obj2.toPlainDate(year))" : `Temporal.${t}.compare(obj1, obj2)`}, not obj1 > obj2. When coercing to strings, use \`\${obj}\` or String(obj), not '' + obj. When coercing to numbers, use properties or methods of the object, not \`+obj\`. When concatenating with strings, use \`\${str}\${obj}\` or str.concat(obj), not str + obj. In React, coerce to a string before rendering a Temporal object.`);
}
const nd = new RegExp(`^${Ws.source}$`), rd = new RegExp(`^${/([+-])([01][0-9]|2[0-3])(?::?([0-5][0-9])(?::?([0-5][0-9])(?:[.,](\d{1,9}))?)?)?/.source}$`);
function Ec(t, e, n, r = t(e), o = t(n)) {
  let i = e, a = n, s = r, c = o;
  for (; a - i > 1; ) {
    let l = Math.trunc((i + a) / 2);
    const d = t(l);
    d === s ? (i = l, s = d) : d === c && (a = l, c = d);
  }
  return a;
}
function kc(t) {
  return [...t];
}
function Tc(t, e) {
  if (t !== "gregory" && t !== "iso8601") return;
  const n = so[t];
  let r = e.year;
  const { dayOfWeek: o, dayOfYear: i, daysInYear: a } = n.isoToDate(e, { dayOfWeek: !0, dayOfYear: !0, daysInYear: !0 }), s = n.getFirstDayOfWeek(), c = n.getMinimalDaysInFirstWeek();
  let l = (o + 7 - s) % 7, d = (o - i + 7001 - s) % 7, h = Math.floor((i - 1 + d) / 7);
  if (7 - d >= c && ++h, h == 0) h = (function(f, g, y, b) {
    let w = (b - f - y + 1) % 7;
    w < 0 && (w += 7);
    let x = Math.floor((y + w - 1) / 7);
    return 7 - w >= g && ++x, x;
  })(s, c, i + n.isoToDate(n.dateAdd(e, { years: -1 }, "constrain"), { daysInYear: !0 }).daysInYear, o), r--;
  else if (i >= a - 5) {
    let f = (l + a - i) % 7;
    f < 0 && (f += 7), 6 - f >= c && i + 7 - l > a && (h = 1, r++);
  }
  return { week: h, year: r };
}
function ms(t, e, n, r, o) {
  if (e !== o.year) {
    if (t * (e - o.year) > 0) return !0;
  } else if (n !== o.month) {
    if (t * (n - o.month) > 0) return !0;
  } else if (r !== o.day && t * (r - o.day) > 0) return !0;
  return !1;
}
const so = {};
function $n(t) {
  if (!t.startsWith("M")) throw new RangeError(`Invalid month code: ${t}.  Month codes must start with M.`);
  const e = +t.slice(1);
  if (Number.isNaN(e)) throw new RangeError(`Invalid month code: ${t}`);
  return e;
}
function Lt(t, e = !1) {
  return `M${`${t}`.padStart(2, "0")}${e ? "L" : ""}`;
}
function Qi(t, e = void 0, n = 12) {
  let { month: r, monthCode: o } = t;
  if (o === void 0) {
    if (r === void 0) throw new TypeError("Either month or monthCode are required");
    e === "reject" && be(r, 1, n), e === "constrain" && (r = Ze(r, 1, n)), o = Lt(r);
  } else {
    const i = $n(o);
    if (o !== Lt(i)) throw new RangeError(`Invalid month code: ${o}`);
    if (r !== void 0 && r !== i) throw new RangeError(`monthCode ${o} and month ${r} must match if both are present`);
    if (r = i, r < 1 || r > n) throw new RangeError(`Invalid monthCode: ${o}`);
  }
  return { ...t, month: r, monthCode: o };
}
so.iso8601 = { resolveFields(t, e) {
  if ((e === "date" || e === "year-month") && t.year === void 0) throw new TypeError("year is required");
  if ((e === "date" || e === "month-day") && t.day === void 0) throw new TypeError("day is required");
  Object.assign(t, Qi(t));
}, dateToISO: (t, e) => Nr(t.year, t.month, t.day, e), monthDayToISOReferenceDate(t, e) {
  const { month: n, day: r } = Nr(t.year ?? 1972, t.month, t.day, e);
  return { month: n, day: r, year: 1972 };
}, extraFields: () => [], fieldKeysToIgnore(t) {
  const e = /* @__PURE__ */ new Set();
  for (let n = 0; n < t.length; n++) {
    const r = t[n];
    e.add(r), r === "month" ? e.add("monthCode") : r === "monthCode" && e.add("month");
  }
  return kc(e);
}, dateAdd(t, { years: e = 0, months: n = 0, weeks: r = 0, days: o = 0 }, i) {
  let { year: a, month: s, day: c } = t;
  return a += e, s += n, { year: a, month: s } = En(a, s), { year: a, month: s, day: c } = Nr(a, s, c, i), c += o + 7 * r, ot(a, s, c);
}, dateUntil(t, e, n) {
  const r = -Pt(t, e);
  if (r === 0) return { years: 0, months: 0, weeks: 0, days: 0 };
  let o, i = 0, a = 0;
  if (n === "year" || n === "month") {
    let d = e.year - t.year;
    for (d !== 0 && (d -= r); !ms(r, t.year + d, t.month, t.day, e); ) i = d, d += r;
    let h = r;
    for (o = En(t.year + i, t.month + h); !ms(r, o.year, o.month, t.day, e); ) a = h, h += r, o = En(o.year, o.month + r);
    n === "month" && (a += 12 * i, i = 0);
  }
  o = En(t.year + i, t.month + a);
  const s = pc(o.year, o.month, t.day);
  let c = 0, l = Rn(e.year, e.month - 1, e.day) - Rn(s.year, s.month - 1, s.day);
  return n === "week" && (c = Math.trunc(l / 7), l %= 7), { years: i, months: a, weeks: c, days: l };
}, isoToDate({ year: t, month: e, day: n }, r) {
  const o = { era: void 0, eraYear: void 0, year: t, month: e, day: n, daysInWeek: 7, monthsInYear: 12 };
  if (r.monthCode && (o.monthCode = Lt(e)), r.dayOfWeek) {
    const i = e + (e < 3 ? 10 : -2), a = t - (e < 3 ? 1 : 0), s = Math.floor(a / 100), c = a - 100 * s, l = (n + Math.floor(2.6 * i - 0.2) + (c + Math.floor(c / 4)) + (Math.floor(s / 4) - 2 * s)) % 7;
    o.dayOfWeek = l + (l <= 0 ? 7 : 0);
  }
  if (r.dayOfYear) {
    let i = n;
    for (let a = e - 1; a > 0; a--) i += Tn(t, a);
    o.dayOfYear = i;
  }
  return r.weekOfYear && (o.weekOfYear = Tc("iso8601", { year: t, month: e, day: n })), r.daysInMonth && (o.daysInMonth = Tn(t, e)), (r.daysInYear || r.inLeapYear) && (o.inLeapYear = _o(t), o.daysInYear = o.inLeapYear ? 366 : 365), o;
}, getFirstDayOfWeek: () => 1, getMinimalDaysInFirstWeek: () => 4 };
class we {
  constructor(e) {
    if (this.map = /* @__PURE__ */ new Map(), this.calls = 0, this.hits = 0, this.misses = 0, e !== void 0) {
      let n = 0;
      for (const r of e.map.entries()) {
        if (++n > we.MAX_CACHE_ENTRIES) break;
        this.map.set(...r);
      }
    }
  }
  get(e) {
    const n = this.map.get(e);
    return n && (this.hits++, this.report()), this.calls++, n;
  }
  set(e, n) {
    this.map.set(e, n), this.misses++, this.report();
  }
  report() {
  }
  setObject(e) {
    if (we.objectMap.get(e)) throw new RangeError("object already cached");
    we.objectMap.set(e, this), this.report();
  }
  static getCacheForObject(e) {
    let n = we.objectMap.get(e);
    return n || (n = new we(), we.objectMap.set(e, n)), n;
  }
}
function _c({ isoYear: t, isoMonth: e, isoDay: n }) {
  return `${ao(t)}-${dt(e)}-${dt(n)}T00:00Z`;
}
function ai(t, e) {
  return { years: t.year - e.year, months: t.month - e.month, days: t.day - e.day };
}
we.objectMap = /* @__PURE__ */ new WeakMap(), we.MAX_CACHE_ENTRIES = 1e3;
class Yn {
  constructor() {
    this.eras = [], this.hasEra = !1, this.erasBeginMidYear = !1;
  }
  getFormatter() {
    return this.formatter === void 0 && (this.formatter = new Intl.DateTimeFormat(`en-US-u-ca-${this.id}`, { day: "numeric", month: "numeric", year: "numeric", era: "short", timeZone: "UTC" })), this.formatter;
  }
  getCalendarParts(e) {
    let n = this.getFormatter(), r = new Date(e);
    if (e === "-271821-04-19T00:00Z") {
      const o = n.resolvedOptions();
      n = new Intl.DateTimeFormat(o.locale, { ...o, timeZone: "Etc/GMT+1" }), r = /* @__PURE__ */ new Date("-271821-04-20T00:00Z");
    }
    try {
      return n.formatToParts(r);
    } catch {
      throw new RangeError(`Invalid ISO date: ${e}`);
    }
  }
  isoToCalendarDate(e, n) {
    const { year: r, month: o, day: i } = e, a = JSON.stringify({ func: "isoToCalendarDate", isoYear: r, isoMonth: o, isoDay: i, id: this.id }), s = n.get(a);
    if (s) return s;
    const c = _c({ isoYear: r, isoMonth: o, isoDay: i }), l = this.getCalendarParts(c), d = {};
    for (let f = 0; f < l.length; f++) {
      const { type: g, value: y } = l[f];
      if (g !== "year" && g !== "relatedYear" || (this.hasEra ? d.eraYear = +y : d.year = +y), g === "month") {
        const b = /^([0-9]*)(.*?)$/.exec(y);
        if (!b || b.length != 3 || !b[1] && !b[2]) throw new RangeError(`Unexpected month: ${y}`);
        if (d.month = b[1] ? +b[1] : 1, d.month < 1) throw new RangeError(`Invalid month ${y} from ${c}[u-ca-${this.id}] (probably due to https://bugs.chromium.org/p/v8/issues/detail?id=10527)`);
        if (d.month > 13) throw new RangeError(`Invalid month ${y} from ${c}[u-ca-${this.id}] (probably due to https://bugs.chromium.org/p/v8/issues/detail?id=10529)`);
        b[2] && (d.monthExtra = b[2]);
      }
      g === "day" && (d.day = +y), this.hasEra && g === "era" && y != null && y !== "" && (d.era = y.split(" (")[0].normalize("NFD").replace(/[^-0-9 \p{L}]/gu, "").replace(/ /g, "-").toLowerCase());
    }
    if (this.hasEra && d.eraYear === void 0) throw new RangeError(`Intl.DateTimeFormat.formatToParts lacks relatedYear in ${this.id} calendar. Try Node 14+ or modern browsers.`);
    if (this.hasEra) {
      const f = this.eras.find(((g) => d.era === g.genericName));
      f && (d.era = f.code);
    }
    if (this.reviseIntlEra) {
      const { era: f, eraYear: g } = this.reviseIntlEra(d, e);
      d.era = f, d.eraYear = g;
    }
    this.checkIcuBugs && this.checkIcuBugs(e);
    const h = this.adjustCalendarDate(d, n, "constrain", !0);
    if (h.year === void 0) throw new RangeError(`Missing year converting ${JSON.stringify(e)}`);
    if (h.month === void 0) throw new RangeError(`Missing month converting ${JSON.stringify(e)}`);
    if (h.day === void 0) throw new RangeError(`Missing day converting ${JSON.stringify(e)}`);
    return n.set(a, h), ["constrain", "reject"].forEach(((f) => {
      const g = JSON.stringify({ func: "calendarToIsoDate", year: h.year, month: h.month, day: h.day, overflow: f, id: this.id });
      n.set(g, e);
    })), h;
  }
  validateCalendarDate(e) {
    const { month: n, year: r, day: o, eraYear: i, monthCode: a, monthExtra: s } = e;
    if (s !== void 0) throw new RangeError("Unexpected `monthExtra` value");
    if (r === void 0 && i === void 0) throw new TypeError("year or eraYear is required");
    if (n === void 0 && a === void 0) throw new TypeError("month or monthCode is required");
    if (o === void 0) throw new RangeError("Missing day");
    if (a !== void 0) {
      if (typeof a != "string") throw new RangeError("monthCode must be a string, not " + typeof a);
      if (!/^M([01]?\d)(L?)$/.test(a)) throw new RangeError(`Invalid monthCode: ${a}`);
    }
    if (this.hasEra && e.era === void 0 != (e.eraYear === void 0)) throw new TypeError("properties era and eraYear must be provided together");
  }
  adjustCalendarDate(e, n = void 0, r = "constrain", o = !1) {
    if (this.calendarType === "lunisolar") throw new RangeError("Override required for lunisolar calendars");
    let i = e;
    this.validateCalendarDate(i);
    const a = this.monthsInYear(i, n);
    let { month: s, monthCode: c } = i;
    return { month: s, monthCode: c } = Qi(i, r, a), { ...i, month: s, monthCode: c };
  }
  regulateMonthDayNaive(e, n, r) {
    const o = this.monthsInYear(e, r);
    let { month: i, day: a } = e;
    return n === "reject" ? (be(i, 1, o), be(a, 1, this.maximumMonthLength(e))) : (i = Ze(i, 1, o), a = Ze(a, 1, this.maximumMonthLength({ ...e, month: i }))), { ...e, month: i, day: a };
  }
  calendarToIsoDate(e, n = "constrain", r) {
    const o = e;
    let i = this.adjustCalendarDate(e, r, n, !1);
    i = this.regulateMonthDayNaive(i, n, r);
    const { year: a, month: s, day: c } = i, l = JSON.stringify({ func: "calendarToIsoDate", year: a, month: s, day: c, overflow: n, id: this.id });
    let d, h = r.get(l);
    if (h || o.year !== void 0 && o.month !== void 0 && o.day !== void 0 && (o.year !== i.year || o.month !== i.month || o.day !== i.day) && (d = JSON.stringify({ func: "calendarToIsoDate", year: o.year, month: o.month, day: o.day, overflow: n, id: this.id }), h = r.get(d), h)) return h;
    let f = this.estimateIsoDate({ year: a, month: s, day: c });
    const g = (D) => {
      let E = this.addDaysIso(f, D);
      if (i.day > this.minimumMonthLength(i)) {
        let _ = this.isoToCalendarDate(E, r);
        for (; _.month !== s || _.year !== a; ) {
          if (n === "reject") throw new RangeError(`day ${c} does not exist in month ${s} of year ${a}`);
          E = this.addDaysIso(E, -1), _ = this.isoToCalendarDate(E, r);
        }
      }
      return E;
    };
    let y = 0, b = this.isoToCalendarDate(f, r), w = ai(i, b);
    if (w.years !== 0 || w.months !== 0 || w.days !== 0) {
      const D = 365 * w.years + 30 * w.months + w.days;
      f = this.addDaysIso(f, D), b = this.isoToCalendarDate(f, r), w = ai(i, b), w.years === 0 && w.months === 0 ? f = g(w.days) : y = this.compareCalendarDates(i, b);
    }
    let x = 8;
    for (; y; ) {
      f = this.addDaysIso(f, y * x);
      const D = b;
      b = this.isoToCalendarDate(f, r);
      const E = y;
      if (y = this.compareCalendarDates(i, b), y) {
        if (w = ai(i, b), w.years === 0 && w.months === 0) f = g(w.days), y = 0;
        else if (E && y !== E) if (x > 1) x /= 2;
        else {
          if (n === "reject") throw new RangeError(`Can't find ISO date from calendar date: ${JSON.stringify({ ...o })}`);
          this.compareCalendarDates(b, D) > 0 && (f = this.addDaysIso(f, -1)), y = 0;
        }
      }
    }
    if (r.set(l, f), d && r.set(d, f), i.year === void 0 || i.month === void 0 || i.day === void 0 || i.monthCode === void 0 || this.hasEra && (i.era === void 0 || i.eraYear === void 0)) throw new RangeError("Unexpected missing property");
    return f;
  }
  compareCalendarDates(e, n) {
    return e.year !== n.year ? nt(e.year - n.year) : e.month !== n.month ? nt(e.month - n.month) : e.day !== n.day ? nt(e.day - n.day) : 0;
  }
  regulateDate(e, n = "constrain", r) {
    const o = this.calendarToIsoDate(e, n, r);
    return this.isoToCalendarDate(o, r);
  }
  addDaysIso(e, n) {
    return ot(e.year, e.month, e.day + n);
  }
  addDaysCalendar(e, n, r) {
    const o = this.calendarToIsoDate(e, "constrain", r), i = this.addDaysIso(o, n);
    return this.isoToCalendarDate(i, r);
  }
  addMonthsCalendar(e, n, r, o) {
    let i = e;
    const { day: a } = i;
    for (let s = 0, c = Math.abs(n); s < c; s++) {
      const { month: l } = i, d = i, h = n < 0 ? -Math.max(a, this.daysInPreviousMonth(i, o)) : this.daysInMonth(i, o), f = this.calendarToIsoDate(i, "constrain", o);
      let g = this.addDaysIso(f, h);
      if (i = this.isoToCalendarDate(g, o), n > 0) {
        const y = this.monthsInYear(d, o);
        for (; i.month - 1 != l % y; ) g = this.addDaysIso(g, -1), i = this.isoToCalendarDate(g, o);
      }
      i.day !== a && (i = this.regulateDate({ ...i, day: a }, "constrain", o));
    }
    if (r === "reject" && i.day !== a) throw new RangeError(`Day ${a} does not exist in resulting calendar month`);
    return i;
  }
  addCalendar(e, { years: n = 0, months: r = 0, weeks: o = 0, days: i = 0 }, a, s) {
    const { year: c, day: l, monthCode: d } = e, h = this.adjustCalendarDate({ year: c + n, monthCode: d, day: l }, s), f = this.addMonthsCalendar(h, r, a, s), g = i + 7 * o;
    return this.addDaysCalendar(f, g, s);
  }
  untilCalendar(e, n, r, o) {
    let i = 0, a = 0, s = 0, c = 0;
    switch (r) {
      case "day":
        i = this.calendarDaysUntil(e, n, o);
        break;
      case "week": {
        const l = this.calendarDaysUntil(e, n, o);
        i = l % 7, a = (l - i) / 7;
        break;
      }
      case "month":
      case "year": {
        const l = this.compareCalendarDates(n, e);
        if (!l) return { years: 0, months: 0, weeks: 0, days: 0 };
        const d = n.year - e.year, h = n.day - e.day;
        if (r === "year" && d) {
          let y = 0;
          n.monthCode > e.monthCode && (y = 1), n.monthCode < e.monthCode && (y = -1), y || (y = Math.sign(h)), c = y * l < 0 ? d - l : d;
        }
        let f, g = c ? this.addCalendar(e, { years: c }, "constrain", o) : e;
        do
          s += l, f = g, g = this.addMonthsCalendar(f, l, "constrain", o), g.day !== e.day && (g = this.regulateDate({ ...g, day: e.day }, "constrain", o));
        while (this.compareCalendarDates(n, g) * l >= 0);
        s -= l, i = this.calendarDaysUntil(f, n, o);
        break;
      }
    }
    return { years: c, months: s, weeks: a, days: i };
  }
  daysInMonth(e, n) {
    const { day: r } = e, o = this.maximumMonthLength(e), i = this.minimumMonthLength(e);
    if (i === o) return i;
    const a = r <= o - i ? o : i, s = this.calendarToIsoDate(e, "constrain", n), c = this.addDaysIso(s, a), l = this.isoToCalendarDate(c, n), d = this.addDaysIso(c, -l.day);
    return this.isoToCalendarDate(d, n).day;
  }
  daysInPreviousMonth(e, n) {
    const { day: r, month: o, year: i } = e;
    let a = { year: o > 1 ? i : i - 1, month: o, day: 1 };
    const s = o > 1 ? o - 1 : this.monthsInYear(a, n);
    a = { ...a, month: s };
    const c = this.minimumMonthLength(a), l = this.maximumMonthLength(a);
    if (c === l) return l;
    const d = this.calendarToIsoDate(e, "constrain", n), h = this.addDaysIso(d, -r);
    return this.isoToCalendarDate(h, n).day;
  }
  startOfCalendarYear(e) {
    return { year: e.year, month: 1, monthCode: "M01", day: 1 };
  }
  startOfCalendarMonth(e) {
    return { year: e.year, month: e.month, day: 1 };
  }
  calendarDaysUntil(e, n, r) {
    const o = this.calendarToIsoDate(e, "constrain", r), i = this.calendarToIsoDate(n, "constrain", r);
    return Rn(i.year, i.month - 1, i.day) - Rn(o.year, o.month - 1, o.day);
  }
  monthDaySearchStartYear(e, n) {
    return 1972;
  }
  monthDayFromFields(e, n, r) {
    let o, i, a, s, c, { era: l, eraYear: d, year: h, month: f, monthCode: g, day: y } = e;
    if (f !== void 0 && h === void 0 && (!this.hasEra || l === void 0 || d === void 0)) throw new TypeError("when month is present, year (or era and eraYear) are required");
    (g === void 0 || h !== void 0 || this.hasEra && d !== void 0) && ({ monthCode: g, day: y } = this.isoToCalendarDate(this.calendarToIsoDate(e, n, r), r));
    const b = { year: this.monthDaySearchStartYear(g, y), month: 12, day: 31 }, w = this.isoToCalendarDate(b, r), x = w.monthCode > g || w.monthCode === g && w.day >= y ? w.year : w.year - 1;
    for (let D = 0; D < 20; D++) {
      const E = this.adjustCalendarDate({ day: y, monthCode: g, year: x - D }, r), _ = this.calendarToIsoDate(E, "constrain", r), M = this.isoToCalendarDate(_, r);
      if ({ year: o, month: i, day: a } = _, M.monthCode === g && M.day === y) return { month: i, day: a, year: o };
      if (n === "constrain") {
        const N = this.maxLengthOfMonthCodeInAnyYear(M.monthCode);
        if (M.monthCode === g && M.day === N && y > N) return { month: i, day: a, year: o };
        (s === void 0 || M.monthCode === s.monthCode && M.day > s.day) && (s = M, c = _);
      }
    }
    if (n === "constrain" && c !== void 0) return c;
    throw new RangeError(`No recent ${this.id} year with monthCode ${g} and day ${y}`);
  }
  getFirstDayOfWeek() {
  }
  getMinimalDaysInFirstWeek() {
  }
}
class od extends Yn {
  constructor() {
    super(...arguments), this.id = "hebrew", this.calendarType = "lunisolar", this.months = { Tishri: { leap: 1, regular: 1, monthCode: "M01", days: 30 }, Heshvan: { leap: 2, regular: 2, monthCode: "M02", days: { min: 29, max: 30 } }, Kislev: { leap: 3, regular: 3, monthCode: "M03", days: { min: 29, max: 30 } }, Tevet: { leap: 4, regular: 4, monthCode: "M04", days: 29 }, Shevat: { leap: 5, regular: 5, monthCode: "M05", days: 30 }, Adar: { leap: void 0, regular: 6, monthCode: "M06", days: 29 }, "Adar I": { leap: 6, regular: void 0, monthCode: "M05L", days: 30 }, "Adar II": { leap: 7, regular: void 0, monthCode: "M06", days: 29 }, Nisan: { leap: 8, regular: 7, monthCode: "M07", days: 30 }, Iyar: { leap: 9, regular: 8, monthCode: "M08", days: 29 }, Sivan: { leap: 10, regular: 9, monthCode: "M09", days: 30 }, Tamuz: { leap: 11, regular: 10, monthCode: "M10", days: 29 }, Av: { leap: 12, regular: 11, monthCode: "M11", days: 30 }, Elul: { leap: 13, regular: 12, monthCode: "M12", days: 29 } };
  }
  inLeapYear(e) {
    const { year: n } = e;
    return (7 * n + 1) % 19 < 7;
  }
  monthsInYear(e) {
    return this.inLeapYear(e) ? 13 : 12;
  }
  minimumMonthLength(e) {
    return this.minMaxMonthLength(e, "min");
  }
  maximumMonthLength(e) {
    return this.minMaxMonthLength(e, "max");
  }
  minMaxMonthLength(e, n) {
    const { month: r, year: o } = e, i = this.getMonthCode(o, r), a = Object.entries(this.months).find(((c) => c[1].monthCode === i));
    if (a === void 0) throw new RangeError(`unmatched Hebrew month: ${r}`);
    const s = a[1].days;
    return typeof s == "number" ? s : s[n];
  }
  maxLengthOfMonthCodeInAnyYear(e) {
    return ["M04", "M06", "M08", "M10", "M12"].includes(e) ? 29 : 30;
  }
  estimateIsoDate(e) {
    const { year: n } = e;
    return { year: n - 3760, month: 1, day: 1 };
  }
  getMonthCode(e, n) {
    return this.inLeapYear({ year: e }) ? n === 6 ? Lt(5, !0) : Lt(n < 6 ? n : n - 1) : Lt(n);
  }
  adjustCalendarDate(e, n, r = "constrain", o = !1) {
    let { year: i, month: a, monthCode: s, day: c, monthExtra: l } = e;
    if (i === void 0) throw new TypeError("Missing property: year");
    if (o) {
      if (l) {
        const d = this.months[l];
        if (!d) throw new RangeError(`Unrecognized month from formatToParts: ${l}`);
        a = this.inLeapYear({ year: i }) ? d.leap : d.regular;
      }
      return s = this.getMonthCode(i, a), { year: i, month: a, day: c, monthCode: s };
    }
    if (this.validateCalendarDate(e), a === void 0) if (s.endsWith("L")) {
      if (s !== "M05L") throw new RangeError(`Hebrew leap month must have monthCode M05L, not ${s}`);
      if (a = 6, !this.inLeapYear({ year: i })) {
        if (r === "reject") throw new RangeError(`Hebrew monthCode M05L is invalid in year ${i} which is not a leap year`);
        a = 6, s = "M06";
      }
    } else {
      a = $n(s), this.inLeapYear({ year: i }) && a >= 6 && a++;
      const d = this.monthsInYear({ year: i });
      if (a < 1 || a > d) throw new RangeError(`Invalid monthCode: ${s}`);
    }
    else if (r === "reject" ? (be(a, 1, this.monthsInYear({ year: i })), be(c, 1, this.maximumMonthLength({ year: i, month: a }))) : (a = Ze(a, 1, this.monthsInYear({ year: i })), c = Ze(c, 1, this.maximumMonthLength({ year: i, month: a }))), s === void 0) s = this.getMonthCode(i, a);
    else if (this.getMonthCode(i, a) !== s) throw new RangeError(`monthCode ${s} doesn't correspond to month ${a} in Hebrew year ${i}`);
    return { ...e, day: c, month: a, monthCode: s, year: i };
  }
}
class hr extends Yn {
  constructor() {
    super(...arguments), this.calendarType = "lunar", this.DAYS_PER_ISLAMIC_YEAR = 354 + 11 / 30, this.DAYS_PER_ISO_YEAR = 365.2425;
  }
  inLeapYear(e, n) {
    const r = { year: e.year, month: 1, monthCode: "M01", day: 1 }, o = { year: e.year + 1, month: 1, monthCode: "M01", day: 1 };
    return this.calendarDaysUntil(r, o, n) === 355;
  }
  monthsInYear() {
    return 12;
  }
  minimumMonthLength() {
    return 29;
  }
  maximumMonthLength() {
    return 30;
  }
  maxLengthOfMonthCodeInAnyYear() {
    return 30;
  }
  estimateIsoDate(e) {
    const { year: n } = this.adjustCalendarDate(e);
    return { year: Math.floor(n * this.DAYS_PER_ISLAMIC_YEAR / this.DAYS_PER_ISO_YEAR) + 622, month: 1, day: 1 };
  }
}
class id extends hr {
  constructor() {
    super(...arguments), this.id = "islamic";
  }
}
class ad extends hr {
  constructor() {
    super(...arguments), this.id = "islamic-umalqura";
  }
}
class sd extends hr {
  constructor() {
    super(...arguments), this.id = "islamic-tbla";
  }
}
class cd extends hr {
  constructor() {
    super(...arguments), this.id = "islamic-civil";
  }
}
class ld extends hr {
  constructor() {
    super(...arguments), this.id = "islamic-rgsa";
  }
}
class dd extends hr {
  constructor() {
    super(...arguments), this.id = "islamicc";
  }
}
class ud extends Yn {
  constructor() {
    super(...arguments), this.id = "persian", this.calendarType = "solar";
  }
  inLeapYear(e, n) {
    return this.daysInMonth({ year: e.year, month: 12, day: 1 }, n) === 30;
  }
  monthsInYear() {
    return 12;
  }
  minimumMonthLength(e) {
    const { month: n } = e;
    return n === 12 ? 29 : n <= 6 ? 31 : 30;
  }
  maximumMonthLength(e) {
    const { month: n } = e;
    return n === 12 ? 30 : n <= 6 ? 31 : 30;
  }
  maxLengthOfMonthCodeInAnyYear(e) {
    return $n(e) <= 6 ? 31 : 30;
  }
  estimateIsoDate(e) {
    const { year: n } = this.adjustCalendarDate(e);
    return { year: n + 621, month: 1, day: 1 };
  }
}
class hd extends Yn {
  constructor() {
    super(...arguments), this.id = "indian", this.calendarType = "solar", this.months = { 1: { length: 30, month: 3, day: 22, leap: { length: 31, month: 3, day: 21 } }, 2: { length: 31, month: 4, day: 21 }, 3: { length: 31, month: 5, day: 22 }, 4: { length: 31, month: 6, day: 22 }, 5: { length: 31, month: 7, day: 23 }, 6: { length: 31, month: 8, day: 23 }, 7: { length: 30, month: 9, day: 23 }, 8: { length: 30, month: 10, day: 23 }, 9: { length: 30, month: 11, day: 22 }, 10: { length: 30, month: 12, day: 22 }, 11: { length: 30, month: 1, nextYear: !0, day: 21 }, 12: { length: 30, month: 2, nextYear: !0, day: 20 } }, this.vulnerableToBceBug = (/* @__PURE__ */ new Date("0000-01-01T00:00Z")).toLocaleDateString("en-US-u-ca-indian", { timeZone: "UTC" }) !== "10/11/-79 Saka";
  }
  inLeapYear(e) {
    return Bi(e.year + 78);
  }
  monthsInYear() {
    return 12;
  }
  minimumMonthLength(e) {
    return this.getMonthInfo(e).length;
  }
  maximumMonthLength(e) {
    return this.getMonthInfo(e).length;
  }
  maxLengthOfMonthCodeInAnyYear(e) {
    const n = $n(e);
    let r = this.months[n];
    return r = r.leap ?? r, r.length;
  }
  getMonthInfo(e) {
    const { month: n } = e;
    let r = this.months[n];
    if (r === void 0) throw new RangeError(`Invalid month: ${n}`);
    return this.inLeapYear(e) && r.leap && (r = r.leap), r;
  }
  estimateIsoDate(e) {
    const n = this.adjustCalendarDate(e), r = this.getMonthInfo(n);
    return ot(n.year + 78 + (r.nextYear ? 1 : 0), r.month, r.day + n.day - 1);
  }
  checkIcuBugs(e) {
    if (this.vulnerableToBceBug && e.year < 1) throw new RangeError(`calendar '${this.id}' is broken for ISO dates before 0001-01-01 (see https://bugs.chromium.org/p/v8/issues/detail?id=10529)`);
  }
}
function Bi(t) {
  return t % 4 == 0 && (t % 100 != 0 || t % 400 == 0);
}
class Mc extends Yn {
  constructor(e, n) {
    super(), this.calendarType = "solar", this.id = e, this.isoEpoch = n;
  }
  inLeapYear(e) {
    const { year: n } = this.estimateIsoDate({ month: 1, day: 1, year: e.year });
    return Bi(n);
  }
  monthsInYear() {
    return 12;
  }
  minimumMonthLength(e) {
    const { month: n } = e;
    return n === 2 ? this.inLeapYear(e) ? 29 : 28 : [4, 6, 9, 11].indexOf(n) >= 0 ? 30 : 31;
  }
  maximumMonthLength(e) {
    return this.minimumMonthLength(e);
  }
  maxLengthOfMonthCodeInAnyYear(e) {
    return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][$n(e) - 1];
  }
  estimateIsoDate(e) {
    const n = this.adjustCalendarDate(e);
    return Nr(n.year + this.isoEpoch.year, n.month + this.isoEpoch.month, n.day + this.isoEpoch.day, "constrain");
  }
}
class Nc extends Yn {
  constructor(e, n) {
    super(), this.hasEra = !0, this.calendarType = "solar", this.id = e;
    const { eras: r, anchorEra: o } = (function(i) {
      let a, s = i;
      if (s.length === 0) throw new RangeError("Invalid era data: eras are required");
      if (s.length === 1 && s[0].reverseOf) throw new RangeError("Invalid era data: anchor era cannot count years backwards");
      if (s.length === 1 && !s[0].code) throw new RangeError("Invalid era data: at least one named era is required");
      if (s.filter(((l) => l.reverseOf != null)).length > 1) throw new RangeError("Invalid era data: only one era can count years backwards");
      s.forEach(((l) => {
        if (l.isAnchor || !l.anchorEpoch && !l.reverseOf) {
          if (a) throw new RangeError("Invalid era data: cannot have multiple anchor eras");
          a = l, l.anchorEpoch = { year: l.hasYearZero ? 0 : 1 };
        } else if (!l.code) throw new RangeError("If era name is blank, it must be the anchor era");
      })), s = s.filter(((l) => l.code)), s.forEach(((l) => {
        const { reverseOf: d } = l;
        if (d) {
          const h = s.find(((f) => f.code === d));
          if (h === void 0) throw new RangeError(`Invalid era data: unmatched reverseOf era: ${d}`);
          l.reverseOf = h, l.anchorEpoch = h.anchorEpoch, l.isoEpoch = h.isoEpoch;
        }
        l.anchorEpoch.month === void 0 && (l.anchorEpoch.month = 1), l.anchorEpoch.day === void 0 && (l.anchorEpoch.day = 1);
      })), s.sort(((l, d) => {
        if (l.reverseOf) return 1;
        if (d.reverseOf) return -1;
        if (!l.isoEpoch || !d.isoEpoch) throw new RangeError("Invalid era data: missing ISO epoch");
        return d.isoEpoch.year - l.isoEpoch.year;
      }));
      const c = s[s.length - 1].reverseOf;
      if (c && c !== s[s.length - 2]) throw new RangeError("Invalid era data: invalid reverse-sign era");
      return s.forEach(((l, d) => {
        l.genericName = "era" + (s.length - 1 - d);
      })), { eras: s, anchorEra: a || s[0] };
    })(n);
    this.anchorEra = o, this.eras = r;
  }
  inLeapYear(e) {
    const { year: n } = this.estimateIsoDate({ month: 1, day: 1, year: e.year });
    return Bi(n);
  }
  monthsInYear() {
    return 12;
  }
  minimumMonthLength(e) {
    const { month: n } = e;
    return n === 2 ? this.inLeapYear(e) ? 29 : 28 : [4, 6, 9, 11].indexOf(n) >= 0 ? 30 : 31;
  }
  maximumMonthLength(e) {
    return this.minimumMonthLength(e);
  }
  maxLengthOfMonthCodeInAnyYear(e) {
    return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][$n(e) - 1];
  }
  completeEraYear(e) {
    const n = (s, c, l) => {
      const d = e[s];
      if (d != null && d != c && !(l || []).includes(d)) {
        const h = l == null ? void 0 : l[0];
        throw new RangeError(`Input ${s} ${d} doesn't match calculated value ${h ? `${c} (also called ${h})` : c}`);
      }
    }, r = (s) => {
      let c;
      const l = { ...e, year: s }, d = this.eras.find(((h, f) => {
        if (f === this.eras.length - 1) {
          if (h.reverseOf) {
            if (s > 0) throw new RangeError(`Signed year ${s} is invalid for era ${h.code}`);
            return c = h.anchorEpoch.year - s, !0;
          }
          return c = s - h.anchorEpoch.year + (h.hasYearZero ? 0 : 1), !0;
        }
        return this.compareCalendarDates(l, h.anchorEpoch) >= 0 && (c = s - h.anchorEpoch.year + (h.hasYearZero ? 0 : 1), !0);
      }));
      if (!d) throw new RangeError(`Year ${s} was not matched by any era`);
      return { eraYear: c, era: d.code, eraNames: d.names };
    };
    let { year: o, eraYear: i, era: a } = e;
    if (o != null) {
      const s = r(o);
      ({ eraYear: i, era: a } = s), n("era", a, s == null ? void 0 : s.eraNames), n("eraYear", i);
    } else {
      if (i == null) throw new RangeError("Either year or eraYear and era are required");
      {
        if (a === void 0) throw new RangeError("era and eraYear must be provided together");
        const s = this.eras.find((({ code: c, names: l = [] }) => c === a || l.includes(a)));
        if (!s) throw new RangeError(`Era ${a} (ISO year ${i}) was not matched by any era`);
        o = s.reverseOf ? s.anchorEpoch.year - i : i + s.anchorEpoch.year - (s.hasYearZero ? 0 : 1), n("year", o), { eraYear: i, era: a } = r(o);
      }
    }
    return { ...e, year: o, eraYear: i, era: a };
  }
  adjustCalendarDate(e, n, r = "constrain") {
    let o = e;
    const { month: i, monthCode: a } = o;
    return i === void 0 && (o = { ...o, month: $n(a) }), this.validateCalendarDate(o), o = this.completeEraYear(o), super.adjustCalendarDate(o, n, r);
  }
  estimateIsoDate(e) {
    const n = this.adjustCalendarDate(e), { year: r, month: o, day: i } = n, { anchorEra: a } = this;
    return Nr(r + a.isoEpoch.year - (a.hasYearZero ? 0 : 1), o, i, "constrain");
  }
}
class Ji extends Nc {
  constructor(e, n) {
    super(e, n);
  }
  isoToCalendarDate(e) {
    const { year: n, month: r, day: o } = e, i = Lt(r), a = n - this.anchorEra.isoEpoch.year + 1;
    return this.completeEraYear({ year: a, month: r, monthCode: i, day: o });
  }
}
const Nt = { inLeapYear(t) {
  const { year: e } = t;
  return (e + 1) % 4 == 0;
}, monthsInYear: () => 13, minimumMonthLength(t) {
  const { month: e } = t;
  return e === 13 ? this.inLeapYear(t) ? 6 : 5 : 30;
}, maximumMonthLength(t) {
  return this.minimumMonthLength(t);
}, maxLengthOfMonthCodeInAnyYear: (t) => t === "M13" ? 6 : 30 };
class md extends Mc {
  constructor(e, n) {
    super(e, n), this.inLeapYear = Nt.inLeapYear, this.monthsInYear = Nt.monthsInYear, this.minimumMonthLength = Nt.minimumMonthLength, this.maximumMonthLength = Nt.maximumMonthLength, this.maxLengthOfMonthCodeInAnyYear = Nt.maxLengthOfMonthCodeInAnyYear;
  }
}
class Rc extends Nc {
  constructor(e, n) {
    super(e, n), this.inLeapYear = Nt.inLeapYear, this.monthsInYear = Nt.monthsInYear, this.minimumMonthLength = Nt.minimumMonthLength, this.maximumMonthLength = Nt.maximumMonthLength, this.maxLengthOfMonthCodeInAnyYear = Nt.maxLengthOfMonthCodeInAnyYear;
  }
}
class fd extends md {
  constructor() {
    super("ethioaa", { year: -5492, month: 7, day: 17 });
  }
}
class gd extends Rc {
  constructor() {
    super("coptic", [{ code: "coptic", isoEpoch: { year: 284, month: 8, day: 29 } }, { code: "coptic-inverse", reverseOf: "coptic" }]);
  }
}
class pd extends Rc {
  constructor() {
    super("ethiopic", [{ code: "ethioaa", names: ["ethiopic-amete-alem", "mundi"], isoEpoch: { year: -5492, month: 7, day: 17 } }, { code: "ethiopic", names: ["incar"], isoEpoch: { year: 8, month: 8, day: 27 }, anchorEpoch: { year: 5501 } }]);
  }
}
class yd extends Ji {
  constructor() {
    super("roc", [{ code: "roc", names: ["minguo"], isoEpoch: { year: 1912, month: 1, day: 1 } }, { code: "roc-inverse", names: ["before-roc"], reverseOf: "roc" }]);
  }
}
class vd extends Mc {
  constructor() {
    super("buddhist", { year: -543, month: 1, day: 1 });
  }
}
class wd extends Ji {
  constructor() {
    super("gregory", [{ code: "gregory", names: ["ad", "ce"], isoEpoch: { year: 1, month: 1, day: 1 } }, { code: "gregory-inverse", names: ["be", "bce"], reverseOf: "gregory" }]);
  }
  reviseIntlEra(e) {
    let { era: n, eraYear: r } = e;
    return n === "b" && (n = "gregory-inverse"), n === "a" && (n = "gregory"), { era: n, eraYear: r };
  }
  getFirstDayOfWeek() {
    return 1;
  }
  getMinimalDaysInFirstWeek() {
    return 1;
  }
}
class bd extends Ji {
  constructor() {
    super("japanese", [{ code: "reiwa", isoEpoch: { year: 2019, month: 5, day: 1 }, anchorEpoch: { year: 2019, month: 5, day: 1 } }, { code: "heisei", isoEpoch: { year: 1989, month: 1, day: 8 }, anchorEpoch: { year: 1989, month: 1, day: 8 } }, { code: "showa", isoEpoch: { year: 1926, month: 12, day: 25 }, anchorEpoch: { year: 1926, month: 12, day: 25 } }, { code: "taisho", isoEpoch: { year: 1912, month: 7, day: 30 }, anchorEpoch: { year: 1912, month: 7, day: 30 } }, { code: "meiji", isoEpoch: { year: 1868, month: 9, day: 8 }, anchorEpoch: { year: 1868, month: 9, day: 8 } }, { code: "japanese", names: ["japanese", "gregory", "ad", "ce"], isoEpoch: { year: 1, month: 1, day: 1 } }, { code: "japanese-inverse", names: ["japanese-inverse", "gregory-inverse", "bc", "bce"], reverseOf: "japanese" }]), this.erasBeginMidYear = !0;
  }
  reviseIntlEra(e, n) {
    const { era: r, eraYear: o } = e, { year: i } = n;
    return this.eras.find(((a) => a.code === r)) ? { era: r, eraYear: o } : i < 1 ? { era: "japanese-inverse", eraYear: 1 - i } : { era: "japanese", eraYear: i };
  }
}
class Oc extends Yn {
  constructor() {
    super(...arguments), this.calendarType = "lunisolar";
  }
  inLeapYear(e, n) {
    const r = this.getMonthList(e.year, n);
    return Object.entries(r).length === 13;
  }
  monthsInYear(e, n) {
    return this.inLeapYear(e, n) ? 13 : 12;
  }
  minimumMonthLength() {
    return 29;
  }
  maximumMonthLength() {
    return 30;
  }
  maxLengthOfMonthCodeInAnyYear(e) {
    return ["M01L", "M09L", "M10L", "M11L", "M12L"].includes(e) ? 29 : 30;
  }
  monthDaySearchStartYear(e, n) {
    const r = { M01L: [1651, 1651], M02L: [1947, 1765], M03L: [1966, 1955], M04L: [1963, 1944], M05L: [1971, 1952], M06L: [1960, 1941], M07L: [1968, 1938], M08L: [1957, 1718], M09L: [1832, 1832], M10L: [1870, 1870], M11L: [1814, 1814], M12L: [1890, 1890] }[e] ?? [1972, 1972];
    return n < 30 ? r[0] : r[1];
  }
  getMonthList(e, n) {
    if (e === void 0) throw new TypeError("Missing year");
    const r = JSON.stringify({ func: "getMonthList", calendarYear: e, id: this.id }), o = n.get(r);
    if (o) return o;
    const i = this.getFormatter(), a = (w, x) => {
      const D = _c({ isoYear: w, isoMonth: 2, isoDay: 1 }), E = new Date(D);
      E.setUTCDate(x + 1);
      const _ = i.formatToParts(E), M = _.find(((A) => A.type === "month")).value, N = +_.find(((A) => A.type === "day")).value, H = _.find(((A) => A.type === "relatedYear"));
      let W;
      if (H === void 0) throw new RangeError(`Intl.DateTimeFormat.formatToParts lacks relatedYear in ${this.id} calendar. Try Node 14+ or modern browsers.`);
      return W = +H.value, { calendarMonthString: M, calendarDay: N, calendarYearToVerify: W };
    };
    let s = 17, { calendarMonthString: c, calendarDay: l, calendarYearToVerify: d } = a(e, s);
    c !== "1" && (s += 29, { calendarMonthString: c, calendarDay: l } = a(e, s)), s -= l - 5;
    const h = {};
    let f, g, y = 1, b = !1;
    do
      ({ calendarMonthString: c, calendarDay: l, calendarYearToVerify: d } = a(e, s)), f && (h[g].daysInMonth = f + 30 - l), d !== e ? b = !0 : (h[c] = { monthIndex: y++ }, s += 30), f = l, g = c;
    while (!b);
    return h[g].daysInMonth = f + 30 - l, n.set(r, h), h;
  }
  estimateIsoDate(e) {
    const { year: n, month: r } = e;
    return { year: n, month: r >= 12 ? 12 : r + 1, day: 1 };
  }
  adjustCalendarDate(e, n, r = "constrain", o = !1) {
    let { year: i, month: a, monthExtra: s, day: c, monthCode: l } = e;
    if (i === void 0) throw new TypeError("Missing property: year");
    if (o) {
      if (s && s !== "bis") throw new RangeError(`Unexpected leap month suffix: ${s}`);
      const d = Lt(a, s !== void 0), h = `${a}${s || ""}`, f = this.getMonthList(i, n)[h];
      if (f === void 0) throw new RangeError(`Unmatched month ${h} in Chinese year ${i}`);
      return a = f.monthIndex, { year: i, month: a, day: c, monthCode: d };
    }
    if (this.validateCalendarDate(e), a === void 0) {
      const d = this.getMonthList(i, n);
      let h = l.replace(/^M|L$/g, ((g) => g === "L" ? "bis" : ""));
      h[0] === "0" && (h = h.slice(1));
      let f = d[h];
      if (a = f && f.monthIndex, a === void 0 && l.endsWith("L") && l != "M13L" && r === "constrain") {
        const g = +l.replace(/^M0?|L$/g, "");
        f = d[g], f && (a = f.monthIndex, l = Lt(g));
      }
      if (a === void 0) throw new RangeError(`Unmatched month ${l} in Chinese year ${i}`);
    } else if (l === void 0) {
      const d = this.getMonthList(i, n), h = Object.entries(d), f = h.length;
      r === "reject" ? (be(a, 1, f), be(c, 1, this.maximumMonthLength())) : (a = Ze(a, 1, f), c = Ze(c, 1, this.maximumMonthLength()));
      const g = h.find(((y) => y[1].monthIndex === a));
      if (g === void 0) throw new RangeError(`Invalid month ${a} in Chinese year ${i}`);
      l = Lt(+g[0].replace("bis", ""), g[0].indexOf("bis") !== -1);
    } else {
      const d = this.getMonthList(i, n);
      let h = l.replace(/^M|L$/g, ((g) => g === "L" ? "bis" : ""));
      h[0] === "0" && (h = h.slice(1));
      const f = d[h];
      if (!f) throw new RangeError(`Unmatched monthCode ${l} in Chinese year ${i}`);
      if (a !== f.monthIndex) throw new RangeError(`monthCode ${l} doesn't correspond to month ${a} in Chinese year ${i}`);
    }
    return { ...e, year: i, month: a, monthCode: l, day: c };
  }
}
class xd extends Oc {
  constructor() {
    super(...arguments), this.id = "chinese";
  }
}
class Cd extends Oc {
  constructor() {
    super(...arguments), this.id = "dangi";
  }
}
class Dd {
  constructor(e) {
    this.helper = e;
  }
  extraFields(e) {
    return this.helper.hasEra && e.includes("year") ? ["era", "eraYear"] : [];
  }
  resolveFields(e) {
    if (this.helper.calendarType !== "lunisolar") {
      const n = new we();
      Qi(e, void 0, this.helper.monthsInYear({ year: e.year ?? 1972 }, n));
    }
  }
  dateToISO(e, n) {
    const r = new we(), o = this.helper.calendarToIsoDate(e, n, r);
    return r.setObject(o), o;
  }
  monthDayToISOReferenceDate(e, n) {
    const r = new we(), o = this.helper.monthDayFromFields(e, n, r);
    return r.setObject(o), o;
  }
  fieldKeysToIgnore(e) {
    const n = /* @__PURE__ */ new Set();
    for (let r = 0; r < e.length; r++) {
      const o = e[r];
      switch (n.add(o), o) {
        case "era":
          n.add("eraYear"), n.add("year");
          break;
        case "eraYear":
          n.add("era"), n.add("year");
          break;
        case "year":
          n.add("era"), n.add("eraYear");
          break;
        case "month":
          n.add("monthCode"), this.helper.erasBeginMidYear && (n.add("era"), n.add("eraYear"));
          break;
        case "monthCode":
          n.add("month"), this.helper.erasBeginMidYear && (n.add("era"), n.add("eraYear"));
          break;
        case "day":
          this.helper.erasBeginMidYear && (n.add("era"), n.add("eraYear"));
      }
    }
    return kc(n);
  }
  dateAdd(e, { years: n, months: r, weeks: o, days: i }, a) {
    const s = we.getCacheForObject(e), c = this.helper.isoToCalendarDate(e, s), l = this.helper.addCalendar(c, { years: n, months: r, weeks: o, days: i }, a, s), d = this.helper.calendarToIsoDate(l, "constrain", s);
    return we.getCacheForObject(d) || new we(s).setObject(d), d;
  }
  dateUntil(e, n, r) {
    const o = we.getCacheForObject(e), i = we.getCacheForObject(n), a = this.helper.isoToCalendarDate(e, o), s = this.helper.isoToCalendarDate(n, i);
    return this.helper.untilCalendar(a, s, r, o);
  }
  isoToDate(e, n) {
    const r = we.getCacheForObject(e), o = this.helper.isoToCalendarDate(e, r);
    if (n.dayOfWeek && (o.dayOfWeek = so.iso8601.isoToDate(e, { dayOfWeek: !0 }).dayOfWeek), n.dayOfYear) {
      const i = this.helper.startOfCalendarYear(o), a = this.helper.calendarDaysUntil(i, o, r);
      o.dayOfYear = a + 1;
    }
    if (n.weekOfYear && (o.weekOfYear = Tc(this.helper.id, e)), o.daysInWeek = 7, n.daysInMonth && (o.daysInMonth = this.helper.daysInMonth(o, r)), n.daysInYear) {
      const i = this.helper.startOfCalendarYear(o), a = this.helper.addCalendar(i, { years: 1 }, "constrain", r);
      o.daysInYear = this.helper.calendarDaysUntil(i, a, r);
    }
    return n.monthsInYear && (o.monthsInYear = this.helper.monthsInYear(o, r)), n.inLeapYear && (o.inLeapYear = this.helper.inLeapYear(o, r)), o;
  }
  getFirstDayOfWeek() {
    return this.helper.getFirstDayOfWeek();
  }
  getMinimalDaysInFirstWeek() {
    return this.helper.getMinimalDaysInFirstWeek();
  }
}
for (const t of [od, ud, pd, fd, gd, xd, Cd, yd, hd, vd, wd, bd, id, ad, sd, cd, ld, dd]) {
  const e = new t();
  so[e.id] = new Dd(e);
}
wi("calendarImpl", (function(t) {
  return so[t];
}));
const Zr = Intl.DateTimeFormat;
function An(t, e) {
  let n = m(t, e);
  return typeof n == "function" && (n = new Zr(m(t, Fs), n(m(t, gi))), (function(r, o, i) {
    const a = Yo(r);
    if (a === void 0) throw new TypeError("Missing slots for the given container");
    if (a[o] === void 0) throw new TypeError(`tried to reset ${o} which was not set`);
    a[o] = i;
  })(t, e, n)), n;
}
function yr(t) {
  return Xe(t, Ln);
}
class Hr {
  constructor(e = void 0, n = void 0) {
    (function(r, o, i) {
      const a = i !== void 0;
      let s;
      if (a) {
        const h = ["localeMatcher", "calendar", "numberingSystem", "hour12", "hourCycle", "timeZone", "weekday", "era", "year", "month", "day", "dayPeriod", "hour", "minute", "second", "fractionalSecondDigits", "timeZoneName", "formatMatcher", "dateStyle", "timeStyle"];
        s = (function(g) {
          if (g == null) throw new TypeError(`Expected object not ${g}`);
          return Object(g);
        })(i);
        const f = /* @__PURE__ */ Object.create(null);
        for (let g = 0; g < h.length; g++) {
          const y = h[g];
          Object.prototype.hasOwnProperty.call(s, y) && (f[y] = s[y]);
        }
        s = f;
      } else s = /* @__PURE__ */ Object.create(null);
      const c = new Zr(o, s), l = c.resolvedOptions();
      if (rn(r), a) {
        const h = Object.assign(/* @__PURE__ */ Object.create(null), l);
        for (const f in h) Object.prototype.hasOwnProperty.call(s, f) || delete h[f];
        h.hour12 = s.hour12, h.hourCycle = s.hourCycle, F(r, gi, h);
      } else F(r, gi, s);
      F(r, Fs, l.locale), F(r, Ln, c), F(r, Zn, l.timeZone), F(r, wr, l.calendar), F(r, Ys, $d), F(r, Ps, Rd), F(r, zs, Od), F(r, Us, Nd), F(r, js, Id), F(r, As, Ld);
      const d = a ? s.timeZone : void 0;
      if (d === void 0) F(r, fi, l.timeZone);
      else {
        const h = jo(d);
        if (h.startsWith("−")) throw new RangeError("Unicode minus (U+2212) is not supported in time zone offsets");
        F(r, fi, Ge(h));
      }
    })(this, e, n);
  }
  get format() {
    C(this, yr);
    const e = kd.bind(this);
    return Object.defineProperties(e, { length: { value: 1, enumerable: !1, writable: !1, configurable: !0 }, name: { value: "", enumerable: !1, writable: !1, configurable: !0 } }), e;
  }
  formatRange(e, n) {
    return C(this, yr), _d.call(this, e, n);
  }
  formatToParts(e, ...n) {
    return C(this, yr), Td.call(this, e, ...n);
  }
  formatRangeToParts(e, n) {
    return C(this, yr), Md.call(this, e, n);
  }
  resolvedOptions() {
    return C(this, yr), Ed.call(this);
  }
}
"formatToParts" in Zr.prototype || delete Hr.prototype.formatToParts, "formatRangeToParts" in Zr.prototype || delete Hr.prototype.formatRangeToParts;
const yt = function(t = void 0, e = void 0) {
  return new Hr(t, e);
};
function Ed() {
  const t = m(this, Ln).resolvedOptions();
  return t.timeZone = m(this, fi), t;
}
function kd(t, ...e) {
  let n, r, o = nr(t, this);
  return o.formatter ? (n = o.formatter, r = [Ct(o.epochNs, "floor")]) : (n = m(this, Ln), r = [t, ...e]), n.format(...r);
}
function Td(t, ...e) {
  let n, r, o = nr(t, this);
  return o.formatter ? (n = o.formatter, r = [Ct(o.epochNs, "floor")]) : (n = m(this, Ln), r = [t, ...e]), n.formatToParts(...r);
}
function _d(t, e) {
  if (t === void 0 || e === void 0) throw new TypeError("Intl.DateTimeFormat.formatRange requires two values");
  const n = Oo(t), r = Oo(e);
  let o, i = [n, r];
  if (Jt(n) !== Jt(r)) throw new TypeError("Intl.DateTimeFormat.formatRange accepts two values of the same type");
  if (Jt(n)) {
    if (!$c(n, r)) throw new TypeError("Intl.DateTimeFormat.formatRange accepts two values of the same type");
    const { epochNs: a, formatter: s } = nr(n, this), { epochNs: c, formatter: l } = nr(r, this);
    s && (o = s, i = [Ct(a, "floor"), Ct(c, "floor")]);
  }
  return o || (o = m(this, Ln)), o.formatRange(...i);
}
function Md(t, e) {
  if (t === void 0 || e === void 0) throw new TypeError("Intl.DateTimeFormat.formatRange requires two values");
  const n = Oo(t), r = Oo(e);
  let o, i = [n, r];
  if (Jt(n) !== Jt(r)) throw new TypeError("Intl.DateTimeFormat.formatRangeToParts accepts two values of the same type");
  if (Jt(n)) {
    if (!$c(n, r)) throw new TypeError("Intl.DateTimeFormat.formatRangeToParts accepts two values of the same type");
    const { epochNs: a, formatter: s } = nr(n, this), { epochNs: c, formatter: l } = nr(r, this);
    s && (o = s, i = [Ct(a, "floor"), Ct(c, "floor")]);
  }
  return o || (o = m(this, Ln)), o.formatRangeToParts(...i);
}
function co(t = {}, e = {}) {
  const n = Object.assign({}, t), r = ["year", "month", "day", "hour", "minute", "second", "weekday", "dayPeriod", "timeZoneName", "dateStyle", "timeStyle"];
  for (let o = 0; o < r.length; o++) {
    const i = r[o];
    n[i] = i in e ? e[i] : n[i], n[i] !== !1 && n[i] !== void 0 || delete n[i];
  }
  return n;
}
function Nd(t) {
  const e = co(t, { year: !1, month: !1, day: !1, weekday: !1, timeZoneName: !1, dateStyle: !1 });
  if (e.timeStyle !== "long" && e.timeStyle !== "full" || (delete e.timeStyle, Object.assign(e, { hour: "numeric", minute: "2-digit", second: "2-digit" })), !Vo(e)) {
    if (lo(t)) throw new TypeError(`cannot format Temporal.PlainTime with options [${Object.keys(t)}]`);
    Object.assign(e, { hour: "numeric", minute: "numeric", second: "numeric" });
  }
  return e;
}
function Rd(t) {
  const e = { short: { year: "2-digit", month: "numeric" }, medium: { year: "numeric", month: "short" }, long: { year: "numeric", month: "long" }, full: { year: "numeric", month: "long" } }, n = co(t, { day: !1, hour: !1, minute: !1, second: !1, weekday: !1, dayPeriod: !1, timeZoneName: !1, timeStyle: !1 });
  if ("dateStyle" in n && n.dateStyle) {
    const r = n.dateStyle;
    delete n.dateStyle, Object.assign(n, e[r]);
  }
  if (!("year" in n || "month" in n || "era" in n)) {
    if (lo(t)) throw new TypeError(`cannot format PlainYearMonth with options [${Object.keys(t)}]`);
    Object.assign(n, { year: "numeric", month: "numeric" });
  }
  return n;
}
function Od(t) {
  const e = { short: { month: "numeric", day: "numeric" }, medium: { month: "short", day: "numeric" }, long: { month: "long", day: "numeric" }, full: { month: "long", day: "numeric" } }, n = co(t, { year: !1, hour: !1, minute: !1, second: !1, weekday: !1, dayPeriod: !1, timeZoneName: !1, timeStyle: !1 });
  if ("dateStyle" in n && n.dateStyle) {
    const r = n.dateStyle;
    delete n.dateStyle, Object.assign(n, e[r]);
  }
  if (!("month" in n) && !("day" in n)) {
    if (lo(t)) throw new TypeError(`cannot format PlainMonthDay with options [${Object.keys(t)}]`);
    Object.assign(n, { month: "numeric", day: "numeric" });
  }
  return n;
}
function $d(t) {
  const e = co(t, { hour: !1, minute: !1, second: !1, dayPeriod: !1, timeZoneName: !1, timeStyle: !1 });
  if (!Ko(e)) {
    if (lo(t)) throw new TypeError(`cannot format PlainDate with options [${Object.keys(t)}]`);
    Object.assign(e, { year: "numeric", month: "numeric", day: "numeric" });
  }
  return e;
}
function Id(t) {
  const e = co(t, { timeZoneName: !1 });
  if ((e.timeStyle === "long" || e.timeStyle === "full") && (delete e.timeStyle, Object.assign(e, { hour: "numeric", minute: "2-digit", second: "2-digit" }), e.dateStyle) && (Object.assign(e, { short: { year: "numeric", month: "numeric", day: "numeric" }, medium: { year: "numeric", month: "short", day: "numeric" }, long: { year: "numeric", month: "long", day: "numeric" }, full: { year: "numeric", month: "long", day: "numeric", weekday: "long" } }[e.dateStyle]), delete e.dateStyle), !Vo(e) && !Ko(e)) {
    if (lo(t)) throw new TypeError(`cannot format PlainDateTime with options [${Object.keys(t)}]`);
    Object.assign(e, { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
  }
  return e;
}
function Ld(t) {
  let e = t;
  return Vo(e) || Ko(e) || (e = Object.assign({}, e, { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" })), e;
}
function Ko(t) {
  return "year" in t || "month" in t || "day" in t || "weekday" in t || "dateStyle" in t || "era" in t;
}
function Vo(t) {
  return "hour" in t || "minute" in t || "second" in t || "timeStyle" in t || "dayPeriod" in t || "fractionalSecondDigits" in t;
}
function lo(t) {
  return Ko(t) || Vo(t) || "dateStyle" in t || "timeStyle" in t || "timeZoneName" in t;
}
function Jt(t) {
  return le(t) || me(t) || ne(t) || q(t) || De(t) || at(t) || Ce(t);
}
function Oo(t) {
  return Jt(t) ? t : Uo(t);
}
function $c(t, e) {
  return !(!Jt(t) || !Jt(e) || me(t) && !me(e) || le(t) && !le(e) || ne(t) && !ne(e) || q(t) && !q(e) || De(t) && !De(e) || at(t) && !at(e) || Ce(t) && !Ce(e));
}
function nr(t, e) {
  if (me(t)) {
    const n = { isoDate: { year: 1970, month: 1, day: 1 }, time: m(t, de) };
    return { epochNs: Oe(m(e, Zn), n, "compatible"), formatter: An(e, Us) };
  }
  if (De(t)) {
    const n = m(t, T), r = m(e, wr);
    if (n !== r) throw new RangeError(`cannot format PlainYearMonth with calendar ${n} in locale with calendar ${r}`);
    const o = K(m(t, Y), { deltaDays: 0, hour: 12, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
    return { epochNs: Oe(m(e, Zn), o, "compatible"), formatter: An(e, Ps) };
  }
  if (at(t)) {
    const n = m(t, T), r = m(e, wr);
    if (n !== r) throw new RangeError(`cannot format PlainMonthDay with calendar ${n} in locale with calendar ${r}`);
    const o = K(m(t, Y), { deltaDays: 0, hour: 12, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
    return { epochNs: Oe(m(e, Zn), o, "compatible"), formatter: An(e, zs) };
  }
  if (le(t)) {
    const n = m(t, T), r = m(e, wr);
    if (n !== "iso8601" && n !== r) throw new RangeError(`cannot format PlainDate with calendar ${n} in locale with calendar ${r}`);
    const o = K(m(t, Y), { deltaDays: 0, hour: 12, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
    return { epochNs: Oe(m(e, Zn), o, "compatible"), formatter: An(e, Ys) };
  }
  if (ne(t)) {
    const n = m(t, T), r = m(e, wr);
    if (n !== "iso8601" && n !== r) throw new RangeError(`cannot format PlainDateTime with calendar ${n} in locale with calendar ${r}`);
    const o = m(t, re);
    return { epochNs: Oe(m(e, Zn), o, "compatible"), formatter: An(e, js) };
  }
  if (q(t)) throw new TypeError("Temporal.ZonedDateTime not supported in DateTimeFormat methods. Use toLocaleString() instead.");
  return Ce(t) ? { epochNs: m(t, S), formatter: An(e, As) } : {};
}
function Ic(t) {
  const e = /* @__PURE__ */ Object.create(null);
  return e.years = m(t, Ye), e.months = m(t, Pe), e.weeks = m(t, et), e.days = m(t, ze), e.hours = m(t, Ue), e.minutes = m(t, je), e.seconds = m(t, Ae), e.milliseconds = m(t, Fe), e.microseconds = m(t, qe), e.nanoseconds = m(t, tt), e;
}
Hr.prototype.constructor = yt, Object.defineProperty(yt, "prototype", { value: Hr.prototype, writable: !1, enumerable: !1, configurable: !1 }), yt.supportedLocalesOf = Zr.supportedLocalesOf, on(yt, "Intl.DateTimeFormat");
var Ds;
const { format: Sd, formatToParts: Yd } = ((Ds = Intl.DurationFormat) == null ? void 0 : Ds.prototype) ?? /* @__PURE__ */ Object.create(null);
function Lc(t) {
  Intl.DurationFormat.prototype.resolvedOptions.call(this);
  const e = Ic(bt(t));
  return Sd.call(this, e);
}
var Es;
(Es = Intl.DurationFormat) != null && Es.prototype && (Intl.DurationFormat.prototype.format = Lc, Intl.DurationFormat.prototype.formatToParts = function(t) {
  Intl.DurationFormat.prototype.resolvedOptions.call(this);
  const e = Ic(bt(t));
  return Yd.call(this, e);
});
class ea {
  constructor(e) {
    if (arguments.length < 1) throw new TypeError("missing argument: epochNanoseconds is required");
    sc(this, Ro(e));
  }
  get epochMilliseconds() {
    return C(this, Ce), Ct(m(this, S), "floor");
  }
  get epochNanoseconds() {
    return C(this, Ce), Dc(u.BigInt(m(this, S)));
  }
  add(e) {
    return C(this, Ce), ss("add", this, e);
  }
  subtract(e) {
    return C(this, Ce), ss("subtract", this, e);
  }
  until(e, n = void 0) {
    return C(this, Ce), es("until", this, e, n);
  }
  since(e, n = void 0) {
    return C(this, Ce), es("since", this, e, n);
  }
  round(e) {
    if (C(this, Ce), e === void 0) throw new TypeError("options parameter is required");
    const n = typeof e == "string" ? On("smallestUnit", e) : O(e), r = cr(n), o = Et(n, "halfExpand"), i = rt(n, "smallestUnit", "time", nn);
    return lr(r, { hour: 24, minute: 1440, second: 86400, millisecond: 864e5, microsecond: 864e8, nanosecond: 864e11 }[i], !0), Rt(Ni(m(this, S), r, i, o));
  }
  equals(e) {
    C(this, Ce);
    const n = Cr(e), r = m(this, S), o = m(n, S);
    return u.equal(u.BigInt(r), u.BigInt(o));
  }
  toString(e = void 0) {
    C(this, Ce);
    const n = O(e), r = Jr(n), o = Et(n, "trunc"), i = rt(n, "smallestUnit", "time", void 0);
    if (i === "hour") throw new RangeError('smallestUnit must be a time unit other than "hour"');
    let a = n.timeZone;
    a !== void 0 && (a = Ge(a));
    const { precision: s, unit: c, increment: l } = eo(i, r);
    return Ha(Rt(Ni(m(this, S), l, c, o)), a, s);
  }
  toJSON() {
    return C(this, Ce), Ha(this, void 0, "auto");
  }
  toLocaleString(e = void 0, n = void 0) {
    return C(this, Ce), new yt(e, n).format(this);
  }
  valueOf() {
    wn("Instant");
  }
  toZonedDateTimeISO(e) {
    C(this, Ce);
    const n = Ge(e);
    return Ne(m(this, S), n, "iso8601");
  }
  static fromEpochMilliseconds(e) {
    return Rt($t(Uo(e)));
  }
  static fromEpochNanoseconds(e) {
    return Rt(Ro(e));
  }
  static from(e) {
    return Cr(e);
  }
  static compare(e, n) {
    const r = Cr(e), o = Cr(n), i = m(r, S), a = m(o, S);
    return u.lessThan(i, a) ? -1 : u.greaterThan(i, a) ? 1 : 0;
  }
}
on(ea, "Temporal.Instant");
class ta {
  constructor(e, n, r, o = "iso8601") {
    const i = U(e), a = U(n), s = U(r), c = Qe(o === void 0 ? "iso8601" : ve(o));
    Mn(i, a, s), nc(this, { year: i, month: a, day: s }, c);
  }
  get calendarId() {
    return C(this, le), m(this, T);
  }
  get era() {
    return Ie(this, "era");
  }
  get eraYear() {
    return Ie(this, "eraYear");
  }
  get year() {
    return Ie(this, "year");
  }
  get month() {
    return Ie(this, "month");
  }
  get monthCode() {
    return Ie(this, "monthCode");
  }
  get day() {
    return Ie(this, "day");
  }
  get dayOfWeek() {
    return Ie(this, "dayOfWeek");
  }
  get dayOfYear() {
    return Ie(this, "dayOfYear");
  }
  get weekOfYear() {
    var e;
    return (e = Ie(this, "weekOfYear")) == null ? void 0 : e.week;
  }
  get yearOfWeek() {
    var e;
    return (e = Ie(this, "weekOfYear")) == null ? void 0 : e.year;
  }
  get daysInWeek() {
    return Ie(this, "daysInWeek");
  }
  get daysInMonth() {
    return Ie(this, "daysInMonth");
  }
  get daysInYear() {
    return Ie(this, "daysInYear");
  }
  get monthsInYear() {
    return Ie(this, "monthsInYear");
  }
  get inLeapYear() {
    return Ie(this, "inLeapYear");
  }
  with(e, n = void 0) {
    if (C(this, le), !ue(e)) throw new TypeError("invalid argument");
    sr(e);
    const r = m(this, T);
    let o = Ke(r, m(this, Y));
    return o = _n(r, o, ut(r, e, ["year", "month", "monthCode", "day"], [], "partial")), We(pn(r, o, G(O(n))), r);
  }
  withCalendar(e) {
    C(this, le);
    const n = oo(e);
    return We(m(this, Y), n);
  }
  add(e, n = void 0) {
    return C(this, le), cs("add", this, e, n);
  }
  subtract(e, n = void 0) {
    return C(this, le), cs("subtract", this, e, n);
  }
  until(e, n = void 0) {
    return C(this, le), ts("until", this, e, n);
  }
  since(e, n = void 0) {
    return C(this, le), ts("since", this, e, n);
  }
  equals(e) {
    C(this, le);
    const n = br(e);
    return Pt(m(this, Y), m(n, Y)) === 0 && St(m(this, T), m(n, T));
  }
  toString(e = void 0) {
    return C(this, le), Wa(this, Br(O(e)));
  }
  toJSON() {
    return C(this, le), Wa(this);
  }
  toLocaleString(e = void 0, n = void 0) {
    return C(this, le), new yt(e, n).format(this);
  }
  valueOf() {
    wn("PlainDate");
  }
  toPlainDateTime(e = void 0) {
    C(this, le);
    const n = tc(e);
    return gt(K(m(this, Y), n), m(this, T));
  }
  toZonedDateTime(e) {
    let n, r;
    if (C(this, le), ue(e)) {
      const a = e.timeZone;
      a === void 0 ? n = Ge(e) : (n = Ge(a), r = e.plainTime);
    } else n = Ge(e);
    const o = m(this, Y);
    let i;
    return r === void 0 ? i = an(n, o) : (r = ln(r), i = Oe(n, K(o, m(r, de)), "compatible")), Ne(i, n, m(this, T));
  }
  toPlainYearMonth() {
    C(this, le);
    const e = m(this, T);
    return Kn(Ur(e, Ke(e, m(this, Y)), "constrain"), e);
  }
  toPlainMonthDay() {
    C(this, le);
    const e = m(this, T);
    return Gn(ko(e, Ke(e, m(this, Y)), "constrain"), e);
  }
  static from(e, n = void 0) {
    return br(e, n);
  }
  static compare(e, n) {
    const r = br(e), o = br(n);
    return Pt(m(r, Y), m(o, Y));
  }
}
function Ie(t, e) {
  C(t, le);
  const n = m(t, Y);
  return to(t).isoToDate(n, { [e]: !0 })[e];
}
on(ta, "Temporal.PlainDate");
class na {
  constructor(e, n, r, o = 0, i = 0, a = 0, s = 0, c = 0, l = 0, d = "iso8601") {
    const h = U(e), f = U(n), g = U(r), y = o === void 0 ? 0 : U(o), b = i === void 0 ? 0 : U(i), w = a === void 0 ? 0 : U(a), x = s === void 0 ? 0 : U(s), D = c === void 0 ? 0 : U(c), E = l === void 0 ? 0 : U(l), _ = Qe(d === void 0 ? "iso8601" : ve(d));
    Gi(h, f, g, y, b, w, x, D, E), rc(this, { isoDate: { year: h, month: f, day: g }, time: { hour: y, minute: b, second: w, millisecond: x, microsecond: D, nanosecond: E } }, _);
  }
  get calendarId() {
    return C(this, ne), m(this, T);
  }
  get year() {
    return Le(this, "year");
  }
  get month() {
    return Le(this, "month");
  }
  get monthCode() {
    return Le(this, "monthCode");
  }
  get day() {
    return Le(this, "day");
  }
  get hour() {
    return Fn(this, "hour");
  }
  get minute() {
    return Fn(this, "minute");
  }
  get second() {
    return Fn(this, "second");
  }
  get millisecond() {
    return Fn(this, "millisecond");
  }
  get microsecond() {
    return Fn(this, "microsecond");
  }
  get nanosecond() {
    return Fn(this, "nanosecond");
  }
  get era() {
    return Le(this, "era");
  }
  get eraYear() {
    return Le(this, "eraYear");
  }
  get dayOfWeek() {
    return Le(this, "dayOfWeek");
  }
  get dayOfYear() {
    return Le(this, "dayOfYear");
  }
  get weekOfYear() {
    var e;
    return (e = Le(this, "weekOfYear")) == null ? void 0 : e.week;
  }
  get yearOfWeek() {
    var e;
    return (e = Le(this, "weekOfYear")) == null ? void 0 : e.year;
  }
  get daysInWeek() {
    return Le(this, "daysInWeek");
  }
  get daysInYear() {
    return Le(this, "daysInYear");
  }
  get daysInMonth() {
    return Le(this, "daysInMonth");
  }
  get monthsInYear() {
    return Le(this, "monthsInYear");
  }
  get inLeapYear() {
    return Le(this, "inLeapYear");
  }
  with(e, n = void 0) {
    if (C(this, ne), !ue(e)) throw new TypeError("invalid argument");
    sr(e);
    const r = m(this, T), o = m(this, re);
    let i = { ...Ke(r, o.isoDate), ...o.time };
    return i = _n(r, i, ut(r, e, ["year", "month", "monthCode", "day"], ["hour", "minute", "second", "millisecond", "microsecond", "nanosecond"], "partial")), gt(no(r, i, G(O(n))), r);
  }
  withPlainTime(e = void 0) {
    C(this, ne);
    const n = tc(e);
    return gt(K(m(this, re).isoDate, n), m(this, T));
  }
  withCalendar(e) {
    C(this, ne);
    const n = oo(e);
    return gt(m(this, re), n);
  }
  add(e, n = void 0) {
    return C(this, ne), ls("add", this, e, n);
  }
  subtract(e, n = void 0) {
    return C(this, ne), ls("subtract", this, e, n);
  }
  until(e, n = void 0) {
    return C(this, ne), ns("until", this, e, n);
  }
  since(e, n = void 0) {
    return C(this, ne), ns("since", this, e, n);
  }
  round(e) {
    if (C(this, ne), e === void 0) throw new TypeError("options parameter is required");
    const n = typeof e == "string" ? On("smallestUnit", e) : O(e), r = cr(n), o = Et(n, "halfExpand"), i = rt(n, "smallestUnit", "time", nn, ["day"]), a = { day: 1, hour: 24, minute: 60, second: 60, millisecond: 1e3, microsecond: 1e3, nanosecond: 1e3 }[i];
    lr(r, a, a === 1);
    const s = m(this, re);
    return gt(r === 1 && i === "nanosecond" ? s : Ri(s, r, i, o), m(this, T));
  }
  equals(e) {
    C(this, ne);
    const n = xr(e);
    return tr(m(this, re), m(n, re)) === 0 && St(m(this, T), m(n, T));
  }
  toString(e = void 0) {
    C(this, ne);
    const n = O(e), r = Br(n), o = Jr(n), i = Et(n, "trunc"), a = rt(n, "smallestUnit", "time", void 0);
    if (a === "hour") throw new RangeError('smallestUnit must be a time unit other than "hour"');
    const { precision: s, unit: c, increment: l } = eo(a, o), d = Ri(m(this, re), l, c, i);
    return Nn(d), Ar(d, m(this, T), s, r);
  }
  toJSON() {
    return C(this, ne), Ar(m(this, re), m(this, T), "auto");
  }
  toLocaleString(e = void 0, n = void 0) {
    return C(this, ne), new yt(e, n).format(this);
  }
  valueOf() {
    wn("PlainDateTime");
  }
  toZonedDateTime(e, n = void 0) {
    C(this, ne);
    const r = Ge(e), o = Rr(O(n));
    return Ne(Oe(r, m(this, re), o), r, m(this, T));
  }
  toPlainDate() {
    return C(this, ne), We(m(this, re).isoDate, m(this, T));
  }
  toPlainTime() {
    return C(this, ne), Kt(m(this, re).time);
  }
  static from(e, n = void 0) {
    return xr(e, n);
  }
  static compare(e, n) {
    const r = xr(e), o = xr(n);
    return tr(m(r, re), m(o, re));
  }
}
function Le(t, e) {
  C(t, ne);
  const n = m(t, re).isoDate;
  return to(t).isoToDate(n, { [e]: !0 })[e];
}
function Fn(t, e) {
  return C(t, ne), m(t, re).time[e];
}
on(na, "Temporal.PlainDateTime");
class rr {
  constructor(e = 0, n = 0, r = 0, o = 0, i = 0, a = 0, s = 0, c = 0, l = 0, d = 0) {
    const h = e === void 0 ? 0 : Dt(e), f = n === void 0 ? 0 : Dt(n), g = r === void 0 ? 0 : Dt(r), y = o === void 0 ? 0 : Dt(o), b = i === void 0 ? 0 : Dt(i), w = a === void 0 ? 0 : Dt(a), x = s === void 0 ? 0 : Dt(s), D = c === void 0 ? 0 : Dt(c), E = l === void 0 ? 0 : Dt(l), _ = d === void 0 ? 0 : Dt(d);
    Wo(h, f, g, y, b, w, x, D, E, _), rn(this), F(this, Ye, h), F(this, Pe, f), F(this, et, g), F(this, ze, y), F(this, Ue, b), F(this, je, w), F(this, Ae, x), F(this, Fe, D), F(this, qe, E), F(this, tt, _);
  }
  get years() {
    return C(this, ce), m(this, Ye);
  }
  get months() {
    return C(this, ce), m(this, Pe);
  }
  get weeks() {
    return C(this, ce), m(this, et);
  }
  get days() {
    return C(this, ce), m(this, ze);
  }
  get hours() {
    return C(this, ce), m(this, Ue);
  }
  get minutes() {
    return C(this, ce), m(this, je);
  }
  get seconds() {
    return C(this, ce), m(this, Ae);
  }
  get milliseconds() {
    return C(this, ce), m(this, Fe);
  }
  get microseconds() {
    return C(this, ce), m(this, qe);
  }
  get nanoseconds() {
    return C(this, ce), m(this, tt);
  }
  get sign() {
    return C(this, ce), Mo(this);
  }
  get blank() {
    return C(this, ce), Mo(this) === 0;
  }
  with(e) {
    C(this, ce);
    const n = ec(e), { years: r = m(this, Ye), months: o = m(this, Pe), weeks: i = m(this, et), days: a = m(this, ze), hours: s = m(this, Ue), minutes: c = m(this, je), seconds: l = m(this, Ae), milliseconds: d = m(this, Fe), microseconds: h = m(this, qe), nanoseconds: f = m(this, tt) } = n;
    return new rr(r, o, i, a, s, c, l, d, h, f);
  }
  negated() {
    return C(this, ce), it(this);
  }
  abs() {
    return C(this, ce), new rr(Math.abs(m(this, Ye)), Math.abs(m(this, Pe)), Math.abs(m(this, et)), Math.abs(m(this, ze)), Math.abs(m(this, Ue)), Math.abs(m(this, je)), Math.abs(m(this, Ae)), Math.abs(m(this, Fe)), Math.abs(m(this, qe)), Math.abs(m(this, tt)));
  }
  add(e) {
    return C(this, ce), as("add", this, e);
  }
  subtract(e) {
    return C(this, ce), as("subtract", this, e);
  }
  round(e) {
    if (C(this, ce), e === void 0) throw new TypeError("options parameter is required");
    const n = Wt(this), r = typeof e == "string" ? On("smallestUnit", e) : O(e);
    let o = rt(r, "largestUnit", "datetime", void 0, ["auto"]), { plainRelativeTo: i, zonedRelativeTo: a } = ii(r);
    const s = cr(r), c = Et(r, "halfExpand");
    let l = rt(r, "smallestUnit", "datetime", void 0), d = !0;
    l || (d = !1, l = "nanosecond");
    const h = Xt(n, l);
    let f = !0;
    if (o || (f = !1, o = h), o === "auto" && (o = h), !d && !f) throw new RangeError("at least one of smallestUnit or largestUnit is required");
    if (Xt(o, l) !== o) throw new RangeError(`largestUnit ${o} cannot be smaller than smallestUnit ${l}`);
    const g = { hour: 24, minute: 60, second: 60, millisecond: 1e3, microsecond: 1e3, nanosecond: 1e3 }[l];
    if (g !== void 0 && lr(s, g, !1), s > 1 && Gt(l) === "date" && o !== l) throw new RangeError("For calendar units with roundingIncrement > 1, use largestUnit = smallestUnit");
    if (a) {
      let b = Hn(this);
      const w = m(a, X), x = m(a, T), D = m(a, S);
      return b = Cc(D, kr(D, w, x, b), w, x, o, s, l, c), Gt(o) === "date" && (o = "hour"), pt(b, o);
    }
    if (i) {
      let b = Ot(this);
      const w = er({ hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }, b.time), x = m(i, Y), D = m(i, T), E = lt(D, x, Re(b.date, w.deltaDays), "constrain");
      return b = xc(K(x, { deltaDays: 0, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }), K(E, w), D, o, s, l, c), pt(b, o);
    }
    if (Tt(n)) throw new RangeError(`a starting point is required for ${n}s balancing`);
    if (Tt(o)) throw new RangeError(`a starting point is required for ${o}s balancing`);
    let y = Ot(this);
    if (l === "day") {
      const { quotient: b, remainder: w } = y.time.divmod(Co);
      let x = y.date.days + b + Or(w, "day");
      x = dn(x, s, c), y = Qt({ years: 0, months: 0, weeks: 0, days: x }, Z.ZERO);
    } else y = Qt({ years: 0, months: 0, weeks: 0, days: 0 }, No(y.time, s, l, c));
    return pt(y, o);
  }
  total(e) {
    if (C(this, ce), e === void 0) throw new TypeError("options argument is required");
    const n = typeof e == "string" ? On("unit", e) : O(e);
    let { plainRelativeTo: r, zonedRelativeTo: o } = ii(n);
    const i = rt(n, "unit", "datetime", nn);
    if (o) {
      const s = Hn(this), c = m(o, X), l = m(o, T), d = m(o, S);
      return (function(h, f, g, y, b) {
        return Gt(b) === "time" ? Or(Z.fromEpochNsDiff(f, h), b) : Ja(wc(h, f, g, y, b), f, xt(g, h), g, y, b);
      })(d, kr(d, c, l, s), c, l, i);
    }
    if (r) {
      const s = Ot(this);
      let c = er({ hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }, s.time);
      const l = m(r, Y), d = m(r, T), h = lt(d, l, Re(s.date, c.deltaDays), "constrain");
      return (function(f, g, y, b) {
        if (tr(f, g) == 0) return 0;
        Nn(f), Nn(g);
        const w = vc(f, g, y, b);
        return b === "nanosecond" ? u.toNumber(w.time.totalNs) : Ja(w, Te(g), f, null, y, b);
      })(K(l, { deltaDays: 0, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }), K(h, c), d, i);
    }
    const a = Wt(this);
    if (Tt(a)) throw new RangeError(`a starting point is required for ${a}s total`);
    if (Tt(i)) throw new RangeError(`a starting point is required for ${i}s total`);
    return Or(Ot(this).time, i);
  }
  toString(e = void 0) {
    C(this, ce);
    const n = O(e), r = Jr(n), o = Et(n, "trunc"), i = rt(n, "smallestUnit", "time", void 0);
    if (i === "hour" || i === "minute") throw new RangeError('smallestUnit must be a time unit other than "hours" or "minutes"');
    const { precision: a, unit: s, increment: c } = eo(i, r);
    if (s === "nanosecond" && c === 1) return fo(this, a);
    const l = Wt(this);
    let d = Hn(this);
    const h = No(d.time, c, s, o);
    return d = Qt(d.date, h), fo(pt(d, Xt(l, "second")), a);
  }
  toJSON() {
    return C(this, ce), fo(this, "auto");
  }
  toLocaleString(e = void 0, n = void 0) {
    if (C(this, ce), typeof Intl.DurationFormat == "function") {
      const r = new Intl.DurationFormat(e, n);
      return Lc.call(r, this);
    }
    return console.warn("Temporal.Duration.prototype.toLocaleString() requires Intl.DurationFormat."), fo(this, "auto");
  }
  valueOf() {
    wn("Duration");
  }
  static from(e) {
    return bt(e);
  }
  static compare(e, n, r = void 0) {
    const o = bt(e), i = bt(n), a = O(r), { plainRelativeTo: s, zonedRelativeTo: c } = ii(a);
    if (m(o, Ye) === m(i, Ye) && m(o, Pe) === m(i, Pe) && m(o, et) === m(i, et) && m(o, ze) === m(i, ze) && m(o, Ue) === m(i, Ue) && m(o, je) === m(i, je) && m(o, Ae) === m(i, Ae) && m(o, Fe) === m(i, Fe) && m(o, qe) === m(i, qe) && m(o, tt) === m(i, tt)) return 0;
    const l = Wt(o), d = Wt(i), h = Hn(o), f = Hn(i);
    if (c && (Gt(l) === "date" || Gt(d) === "date")) {
      const x = m(c, X), D = m(c, T), E = m(c, S), _ = kr(E, x, D, h), M = kr(E, x, D, f);
      return nt(u.toNumber(u.subtract(_, M)));
    }
    let g = h.date.days, y = f.date.days;
    if (Tt(l) || Tt(d)) {
      if (!s) throw new RangeError("A starting point is required for years, months, or weeks comparison");
      g = Ba(h.date, s), y = Ba(f.date, s);
    }
    const b = h.time.add24HourDays(g), w = f.time.add24HourDays(y);
    return b.cmp(w);
  }
}
on(rr, "Temporal.Duration");
class ra {
  constructor(e, n, r = "iso8601", o = 1972) {
    const i = U(e), a = U(n), s = Qe(r === void 0 ? "iso8601" : ve(r)), c = U(o);
    Mn(c, i, a), oc(this, { year: c, month: i, day: a }, s);
  }
  get monthCode() {
    return fs(this, "monthCode");
  }
  get day() {
    return fs(this, "day");
  }
  get calendarId() {
    return C(this, at), m(this, T);
  }
  with(e, n = void 0) {
    if (C(this, at), !ue(e)) throw new TypeError("invalid argument");
    sr(e);
    const r = m(this, T);
    let o = Ke(r, m(this, Y), "month-day");
    return o = _n(r, o, ut(r, e, ["year", "month", "monthCode", "day"], [], "partial")), Gn(ko(r, o, G(O(n))), r);
  }
  equals(e) {
    C(this, at);
    const n = qa(e);
    return Pt(m(this, Y), m(n, Y)) === 0 && St(m(this, T), m(n, T));
  }
  toString(e = void 0) {
    return C(this, at), Ka(this, Br(O(e)));
  }
  toJSON() {
    return C(this, at), Ka(this);
  }
  toLocaleString(e = void 0, n = void 0) {
    return C(this, at), new yt(e, n).format(this);
  }
  valueOf() {
    wn("PlainMonthDay");
  }
  toPlainDate(e) {
    if (C(this, at), !ue(e)) throw new TypeError("argument should be an object");
    const n = m(this, T);
    return We(pn(n, _n(n, Ke(n, m(this, Y), "month-day"), ut(n, e, ["year"], [], [])), "constrain"), n);
  }
  static from(e, n = void 0) {
    return qa(e, n);
  }
}
function fs(t, e) {
  C(t, at);
  const n = m(t, Y);
  return to(t).isoToDate(n, { [e]: !0 })[e];
}
function si(t) {
  return xt(t, Ii());
}
on(ra, "Temporal.PlainMonthDay");
const Sc = { instant: () => Rt(Ii()), plainDateTimeISO: (t = pr()) => gt(si(Ge(t)), "iso8601"), plainDateISO: (t = pr()) => We(si(Ge(t)).isoDate, "iso8601"), plainTimeISO: (t = pr()) => Kt(si(Ge(t)).time), timeZoneId: () => pr(), zonedDateTimeISO: (t = pr()) => {
  const e = Ge(t);
  return Ne(Ii(), e, "iso8601");
}, [Symbol.toStringTag]: "Temporal.Now" };
Object.defineProperty(Sc, Symbol.toStringTag, { value: "Temporal.Now", writable: !1, enumerable: !1, configurable: !0 });
class uo {
  constructor(e = 0, n = 0, r = 0, o = 0, i = 0, a = 0) {
    const s = e === void 0 ? 0 : U(e), c = n === void 0 ? 0 : U(n), l = r === void 0 ? 0 : U(r), d = o === void 0 ? 0 : U(o), h = i === void 0 ? 0 : U(i), f = a === void 0 ? 0 : U(a);
    Ho(s, c, l, d, h, f), ic(this, { hour: s, minute: c, second: l, millisecond: d, microsecond: h, nanosecond: f });
  }
  get hour() {
    return C(this, me), m(this, de).hour;
  }
  get minute() {
    return C(this, me), m(this, de).minute;
  }
  get second() {
    return C(this, me), m(this, de).second;
  }
  get millisecond() {
    return C(this, me), m(this, de).millisecond;
  }
  get microsecond() {
    return C(this, me), m(this, de).microsecond;
  }
  get nanosecond() {
    return C(this, me), m(this, de).nanosecond;
  }
  with(e, n = void 0) {
    if (C(this, me), !ue(e)) throw new TypeError("invalid argument");
    sr(e);
    const r = Di(e, "partial"), o = Di(this);
    let { hour: i, minute: a, second: s, millisecond: c, microsecond: l, nanosecond: d } = Object.assign(o, r);
    const h = G(O(n));
    return { hour: i, minute: a, second: s, millisecond: c, microsecond: l, nanosecond: d } = Fo(i, a, s, c, l, d, h), new uo(i, a, s, c, l, d);
  }
  add(e) {
    return C(this, me), ds("add", this, e);
  }
  subtract(e) {
    return C(this, me), ds("subtract", this, e);
  }
  until(e, n = void 0) {
    return C(this, me), rs("until", this, e, n);
  }
  since(e, n = void 0) {
    return C(this, me), rs("since", this, e, n);
  }
  round(e) {
    if (C(this, me), e === void 0) throw new TypeError("options parameter is required");
    const n = typeof e == "string" ? On("smallestUnit", e) : O(e), r = cr(n), o = Et(n, "halfExpand"), i = rt(n, "smallestUnit", "time", nn);
    return lr(r, { hour: 24, minute: 60, second: 60, millisecond: 1e3, microsecond: 1e3, nanosecond: 1e3 }[i], !1), Kt(Oi(m(this, de), r, i, o));
  }
  equals(e) {
    C(this, me);
    const n = ln(e);
    return $i(m(this, de), m(n, de)) === 0;
  }
  toString(e = void 0) {
    C(this, me);
    const n = O(e), r = Jr(n), o = Et(n, "trunc"), i = rt(n, "smallestUnit", "time", void 0);
    if (i === "hour") throw new RangeError('smallestUnit must be a time unit other than "hour"');
    const { precision: a, unit: s, increment: c } = eo(i, r);
    return Ga(Oi(m(this, de), c, s, o), a);
  }
  toJSON() {
    return C(this, me), Ga(m(this, de), "auto");
  }
  toLocaleString(e = void 0, n = void 0) {
    return C(this, me), new yt(e, n).format(this);
  }
  valueOf() {
    wn("PlainTime");
  }
  static from(e, n = void 0) {
    return ln(e, n);
  }
  static compare(e, n) {
    const r = ln(e), o = ln(n);
    return $i(m(r, de), m(o, de));
  }
}
on(uo, "Temporal.PlainTime");
class oa {
  constructor(e, n, r = "iso8601", o = 1) {
    const i = U(e), a = U(n), s = Qe(r === void 0 ? "iso8601" : ve(r)), c = U(o);
    Mn(i, a, c), ac(this, { year: i, month: a, day: c }, s);
  }
  get year() {
    return Zt(this, "year");
  }
  get month() {
    return Zt(this, "month");
  }
  get monthCode() {
    return Zt(this, "monthCode");
  }
  get calendarId() {
    return C(this, De), m(this, T);
  }
  get era() {
    return Zt(this, "era");
  }
  get eraYear() {
    return Zt(this, "eraYear");
  }
  get daysInMonth() {
    return Zt(this, "daysInMonth");
  }
  get daysInYear() {
    return Zt(this, "daysInYear");
  }
  get monthsInYear() {
    return Zt(this, "monthsInYear");
  }
  get inLeapYear() {
    return Zt(this, "inLeapYear");
  }
  with(e, n = void 0) {
    if (C(this, De), !ue(e)) throw new TypeError("invalid argument");
    sr(e);
    const r = m(this, T);
    let o = Ke(r, m(this, Y), "year-month");
    return o = _n(r, o, ut(r, e, ["year", "month", "monthCode"], [], "partial")), Kn(Ur(r, o, G(O(n))), r);
  }
  add(e, n = void 0) {
    return C(this, De), us("add", this, e, n);
  }
  subtract(e, n = void 0) {
    return C(this, De), us("subtract", this, e, n);
  }
  until(e, n = void 0) {
    return C(this, De), os("until", this, e, n);
  }
  since(e, n = void 0) {
    return C(this, De), os("since", this, e, n);
  }
  equals(e) {
    C(this, De);
    const n = Dr(e);
    return Pt(m(this, Y), m(n, Y)) === 0 && St(m(this, T), m(n, T));
  }
  toString(e = void 0) {
    return C(this, De), Va(this, Br(O(e)));
  }
  toJSON() {
    return C(this, De), Va(this);
  }
  toLocaleString(e = void 0, n = void 0) {
    return C(this, De), new yt(e, n).format(this);
  }
  valueOf() {
    wn("PlainYearMonth");
  }
  toPlainDate(e) {
    if (C(this, De), !ue(e)) throw new TypeError("argument should be an object");
    const n = m(this, T);
    return We(pn(n, _n(n, Ke(n, m(this, Y), "year-month"), ut(n, e, ["day"], [], [])), "constrain"), n);
  }
  static from(e, n = void 0) {
    return Dr(e, n);
  }
  static compare(e, n) {
    const r = Dr(e), o = Dr(n);
    return Pt(m(r, Y), m(o, Y));
  }
}
function Zt(t, e) {
  C(t, De);
  const n = m(t, Y);
  return to(t).isoToDate(n, { [e]: !0 })[e];
}
on(oa, "Temporal.PlainYearMonth");
const Pd = yt.prototype.resolvedOptions;
class ia {
  constructor(e, n, r = "iso8601") {
    if (arguments.length < 1) throw new TypeError("missing argument: epochNanoseconds is required");
    const o = Ro(e);
    let i = ve(n);
    const { tzName: a, offsetMinutes: s } = hn(i);
    if (s === void 0) {
      const c = To(a);
      if (!c) throw new RangeError(`unknown time zone ${a}`);
      i = c.identifier;
    } else i = Zi(s);
    cc(this, o, i, Qe(r === void 0 ? "iso8601" : ve(r)));
  }
  get calendarId() {
    return C(this, q), m(this, T);
  }
  get timeZoneId() {
    return C(this, q), m(this, X);
  }
  get year() {
    return Se(this, "year");
  }
  get month() {
    return Se(this, "month");
  }
  get monthCode() {
    return Se(this, "monthCode");
  }
  get day() {
    return Se(this, "day");
  }
  get hour() {
    return qn(this, "hour");
  }
  get minute() {
    return qn(this, "minute");
  }
  get second() {
    return qn(this, "second");
  }
  get millisecond() {
    return qn(this, "millisecond");
  }
  get microsecond() {
    return qn(this, "microsecond");
  }
  get nanosecond() {
    return qn(this, "nanosecond");
  }
  get era() {
    return Se(this, "era");
  }
  get eraYear() {
    return Se(this, "eraYear");
  }
  get epochMilliseconds() {
    return C(this, q), Ct(m(this, S), "floor");
  }
  get epochNanoseconds() {
    return C(this, q), Dc(m(this, S));
  }
  get dayOfWeek() {
    return Se(this, "dayOfWeek");
  }
  get dayOfYear() {
    return Se(this, "dayOfYear");
  }
  get weekOfYear() {
    var e;
    return (e = Se(this, "weekOfYear")) == null ? void 0 : e.week;
  }
  get yearOfWeek() {
    var e;
    return (e = Se(this, "weekOfYear")) == null ? void 0 : e.year;
  }
  get hoursInDay() {
    C(this, q);
    const e = m(this, X), n = kt(this).isoDate, r = ot(n.year, n.month, n.day + 1), o = an(e, n), i = an(e, r);
    return Or(Z.fromEpochNsDiff(i, o), "hour");
  }
  get daysInWeek() {
    return Se(this, "daysInWeek");
  }
  get daysInMonth() {
    return Se(this, "daysInMonth");
  }
  get daysInYear() {
    return Se(this, "daysInYear");
  }
  get monthsInYear() {
    return Se(this, "monthsInYear");
  }
  get inLeapYear() {
    return Se(this, "inLeapYear");
  }
  get offset() {
    return C(this, q), Ei(Vt(m(this, X), m(this, S)));
  }
  get offsetNanoseconds() {
    return C(this, q), Vt(m(this, X), m(this, S));
  }
  with(e, n = void 0) {
    if (C(this, q), !ue(e)) throw new TypeError("invalid zoned-date-time-like");
    sr(e);
    const r = m(this, T), o = m(this, X), i = Vt(o, m(this, S)), a = kt(this);
    let s = { ...Ke(r, a.isoDate), ...a.time, offset: Ei(i) };
    s = _n(r, s, ut(r, e, ["year", "month", "monthCode", "day"], ["hour", "minute", "second", "millisecond", "microsecond", "nanosecond", "offset"], "partial"));
    const c = O(n), l = Rr(c), d = yo(c, "prefer"), h = no(r, s, G(c)), f = dr(s.offset);
    return Ne(Eo(h.isoDate, h.time, "option", f, o, l, d, !1), o, r);
  }
  withPlainTime(e = void 0) {
    C(this, q);
    const n = m(this, X), r = m(this, T), o = kt(this).isoDate;
    let i;
    return i = e === void 0 ? an(n, o) : Oe(n, K(o, m(ln(e), de)), "compatible"), Ne(i, n, r);
  }
  withTimeZone(e) {
    C(this, q);
    const n = Ge(e);
    return Ne(m(this, S), n, m(this, T));
  }
  withCalendar(e) {
    C(this, q);
    const n = oo(e);
    return Ne(m(this, S), m(this, X), n);
  }
  add(e, n = void 0) {
    return C(this, q), hs("add", this, e, n);
  }
  subtract(e, n = void 0) {
    return C(this, q), hs("subtract", this, e, n);
  }
  until(e, n = void 0) {
    return C(this, q), is("until", this, e, n);
  }
  since(e, n = void 0) {
    return C(this, q), is("since", this, e, n);
  }
  round(e) {
    if (C(this, q), e === void 0) throw new TypeError("options parameter is required");
    const n = typeof e == "string" ? On("smallestUnit", e) : O(e), r = cr(n), o = Et(n, "halfExpand"), i = rt(n, "smallestUnit", "time", nn, ["day"]), a = { day: 1, hour: 24, minute: 60, second: 60, millisecond: 1e3, microsecond: 1e3, nanosecond: 1e3 }[i];
    if (lr(r, a, a === 1), i === "nanosecond" && r === 1) return Ne(m(this, S), m(this, X), m(this, T));
    const s = m(this, X), c = m(this, S), l = kt(this);
    let d;
    if (i === "day") {
      const h = l.isoDate, f = ot(h.year, h.month, h.day + 1), g = an(s, h), y = an(s, f), b = u.subtract(y, g);
      d = Z.fromEpochNsDiff(c, g).round(b, o).addToEpochNs(g);
    } else {
      const h = Ri(l, r, i, o), f = Vt(s, c);
      d = Eo(h.isoDate, h.time, "option", f, s, "compatible", "prefer", !1);
    }
    return Ne(d, s, m(this, T));
  }
  equals(e) {
    C(this, q);
    const n = Er(e), r = m(this, S), o = m(n, S);
    return !!u.equal(u.BigInt(r), u.BigInt(o)) && !!lc(m(this, X), m(n, X)) && St(m(this, T), m(n, T));
  }
  toString(e = void 0) {
    C(this, q);
    const n = O(e), r = Br(n), o = Jr(n), i = (function(f) {
      return Bt(f, "offset", ["auto", "never"], "auto");
    })(n), a = Et(n, "trunc"), s = rt(n, "smallestUnit", "time", void 0);
    if (s === "hour") throw new RangeError('smallestUnit must be a time unit other than "hour"');
    const c = (function(f) {
      return Bt(f, "timeZoneName", ["auto", "never", "critical"], "auto");
    })(n), { precision: l, unit: d, increment: h } = eo(s, o);
    return Xa(this, l, r, c, i, { unit: d, increment: h, roundingMode: a });
  }
  toLocaleString(e = void 0, n = void 0) {
    C(this, q);
    const r = O(n), o = /* @__PURE__ */ Object.create(null);
    if ((function(c, l, d, h) {
      if (l == null) return;
      const f = Reflect.ownKeys(l);
      for (let g = 0; g < f.length; g++) {
        const y = f[g];
        if (!d.some(((b) => Object.is(b, y))) && Object.prototype.propertyIsEnumerable.call(l, y)) {
          const b = l[y];
          c[y] = b;
        }
      }
    })(o, r, ["timeZone"]), r.timeZone !== void 0) throw new TypeError("ZonedDateTime toLocaleString does not accept a timeZone option");
    if (o.year === void 0 && o.month === void 0 && o.day === void 0 && o.era === void 0 && o.weekday === void 0 && o.dateStyle === void 0 && o.hour === void 0 && o.minute === void 0 && o.second === void 0 && o.fractionalSecondDigits === void 0 && o.timeStyle === void 0 && o.dayPeriod === void 0 && o.timeZoneName === void 0 && (o.timeZoneName = "short"), o.timeZone = m(this, X), Qa(o.timeZone)) throw new RangeError("toLocaleString does not currently support offset time zones");
    const i = new yt(e, o), a = Pd.call(i).calendar, s = m(this, T);
    if (s !== "iso8601" && a !== "iso8601" && !St(a, s)) throw new RangeError(`cannot format ZonedDateTime with calendar ${s} in locale with calendar ${a}`);
    return i.format(Rt(m(this, S)));
  }
  toJSON() {
    return C(this, q), Xa(this, "auto");
  }
  valueOf() {
    wn("ZonedDateTime");
  }
  startOfDay() {
    C(this, q);
    const e = m(this, X);
    return Ne(an(e, kt(this).isoDate), e, m(this, T));
  }
  getTimeZoneTransition(e) {
    C(this, q);
    const n = m(this, X);
    if (e === void 0) throw new TypeError("options parameter is required");
    const r = Bt(typeof e == "string" ? On("direction", e) : O(e), "direction", ["next", "previous"], nn);
    if (r === void 0) throw new TypeError("direction option is required");
    if (Qa(n) || n === "UTC") return null;
    const o = m(this, S), i = r === "next" ? Wi(n, o) : Ti(n, o);
    return i === null ? null : Ne(i, n, m(this, T));
  }
  toInstant() {
    return C(this, q), Rt(m(this, S));
  }
  toPlainDate() {
    return C(this, q), We(kt(this).isoDate, m(this, T));
  }
  toPlainTime() {
    return C(this, q), Kt(kt(this).time);
  }
  toPlainDateTime() {
    return C(this, q), gt(kt(this), m(this, T));
  }
  static from(e, n = void 0) {
    return Er(e, n);
  }
  static compare(e, n) {
    const r = Er(e), o = Er(n), i = m(r, S), a = m(o, S);
    return u.lessThan(u.BigInt(i), u.BigInt(a)) ? -1 : u.greaterThan(u.BigInt(i), u.BigInt(a)) ? 1 : 0;
  }
}
function kt(t) {
  return xt(m(t, X), m(t, S));
}
function Se(t, e) {
  C(t, q);
  const n = kt(t).isoDate;
  return to(t).isoToDate(n, { [e]: !0 })[e];
}
function qn(t, e) {
  return C(t, q), kt(t).time[e];
}
on(ia, "Temporal.ZonedDateTime");
var At = Object.freeze({ __proto__: null, Duration: rr, Instant: ea, Now: Sc, PlainDate: ta, PlainDateTime: na, PlainMonthDay: ra, PlainTime: uo, PlainYearMonth: oa, ZonedDateTime: ia });
const zd = [ea, ta, na, rr, ra, uo, oa, ia];
for (const t of zd) {
  const e = Object.getOwnPropertyDescriptor(t, "prototype");
  (e.configurable || e.enumerable || e.writable) && (e.configurable = !1, e.enumerable = !1, e.writable = !1, Object.defineProperty(t, "prototype", e));
}
const Wr = (t) => At.PlainDate.from(t), aa = (t) => t.subtract({ days: t.dayOfWeek - 1 }), ge = (t, e) => t.add({ days: e }), oe = (t) => t.toString();
function It(t, e) {
  try {
    return e.until(Wr(t), { largestUnit: "day" }).days;
  } catch {
    return NaN;
  }
}
function Yc() {
  return /* @__PURE__ */ p(
    So,
    {
      style: { color: "var(--cc-calendar-color)" },
      size: 13,
      "aria-hidden": "true"
    }
  );
}
function Ud({
  items: t,
  base: e,
  today: n,
  registerButton: r,
  selectedId: o,
  onSelect: i
}) {
  const a = [...new Set(t.map((l) => l.day))].sort((l, d) => l - d), s = (l) => {
    const d = ge(e, l);
    return `${d.year}-${d.month}`;
  }, c = new Set(a.map(s)).size > 1;
  return /* @__PURE__ */ p("div", { className: "cc-agenda", children: a.map((l, d) => {
    const h = ge(e, l), f = c && (d === 0 || s(a[d - 1]) !== s(l)), g = t.filter((y) => y.day === l).sort((y, b) => y.start - b.start);
    return g.length ? /* @__PURE__ */ k(sl, { children: [
      f && /* @__PURE__ */ p("h2", { className: "cc-agenda-month", children: Mt(h, { year: "numeric", month: "long" }) }),
      /* @__PURE__ */ k("section", { children: [
        /* @__PURE__ */ k("h3", { children: [
          Mt(h, {
            month: "short",
            day: "numeric",
            weekday: "short"
          }),
          oe(h) === oe(n) && /* @__PURE__ */ p(Ui, { variant: "aim", children: v("common.today") })
        ] }),
        g.map((y) => /* @__PURE__ */ k(
          wo,
          {
            eventId: y.id,
            registerButton: r,
            selected: o === y.id,
            style: Sr(y.calendarColor),
            className: "cc-agenda-item cc-event",
            onClick: () => i(y),
            children: [
              /* @__PURE__ */ p("span", { className: "cc-agenda-time", children: un(y) }),
              /* @__PURE__ */ k("span", { className: "cc-agenda-title", children: [
                /* @__PURE__ */ p(Yc, {}),
                y.title
              ] }),
              /* @__PURE__ */ p("span", { className: "cc-agenda-source", children: vo(y) }),
              Lr(y) && /* @__PURE__ */ p("span", { className: "cc-agenda-delivery", children: Lr(y) }),
              /* @__PURE__ */ p(Ns, { size: 14 })
            ]
          },
          y.id
        ))
      ] })
    ] }, l) : null;
  }) });
}
function Xo(t) {
  return /* @__PURE__ */ p("select", { ...t, className: "cc-native-control focus-ring" });
}
function jd(t) {
  return /* @__PURE__ */ p("textarea", { ...t, className: "cc-native-control focus-ring" });
}
function sa({
  children: t,
  ...e
}) {
  return /* @__PURE__ */ k("label", { className: "cc-checkbox", children: [
    /* @__PURE__ */ p("input", { ...e, type: "checkbox" }),
    t
  ] });
}
function Pc({
  label: t,
  align: e = "start",
  trigger: n,
  children: r
}) {
  const [o, i] = I(!1), a = xe(null), s = Io(), c = () => {
    var l, d;
    i(!1), (d = (l = a.current) == null ? void 0 : l.querySelector("button")) == null || d.focus();
  };
  return $e(() => {
    if (!o) return;
    const l = (h) => {
      var f;
      (f = a.current) != null && f.contains(h.target) || i(!1);
    }, d = (h) => {
      h.key === "Escape" && !h.defaultPrevented && (h.preventDefault(), h.stopPropagation(), c());
    };
    return document.addEventListener("pointerdown", l), document.addEventListener("focusin", l), document.addEventListener("keydown", d, !0), () => {
      document.removeEventListener("pointerdown", l), document.removeEventListener("focusin", l), document.removeEventListener("keydown", d, !0);
    };
  }, [o]), /* @__PURE__ */ k("div", { ref: a, className: "cc-popover", children: [
    n({
      "aria-expanded": o,
      "aria-controls": s,
      onClick: () => i((l) => !l)
    }),
    o && /* @__PURE__ */ p(
      "div",
      {
        id: s,
        role: "group",
        "aria-label": t,
        className: `cc-popover-panel cc-popover-${e}`,
        children: r(c)
      }
    )
  ] });
}
function Ad({
  date: t,
  label: e,
  onChange: n
}) {
  const [r, o] = I(oe(t));
  return $e(() => o(oe(t)), [t]), /* @__PURE__ */ p(
    Pc,
    {
      label: v("calendar.chooseDate"),
      trigger: (i) => /* @__PURE__ */ k(
        "button",
        {
          type: "button",
          className: "cc-date-trigger",
          "aria-label": v("calendar.chooseDate"),
          ...i,
          children: [
            e,
            /* @__PURE__ */ p(Ms, { size: 14, "aria-hidden": "true" })
          ]
        }
      ),
      children: (i) => /* @__PURE__ */ k(
        "form",
        {
          onSubmit: (a) => {
            a.preventDefault(), n(Wr(r)), i();
          },
          children: [
            /* @__PURE__ */ k("label", { className: "cc-field", children: [
              v("calendar.chooseDate"),
              /* @__PURE__ */ p(
                Lo,
                {
                  type: "date",
                  min: "0001-01-01",
                  max: "9999-12-31",
                  required: !0,
                  value: r,
                  onChange: (a) => o(a.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ p(P, { type: "submit", children: v("calendar.goToDate") })
          ]
        }
      )
    }
  );
}
function Fd({
  range: t,
  date: e,
  onDate: n,
  onPrevious: r,
  onNext: o,
  onReset: i,
  showEvents: a,
  view: s,
  layout: c,
  onLayout: l,
  narrow: d,
  onView: h,
  onToggle: f,
  searchOpen: g,
  onSearch: y
}) {
  const b = Io(), w = v(s === "day" ? "common.day" : s === "month" ? "common.periodMonth" : s === "year" ? "common.periodYear" : "common.week");
  return /* @__PURE__ */ k("div", { className: "cc-toolbar", children: [
    /* @__PURE__ */ k("div", { className: "cc-date-nav", children: [
      /* @__PURE__ */ p(mt, { children: /* @__PURE__ */ p(P, { "aria-label": v("common.previous", { period: w }), onClick: r, children: /* @__PURE__ */ p(Tl, { size: 16 }) }) }),
      /* @__PURE__ */ p(mt, { children: /* @__PURE__ */ p(P, { "aria-label": v("common.next", { period: w }), onClick: o, children: /* @__PURE__ */ p(Ns, { size: 16 }) }) }),
      /* @__PURE__ */ p(mt, { children: /* @__PURE__ */ p(P, { onClick: i, children: v("common.today") }) }),
      /* @__PURE__ */ p(Ad, { date: e, label: t, onChange: n })
    ] }),
    /* @__PURE__ */ k("div", { className: "cc-toolbar-actions", children: [
      /* @__PURE__ */ p(mt, { children: /* @__PURE__ */ p(
        P,
        {
          "aria-label": v("common.searchEvents"),
          "aria-expanded": g,
          onClick: y,
          children: /* @__PURE__ */ p(Nl, { size: 15 })
        }
      ) }),
      /* @__PURE__ */ p(mt, { children: /* @__PURE__ */ k(
        Xo,
        {
          style: { width: "auto" },
          "aria-label": v("common.displayPeriod"),
          value: s,
          onChange: (x) => h(x.target.value),
          children: [
            /* @__PURE__ */ p("option", { value: "day", children: v("common.viewDay") }),
            /* @__PURE__ */ p("option", { value: "week", children: v("common.viewWeek") }),
            /* @__PURE__ */ p("option", { value: "month", children: v("common.viewMonth") }),
            /* @__PURE__ */ p("option", { value: "year", children: v("common.viewYear") })
          ]
        }
      ) }),
      /* @__PURE__ */ p(mt, { children: /* @__PURE__ */ p(
        Ts,
        {
          ariaLabel: v("common.displayLayout"),
          layoutId: b,
          collapse: !1,
          value: c,
          onChange: l,
          segments: [
            {
              key: "calendar",
              label: v("common.calendarGrid"),
              disabled: d && s === "week"
            },
            { key: "list", label: v("common.list") }
          ]
        }
      ) }),
      /* @__PURE__ */ p(
        Pc,
        {
          label: v("common.itemsToDisplay"),
          align: "end",
          trigger: (x) => /* @__PURE__ */ p(mt, { children: /* @__PURE__ */ k(P, { ...x, children: [
            /* @__PURE__ */ p(Ol, { size: 14 }),
            v("common.show"),
            /* @__PURE__ */ p(Ms, { size: 13 })
          ] }) }),
          children: () => /* @__PURE__ */ k(tn, { children: [
            /* @__PURE__ */ p("h3", { children: v("common.itemsToDisplay") }),
            /* @__PURE__ */ k(sa, { checked: a, onChange: f, children: [
              /* @__PURE__ */ p(So, { size: 14 }),
              v("common.eventsAndDrafts")
            ] })
          ] })
        }
      )
    ] })
  ] });
}
function qd({ item: t, onClose: e, actions: n }) {
  const r = xe(null), o = Wr(t.interval.startDate), i = Wr(t.interval.endDate), a = (s) => Mt(s, {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short"
  });
  return $e(() => {
    var s;
    (s = r.current) == null || s.focus();
  }, [t.id]), /* @__PURE__ */ k(
    "aside",
    {
      style: Sr(t.calendarColor),
      className: "cc-detail",
      "aria-label": v("common.selectedEventDetails"),
      children: [
        /* @__PURE__ */ k("div", { className: "cc-detail-top", children: [
          /* @__PURE__ */ k("span", { className: "cc-kind-label cc-event", children: [
            /* @__PURE__ */ p(Yc, {}),
            v(t.storage === "draft" ? "common.draftForReview" : "common.event")
          ] }),
          /* @__PURE__ */ p(P, { "aria-label": v("common.closeDetails"), onClick: e, children: /* @__PURE__ */ p($l, { size: 17 }) })
        ] }),
        /* @__PURE__ */ p("h2", { ref: r, tabIndex: -1, children: t.title }),
        t.description && /* @__PURE__ */ p("p", { className: "cc-description", children: t.description }),
        /* @__PURE__ */ k("dl", { children: [
          /* @__PURE__ */ k("dt", { children: [
            /* @__PURE__ */ p(So, { size: 14 }),
            v("common.date")
          ] }),
          /* @__PURE__ */ k("dd", { children: [
            a(o),
            !o.equals(i) && ` – ${a(i)}`
          ] }),
          /* @__PURE__ */ k("dt", { children: [
            /* @__PURE__ */ p(_l, { size: 14 }),
            v("common.time")
          ] }),
          /* @__PURE__ */ p("dd", { children: un({ ...t, timeLabels: t.interval.timeLabels }) }),
          vo(t) && /* @__PURE__ */ k(tn, { children: [
            /* @__PURE__ */ p("dt", { children: v(t.calendarLocation ? "common.calendar" : "common.source") }),
            /* @__PURE__ */ p("dd", { children: vo(t) })
          ] }),
          mi(t.deliveryState) && /* @__PURE__ */ k(tn, { children: [
            /* @__PURE__ */ p("dt", { children: v("delivery.statusLabel") }),
            /* @__PURE__ */ p("dd", { children: mi(t.deliveryState) })
          ] })
        ] }),
        n,
        t.storage === "external" && /* @__PURE__ */ p("p", { className: "cc-detail-bottom", children: v("details.externalEditHint") })
      ]
    }
  );
}
function zc(t) {
  return new Set(t.map((e) => e.occurrenceKey)).size;
}
function Zd(t, e, n, r) {
  return zc(
    t.filter((o) => {
      const i = ge(e, o.day);
      return i.year === n && i.month === r + 1;
    })
  );
}
function ca({
  day: t,
  today: e = !1,
  size: n = "regular",
  className: r = ""
}) {
  return /* @__PURE__ */ p(
    "span",
    {
      className: `cc-date-badge cc-date-badge-${n}${e ? " cc-date-badge-today" : ""}${r ? ` ${r}` : ""}`,
      children: t
    }
  );
}
function la(t) {
  const e = aa(t.with({ day: 1 }));
  return Array.from({ length: 42 }, (n, r) => ge(e, r));
}
function gs(t, e, n) {
  return e === "day" ? ge(t, n) : e === "month" ? t.with({ day: 1 }).add({ months: n }) : e === "year" ? t.with({ day: 1 }).add({ years: n }) : ge(t, n * 7);
}
function Uc(t, e, n, r = "calendar") {
  let o, i;
  return e === "day" ? (o = t, i = ge(t, 1)) : e === "year" ? (o = t.with({ month: 1, day: 1 }), i = o.add({ years: 1 })) : e === "month" ? (o = r === "list" ? t.with({ day: 1 }) : la(t)[0], i = r === "list" ? o.add({ months: 1 }) : ge(o, 42)) : (o = aa(t), i = ge(o, 7)), {
    first: It(oe(o), n),
    end: It(oe(i), n)
  };
}
function Hd({
  date: t,
  base: e,
  today: n,
  items: r,
  registerButton: o,
  selectedId: i,
  onSelect: a,
  onDay: s,
  onAdd: c
}) {
  const l = /* @__PURE__ */ new Map();
  for (const d of r) {
    const h = oe(ge(e, d.day));
    l.set(h, [...l.get(h) ?? [], d]);
  }
  return /* @__PURE__ */ k("div", { className: "cc-month-view", children: [
    /* @__PURE__ */ p("div", { className: "cc-month-weekdays", children: Ir().map((d) => /* @__PURE__ */ p("span", { children: d }, d)) }),
    /* @__PURE__ */ p("div", { className: "cc-month-grid", children: la(t).map((d) => {
      const h = oe(d), f = (l.get(h) ?? []).sort(
        (g, y) => +!!y.allDay - +!!g.allDay || g.start - y.start
      );
      return /* @__PURE__ */ k(
        "section",
        {
          "aria-label": h,
          onClick: (g) => {
            g.target === g.currentTarget && c(d);
          },
          className: `cc-month-cell ${d.month !== t.month ? "cc-outside-month" : ""}`,
          children: [
            /* @__PURE__ */ p(
              "button",
              {
                className: "cc-month-day",
                "aria-label": v("calendar.openDay", { date: h }),
                onClick: () => s(d),
                children: /* @__PURE__ */ p(ca, { day: d.day, today: h === oe(n) })
              }
            ),
            /* @__PURE__ */ p(
              "button",
              {
                type: "button",
                className: "cc-month-add",
                "aria-label": v("calendar.addOnDate", { date: h }),
                onClick: () => c(d),
                children: /* @__PURE__ */ p(Rs, { size: 14 })
              }
            ),
            f.slice(0, 3).map((g) => {
              const y = Lr(g);
              return /* @__PURE__ */ k(
                wo,
                {
                  eventId: g.id,
                  registerButton: o,
                  selected: i === g.id,
                  style: Sr(g.calendarColor),
                  className: "cc-month-item cc-event",
                  "aria-label": [y, g.title, un(g)].filter(Boolean).join(", "),
                  title: [y, g.title, un(g)].filter(Boolean).join(" · "),
                  onClick: () => a(g),
                  children: [
                    y && /* @__PURE__ */ p("span", { className: "cc-event-status", children: y }),
                    /* @__PURE__ */ p("span", { className: "cc-month-item-time", children: g.allDay ? v("common.allDay") : un(g).split("–")[0] }),
                    /* @__PURE__ */ p("span", { children: g.title })
                  ]
                },
                g.id
              );
            }),
            f.length > 3 && /* @__PURE__ */ p(
              "button",
              {
                className: "cc-month-more",
                onClick: () => s(d),
                "aria-label": v("calendar.dayOverflow", {
                  date: h,
                  count: f.length - 3
                }),
                children: v("common.moreEvents", { count: f.length - 3 })
              }
            )
          ]
        },
        h
      );
    }) })
  ] });
}
const Wd = 120, Gd = 2e3, da = 3600 * 1e3;
function jc(t) {
  return t.end || new Date(Date.parse(t.start) + da).toISOString();
}
function Ac(t) {
  return t.split(/[\p{White_Space}\u001c-\u001f]+/u).filter(Boolean).join(" ");
}
function Kd(t) {
  const e = Ac(t.title);
  return Array.from(e).length > Wd ? "editor.titleTooLong" : Array.from(t.notes).length > Gd ? "editor.notesTooLong" : null;
}
function se(t, ...e) {
  return {
    key: t,
    values: e[0] ?? {}
  };
}
function ke(t) {
  if (!t) return "";
  if ("messages" in t) return t.messages.map(ke).join(" ");
  const e = Object.fromEntries(
    Object.entries(t.values).map(([n, r]) => [
      n,
      typeof r == "object" ? ke(r) : r
    ])
  );
  return v(
    t.key,
    e
  );
}
class mn extends Error {
  constructor(n) {
    super("Calendar operation failed");
    gr(this, "notice");
    this.notice = n;
  }
}
const Qo = 6e4, Fc = 60 * Qo;
function In(t, e) {
  return At.Instant.from(
    t instanceof Date ? t.toISOString() : t
  ).toZonedDateTimeISO(e);
}
function en(t, e) {
  return In(t, e).toPlainDateTime().toString({ smallestUnit: "minute" });
}
function ci(t, e) {
  return In(t, e).toPlainDate();
}
const go = /* @__PURE__ */ new Map();
function Gr(t, e) {
  const n = JSON.stringify([t, e]), r = go.get(n);
  if (r) return r;
  const o = At.PlainDate.from(t), i = o.toZonedDateTime(e), a = o.add({ days: 1 }).toZonedDateTime(e), s = Object.freeze({
    date: t,
    zone: e,
    startMs: i.epochMilliseconds,
    endMs: a.epochMilliseconds,
    durationMinutes: (a.epochMilliseconds - i.epochMilliseconds) / Qo,
    clockChanges: i.offset !== a.offset || i.hour !== 0 || i.minute !== 0 || a.epochMilliseconds - i.epochMilliseconds !== 24 * Fc
  });
  return go.size >= 800 && go.clear(), go.set(n, s), s;
}
function Vd(t, e, n) {
  if (At.PlainDate.compare(t, e) >= 0)
    throw new mn(se("common.checkTheDateRange"));
  return {
    start: new Date(Gr(t, n).startMs).toISOString(),
    end: new Date(Gr(e, n).startMs).toISOString()
  };
}
function Xd(t, e) {
  const n = typeof t == "number" ? t : At.Instant.from(t).epochMilliseconds;
  return Math.max(0, Math.min(e.durationMinutes, (n - e.startMs) / Qo));
}
function Qd(t, e) {
  const n = Gr(t, e), r = [];
  for (let i = n.startMs; i < n.endMs; i += Fc) {
    const a = In(new Date(i), e);
    r.push({
      minute: (i - n.startMs) / Qo,
      label: a.toPlainTime().toString({ smallestUnit: "minute" }),
      offset: a.offset
    });
  }
  const o = /* @__PURE__ */ new Map();
  for (const i of r) o.set(i.label, (o.get(i.label) || 0) + 1);
  return {
    ...n,
    ticks: r.map((i) => ({
      ...i,
      label: o.get(i.label) > 1 ? `${i.label} UTC${i.offset}` : i.label
    }))
  };
}
function ps(t, e, n, r) {
  const o = In(new Date(t), n), i = In(new Date(e), n), a = o.offset !== i.offset, s = (c) => c.toPlainTime().toString({ smallestUnit: "minute" }) + (a ? ` UTC${c.offset}` : "");
  return {
    start: s(o),
    end: e === r ? "24:00" + (a ? ` UTC${i.offset}` : "") : s(i)
  };
}
function Dn(t, e) {
  const n = At.Instant.from(t).round({ smallestUnit: "second", roundingMode: "floor" }).toString();
  return { wall: en(n, e), instant: n };
}
function ys(t, e) {
  return t.instant ? Dn(t.instant, e) : t;
}
function ua(t, e) {
  try {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t)) return [];
    const n = At.PlainDateTime.from(t, { overflow: "reject" }), r = ["earlier", "later"].map((o) => n.toZonedDateTime(e, { disambiguation: o })).filter((o) => o.toPlainDateTime().equals(n));
    return [
      ...new Map(
        r.map((o) => [
          o.epochMilliseconds,
          {
            instant: o.toString({
              timeZoneName: "never",
              calendarName: "never"
            }),
            offset: o.offset
          }
        ])
      ).values()
    ];
  } catch {
    return [];
  }
}
function Li(t, e) {
  const n = ua(t, e);
  return { wall: t, instant: n.length === 1 ? n[0].instant : null };
}
function qc(t, e) {
  return t.instant ? In(t.instant, e).offset : "";
}
function vs(t, e) {
  if (t.instant && en(t.instant, e) === t.wall)
    return In(t.instant, e).toString({
      timeZoneName: "never",
      calendarName: "never",
      smallestUnit: "second",
      roundingMode: "floor"
    });
  const n = ua(t.wall, e);
  if (n.length === 1) return n[0].instant;
  throw new mn(
    se(n.length > 1 ? "time.offsetRequired" : "time.invalid")
  );
}
function Bd(t) {
  const e = t.toPlainDateTime({ hour: 10 }), n = e.add({ milliseconds: da });
  return {
    start: e.toString({ smallestUnit: "minute" }),
    end: n.toString({ smallestUnit: "minute" })
  };
}
function Jd(t, e, n) {
  const r = Gr(oe(t), e), o = Math.max(
    0,
    Math.min(r.durationMinutes - 15, Math.floor(n / 15) * 15)
  ), i = r.startMs + o * 6e4;
  return {
    date: t,
    times: {
      start: new Date(i).toISOString(),
      end: new Date(i + da).toISOString()
    }
  };
}
function eu({
  timezone: t,
  onDay: e,
  onAdd: n,
  items: r,
  dates: o,
  referenceTime: i,
  isCurrentPeriod: a,
  registerButton: s,
  selectedId: c,
  onSelect: l
}) {
  const d = xe(null), h = oe(o[0]), f = o.map(oe).join("|"), g = ks(
    () => f.split("|").map((w) => Qd(w, t)),
    [f, t]
  ), y = g.some((w) => w.clockChanges), b = Math.max(...g.map((w) => w.durationMinutes));
  return $e(() => {
    const w = d.current;
    if (!w) return;
    let x = !1;
    const D = () => {
      x || w.clientHeight <= 0 || w.scrollHeight <= w.clientHeight || (w.scrollTop = jn(540), x = !0, E.disconnect());
    }, E = new ResizeObserver(D);
    E.observe(w);
    const _ = requestAnimationFrame(D);
    return () => {
      cancelAnimationFrame(_), E.disconnect();
    };
  }, [h]), /* @__PURE__ */ p(tn, { children: /* @__PURE__ */ k(
    "div",
    {
      className: "cc-time-scroll",
      ref: d,
      style: { "--cc-day-columns": o.length },
      children: [
        /* @__PURE__ */ k("div", { className: "cc-grid-head", children: [
          /* @__PURE__ */ p("div", { className: "cc-grid-corner" }),
          o.map((w, x) => /* @__PURE__ */ k(
            "button",
            {
              type: "button",
              className: "cc-day-heading",
              onClick: () => e(w),
              "aria-label": v("calendar.openDay", { date: Mt(w) }),
              children: [
                /* @__PURE__ */ p("span", { children: Ir()[w.dayOfWeek - 1] }),
                /* @__PURE__ */ p(
                  ca,
                  {
                    className: "cc-date-number",
                    day: w.day,
                    today: a && x === i.day
                  }
                )
              ]
            },
            oe(w)
          ))
        ] }),
        /* @__PURE__ */ k("div", { className: "cc-all-day", children: [
          /* @__PURE__ */ p("span", { children: v("common.allDay") }),
          o.map((w, x) => /* @__PURE__ */ p("div", { children: r.filter((D) => D.day === x && D.allDay).map((D) => /* @__PURE__ */ p(
            wo,
            {
              eventId: D.id,
              registerButton: s,
              selected: c === D.id,
              className: "cc-all-day-event",
              style: Sr(D.calendarColor),
              onClick: () => l(D),
              children: D.title
            },
            D.id
          )) }, x))
        ] }),
        y && /* @__PURE__ */ p("p", { className: "cc-time-axis-note", children: v("calendar.clockChangeNotice") }),
        /* @__PURE__ */ k(
          "div",
          {
            className: "cc-time-grid",
            style: {
              "--cc-hour-height": `${$r.hourHeightPx}px`,
              "--cc-day-height": `${jn(b)}px`
            },
            children: [
              /* @__PURE__ */ p("div", { className: "cc-hour-labels", children: !y && g[0].ticks.map((w) => /* @__PURE__ */ p("span", { style: { top: jn(w.minute) }, children: w.label }, w.minute)) }),
              o.map((w, x) => /* @__PURE__ */ k(
                "div",
                {
                  className: `cc-day-column ${w.dayOfWeek >= 6 ? "cc-weekend" : ""}`,
                  style: {
                    height: jn(g[x].durationMinutes),
                    "--cc-clock-gutter": y ? "60px" : "0px"
                  },
                  tabIndex: 0,
                  role: "group",
                  onClick: (D) => {
                    if (D.target === D.currentTarget) {
                      const E = D.clientY - D.currentTarget.getBoundingClientRect().top;
                      n(
                        Jd(w, t, E / $r.hourHeightPx * 60)
                      );
                    }
                  },
                  onKeyDown: (D) => {
                    D.target === D.currentTarget && D.key === "Enter" && (D.preventDefault(), n({ date: w }));
                  },
                  "aria-label": v("calendar.dayLabel", {
                    month: w.month,
                    day: w.day,
                    weekday: Ir()[w.dayOfWeek - 1]
                  }),
                  children: [
                    y && g[x].ticks.map((D) => /* @__PURE__ */ p(
                      "span",
                      {
                        className: "cc-day-clock",
                        style: { top: jn(D.minute) },
                        children: D.label.split(" ").map((E) => /* @__PURE__ */ p("span", { children: E }, E))
                      },
                      D.minute
                    )),
                    pl(r.filter((D) => D.day === x)).map(
                      ({ item: D, lane: E, lanes: _, geometry: M }) => {
                        const N = Lr(D), H = {
                          top: M.topPx,
                          left: `calc((100% - var(--cc-clock-gutter)) * ${E / _} + 4px)`,
                          width: `calc((100% - var(--cc-clock-gutter)) / ${_} - 8px)`,
                          height: M.heightPx,
                          "--cc-span": `${M.durationMarkHeightPx}px`
                        };
                        return /* @__PURE__ */ k(
                          wo,
                          {
                            eventId: D.id,
                            registerButton: s,
                            selected: c === D.id,
                            className: `cc-item cc-item-event ${M.compact ? "cc-item-event-short" : ""}`,
                            style: {
                              ...H,
                              ...Sr(D.calendarColor)
                            },
                            onClick: () => l(D),
                            "aria-label": `${N || v("common.event")} ${D.title}, ${un(D)}`,
                            title: [N, D.title, un(D)].filter(Boolean).join(" · "),
                            children: [
                              /* @__PURE__ */ p("span", { className: "cc-item-title", children: /* @__PURE__ */ p("span", { children: D.title }) }),
                              /* @__PURE__ */ k("span", { className: "cc-item-meta", children: [
                                N && /* @__PURE__ */ p("span", { className: "cc-event-status", children: N }),
                                /* @__PURE__ */ p("span", { className: "cc-item-time", children: un(D) })
                              ] })
                            ]
                          },
                          D.id
                        );
                      }
                    ),
                    a && x === i.day && /* @__PURE__ */ p(
                      "div",
                      {
                        className: "cc-now-line",
                        style: {
                          top: jn(
                            Xd(i.instant, g[x])
                          )
                        },
                        children: /* @__PURE__ */ k("span", { children: [
                          v("common.now"),
                          en(i.instant, t).slice(11)
                        ] })
                      }
                    )
                  ]
                },
                oe(w)
              ))
            ]
          }
        )
      ]
    }
  ) });
}
function tu({
  date: t,
  base: e,
  today: n,
  items: r,
  onMonth: o
}) {
  const i = new Set(r.map((a) => oe(ge(e, a.day))));
  return /* @__PURE__ */ k("div", { className: "cc-year-view", children: [
    /* @__PURE__ */ p("p", { className: "cc-year-note", children: v("calendar.yearLegend") }),
    /* @__PURE__ */ p("div", { className: "cc-year-grid", children: Array.from({ length: 12 }, (a, s) => {
      const c = t.with({ month: s + 1, day: 1 }), l = Zd(r, e, t.year, s);
      return /* @__PURE__ */ k(
        "button",
        {
          className: "cc-year-month",
          "aria-label": v("calendar.monthSummary", {
            year: t.year,
            month: s + 1,
            count: l
          }),
          onClick: () => o(c),
          children: [
            /* @__PURE__ */ k("span", { className: "cc-year-month-heading", children: [
              /* @__PURE__ */ p("strong", { children: Mt(c, { month: "long" }) }),
              /* @__PURE__ */ p("small", { children: l ? v("calendar.eventCount", { count: l }) : "" })
            ] }),
            /* @__PURE__ */ k("span", { className: "cc-mini-grid", children: [
              Ir().map((d) => /* @__PURE__ */ p("span", { className: "cc-mini-weekday", children: d }, d)),
              la(c).map((d) => /* @__PURE__ */ p(
                ca,
                {
                  size: "mini",
                  day: d.month === s + 1 ? d.day : "",
                  today: d.month === s + 1 && oe(d) === oe(n),
                  className: d.month === s + 1 && i.has(oe(d)) ? "cc-occupied-day" : ""
                },
                oe(d)
              ))
            ] })
          ]
        },
        s
      );
    }) })
  ] });
}
function nu({
  timezone: t,
  items: e,
  weekStart: n,
  referenceTime: r,
  view: o,
  layout: i,
  onLayout: a,
  onView: s,
  notice: c,
  onReload: l,
  eventActions: d,
  focusDate: h,
  onFocusDate: f,
  offset: g,
  jump: y,
  status: b,
  onAdd: w
}) {
  const [x, D] = I(""), [E, _] = I(!1), { ref: M, width: N } = fl(), H = N > 0 && N < Ma.listBelowPx, [W, A] = I(!0), [B, $] = I(null), z = xe(/* @__PURE__ */ new Map()), Q = _t((j, Je) => {
    Je ? z.current.set(j, Je) : z.current.delete(j);
  }, []), J = o === "day" ? [h] : Ir().map((j, Je) => ge(n, g * 7 + Je)), he = It(oe(J[0]), n), L = H && o === "week" ? "list" : i, V = r.day >= he && r.day < he + J.length, ae = Uc(h, o, n, L), fe = e.filter(
    (j) => j.day >= ae.first && j.day < ae.end
  ), ht = (j) => W && (!x.trim() || `${j.title} ${j.description} ${vo(j)} ${mi(j.deliveryState)} ${Lr(j)}`.toLowerCase().includes(x.trim().toLowerCase())), Be = fe.filter(ht), Ft = Be.map((j) => ({
    ...j,
    day: j.day - he
  })), Me = Be.find((j) => j.id === B), ee = fe.length > 0 && Ft.length === 0, te = o === "day" ? Mt(h, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }) : o === "year" ? Mt(h, { year: "numeric" }) : o === "month" ? Mt(h, { year: "numeric", month: "long" }) : `${Mt(J[0])} – ${Mt(J[6])}`;
  $e(() => {
    y && ($(y.id), D(""), A(!0));
  }, [y]);
  const zn = () => {
    var j;
    $(null), B && ((j = z.current.get(B)) == null || j.focus());
  };
  function Un(j) {
    const Je = e.find((ei) => ei.id === j.id);
    Je && (Je.day < ae.first || Je.day >= ae.end) && f(ge(n, Je.day)), $(j.id);
  }
  function qt(j) {
    f(j), $(null);
  }
  function Jo() {
    A((j) => !j), $(null);
  }
  function bn() {
    D(""), _(!1);
  }
  return $e(() => {
    if (!Me) return;
    const j = (Je) => {
      Je.key === "Escape" && !document.querySelector("dialog[open]") && zn();
    };
    return document.addEventListener("keydown", j), () => document.removeEventListener("keydown", j);
  }, [Me]), /* @__PURE__ */ p(tn, { children: /* @__PURE__ */ k("div", { className: "cc-content", ref: M, children: [
    /* @__PURE__ */ p(
      Fd,
      {
        range: te,
        date: h,
        onDate: qt,
        onPrevious: () => qt(gs(h, o, -1)),
        onNext: () => qt(gs(h, o, 1)),
        onReset: () => qt(ge(n, r.day)),
        view: o,
        layout: L,
        onLayout: a,
        narrow: H,
        onView: s,
        showEvents: W,
        onToggle: Jo,
        searchOpen: E,
        onSearch: () => E ? bn() : _(!0)
      }
    ),
    E && /* @__PURE__ */ p("div", { className: "cc-search-row", children: /* @__PURE__ */ p(
      _s,
      {
        fieldMaxWidth: 430,
        field: /* @__PURE__ */ p(
          Lo,
          {
            autoFocus: !0,
            "aria-label": v("common.search"),
            placeholder: v("calendar.searchPlaceholder", {
              period: v(o === "day" ? "common.thisDay" : o === "year" ? "common.thisYear" : o === "month" ? "common.theDisplayedCalendar" : "common.thisWeek")
            }),
            value: x,
            onChange: (j) => D(j.target.value)
          }
        ),
        meta: v("calendar.eventCount", { count: zc(Be) }),
        action: /* @__PURE__ */ p(P, { onClick: bn, children: v("common.close") })
      }
    ) }),
    c,
    /* @__PURE__ */ k(
      "div",
      {
        className: `cc-workspace ${Me ? "cc-has-detail" : ""} ${N >= Ma.dockDetailAbovePx ? "cc-detail-docked" : "cc-detail-overlay"}`,
        children: [
          /* @__PURE__ */ p("section", { className: "cc-main", "aria-label": v("common.calendarGrid"), children: b === "loading" ? /* @__PURE__ */ k("div", { className: "cc-state-panel", role: "status", children: [
            /* @__PURE__ */ p("h3", { children: v("common.loadingEvents") }),
            /* @__PURE__ */ p("p", { children: v("calendar.loadingDescription") }),
            /* @__PURE__ */ p(P, { disabled: !0, children: v("common.loading") })
          ] }) : L === "calendar" && o === "month" ? /* @__PURE__ */ p(
            Hd,
            {
              date: h,
              base: n,
              today: ge(n, r.day),
              items: Be,
              registerButton: Q,
              selectedId: B ?? void 0,
              onSelect: Un,
              onAdd: (j) => w({ date: j }),
              onDay: (j) => {
                qt(j), s("day");
              }
            }
          ) : L === "calendar" && o === "year" ? /* @__PURE__ */ p(
            tu,
            {
              date: h,
              base: n,
              today: ge(n, r.day),
              items: Be,
              onMonth: (j) => {
                qt(j), s("month");
              }
            }
          ) : Ft.length === 0 && (L === "list" || ee) ? /* @__PURE__ */ k("div", { className: "cc-empty", children: [
            /* @__PURE__ */ p("div", { className: "cc-empty-icon", children: /* @__PURE__ */ p(So, { size: 32 }) }),
            /* @__PURE__ */ p("h3", { children: ee ? v("calendar.noMatches") : e.length === 0 ? v("calendar.empty") : v("calendar.periodEmpty") }),
            /* @__PURE__ */ p("p", { children: ee ? v("calendar.filtersHint") : e.length === 0 ? v("calendar.emptyDescription") : v("calendar.periodEmptyDescription") }),
            /* @__PURE__ */ k(
              P,
              {
                primary: !0,
                onClick: () => {
                  D(""), A(!0), ee || w({ date: h });
                },
                children: [
                  v(ee ? "common.resetSearchAndFilters" : "common.addEvent"),
                  /* @__PURE__ */ p(kl, { size: 14 })
                ]
              }
            ),
            /* @__PURE__ */ p(P, { onClick: l, children: v("common.reload") })
          ] }) : L === "calendar" ? /* @__PURE__ */ p(
            eu,
            {
              timezone: t,
              items: Ft,
              dates: J,
              referenceTime: {
                ...r,
                day: r.day - he
              },
              isCurrentPeriod: V,
              onAdd: w,
              onDay: (j) => {
                qt(j), s("day");
              },
              registerButton: Q,
              selectedId: Me == null ? void 0 : Me.id,
              onSelect: Un
            }
          ) : /* @__PURE__ */ p(
            Ud,
            {
              items: Be,
              base: n,
              today: ge(n, r.day),
              registerButton: Q,
              selectedId: Me == null ? void 0 : Me.id,
              onSelect: Un
            }
          ) }),
          Me && /* @__PURE__ */ p(
            qd,
            {
              item: Me,
              actions: d(Me.id),
              onClose: zn
            }
          )
        ]
      }
    )
  ] }) });
}
wl(ll);
function Zc() {
  return cl(), wt();
}
const ws = {
  stale_event: "errors.staleEvent",
  request_conflict: "errors.requestConflict",
  timezone_changed: "editor.timezoneChanged",
  action_unavailable: "errors.actionUnavailable",
  operation_changed: "errors.operationChanged",
  storage_unavailable: "errors.storageUnavailable",
  delivery_unavailable: "errors.deliveryUnavailable",
  invalid_request: "editor.invalidFields",
  invalid_date: "time.invalid",
  invalid_range: "common.checkTheDateRange",
  invalid_action: "errors.requestFailed",
  authorization_required: "connections.permissionRequired",
  capability_unavailable: "connections.permissionRequired",
  read_only: "errors.readOnly",
  calendar_missing: "errors.calendarMissing",
  connection_missing: "errors.connectionMissing",
  connection_changed: "errors.connectionChanged",
  outcome_unknown: "delivery.unknown",
  event_changed: "delivery.eventChanged",
  helper_missing: "errors.helperMissing",
  helper_timeout: "errors.helperTimeout",
  helper_unavailable: "errors.helperUnavailable",
  unsupported_platform: "connections.unsupported",
  app_disabled: "errors.appDisabled",
  provider_contract: "errors.providerResponse",
  provider_error: "errors.providerResponse",
  item_unavailable: "errors.itemUnavailable"
};
function Si(t) {
  return t !== null && typeof t == "object" ? t : void 0;
}
function Ee(t) {
  if (t instanceof mn) return t.notice;
  let e = Si(t);
  const n = e == null ? void 0 : e.status;
  if (typeof (e == null ? void 0 : e.body) == "string")
    try {
      e = Si(JSON.parse(e.body));
    } catch {
      e = void 0;
    }
  if ((e == null ? void 0 : e.code) === "events_truncated")
    return typeof e.limit == "number" && Number.isSafeInteger(e.limit) && e.limit > 0 ? se("errors.eventsTruncated", { count: e.limit }) : se("errors.eventsIncomplete");
  const r = typeof (e == null ? void 0 : e.code) == "string" ? e.code : "";
  return Object.hasOwn(ws, r) ? se(ws[r]) : se(n === 401 || n === 403 ? "errors.ownerRequired" : n === 503 ? "errors.storageUnavailable" : "errors.requestFailed");
}
function bs(t) {
  return t.length ? {
    messages: t.map((e) => {
      const n = Si(e);
      return typeof (n == null ? void 0 : n.itemId) == "string" ? se("errors.recordUnavailable", { id: n.itemId }) : Ee(e);
    })
  } : null;
}
const ie = (t) => t !== null && typeof t == "object" && !Array.isArray(t), Ve = (t) => typeof t == "string", vt = (t) => t == null || Ve(t), or = (t, ...e) => e.every((n) => Ve(t[n])), yn = (t, e) => Array.isArray(t) && t.every(e), ir = (t, e) => typeof t == "string" && e.includes(t), ru = (t) => typeof t == "number" && Number.isSafeInteger(t) && t >= 0;
function $o(t) {
  if (!Ve(t)) return !1;
  try {
    return At.Instant.from(t), !0;
  } catch {
    return !1;
  }
}
function xs(t) {
  if (!Ve(t)) return !1;
  try {
    return At.PlainDate.from(t), !0;
  } catch {
    return !1;
  }
}
function ou(t) {
  if (!Ve(t)) return !1;
  try {
    return At.Instant.fromEpochMilliseconds(0).toZonedDateTimeISO(t), !0;
  } catch {
    return !1;
  }
}
const Yi = (t) => ie(t) && or(t, "connectionId", "calendarId"), ha = (t) => ie(t) && (t.kind === "system" && Ve(t.key) || t.kind === "custom" && Ve(t.text)), Hc = (t) => t == null || ie(t) && ir(t.mode, ["app", "provider"]);
function Wc(t) {
  return ie(t) && Ve(t.id) && ir(t.state, [
    "prepared",
    "awaiting_confirmation",
    "confirmed",
    "cancelled",
    "failed",
    "unknown"
  ]) && Hc(t.confirmation) && (t.connectionName == null || ha(t.connectionName)) && vt(t.calendarTitle) && vt(t.sourceTitle) && vt(t.calendarColor) && vt(t.provider) && (t.verification == null || ie(t.verification) && Ve(t.verification.state));
}
function ma(t) {
  return ie(t) && or(t, "id", "title", "reason") && ru(t.revision) && $o(t.start) && (t.end == null || $o(t.end)) && vt(t.notes) && vt(t.deletedAt) && ir(t.status, ["proposed", "confirmed", "dismissed"]) && ir(t.source, ["manual", "proactive", "direct"]) && Yi(t.destination) && yn(t.actions, Ve) && ie(t.origin) && Ve(t.origin.sessionKey) && (t.externalRef == null || Yi(t.externalRef) && ie(t.externalRef) && Ve(t.externalRef.eventId)) && (t.delivery == null || Wc(t.delivery) || ie(t.delivery) && t.delivery.state === "unavailable");
}
function iu(t) {
  return ie(t) && or(
    t,
    "eventId",
    "calendarId",
    "title",
    "calendarTitle",
    "sourceTitle",
    "notes"
  ) && $o(t.start) && $o(t.end) && typeof t.allDay == "boolean" && (!t.allDay || xs(t.startDate) && xs(t.endDate)) && vt(t.itemId) && (t.origin == null || ie(t.origin) && Ve(t.origin.sessionKey)) && vt(t.connectionId) && vt(t.calendarColor) && (t.connectionName == null || ha(t.connectionName));
}
function au(t) {
  return ie(t) && or(t, "id", "provider") && ha(t.displayName) && ir(t.state, [
    "ready",
    "needs_authorization",
    "denied",
    "unsupported",
    "unavailable"
  ]) && ie(t.capabilities) && typeof t.capabilities.read == "boolean" && typeof t.capabilities.create == "boolean" && Hc(t.confirmation) && yn(t.selectedCalendarIds, Ve) && yn(
    t.calendars,
    (e) => ie(e) && or(e, "id", "title", "sourceTitle") && typeof e.writable == "boolean" && vt(e.color)
  );
}
function Pn(t, e) {
  if (!e) throw new mn(se("errors.invalidResponse"));
  return t;
}
function Pi(t) {
  return Pn(
    t,
    ie(t) && ie(t.settings) && typeof t.settings.suggestionsEnabled == "boolean" && ou(t.settings.timezone) && yn(t.settings.sessionKeys, Ve) && ie(t.hook) && ir(t.hook.status, ["ready", "unconfigured", "blocked", "unknown"]) && vt(t.hook.command) && vt(t.hook.executionStatus) && yn(
      t.chats,
      (e) => ie(e) && or(e, "sessionKey", "title")
    )
  );
}
function su(t) {
  return Pn(
    t,
    ie(t) && yn(t.items, ma) && Array.isArray(t.errors)
  );
}
function cu(t) {
  return Pn(
    t,
    ie(t) && yn(t.events, iu) && Array.isArray(t.errors)
  );
}
function lu(t) {
  return Pn(t, ie(t) && yn(t.connections, au));
}
function du(t) {
  return Pn(
    t,
    ie(t) && ie(t.preferences) && typeof t.preferences.showCrew == "boolean" && Yi(t.preferences.defaultDestination)
  );
}
function ar(t) {
  return Pn(t, ie(t) && ma(t.item));
}
function li(t) {
  return Pn(
    t,
    ie(t) && ma(t.item) && Wc(t.operation)
  );
}
const Gc = {
  connectionId: "crew",
  calendarId: "default"
}, He = (t, e) => t.actions.includes(e);
function uu(t, e, n, r) {
  const o = xe(zt()), { name: i } = Ut(), a = `/api/apps/${i}`, [s, c] = I([]), [l, d] = I([]), [h, f] = I([]), [g, y] = I(null), [b, w] = I(null), [x, D] = I(null), [E, _] = I(!0), [M, N] = I(!1), [H, W] = I(0), [A, B] = I({
    defaultDestination: Gc,
    showCrew: !0
  }), [$, z] = I(!1), Q = xe(0), J = xe(0), he = xe(0), L = xe(0), V = JSON.stringify(
    h.map((ee) => [ee.id, ee.state, ee.selectedCalendarIds])
  ), ae = _t(async () => {
    const ee = ++Q.current;
    try {
      const te = su(await o.current.get(`${a}/calendar/items`));
      ee === Q.current && (c(te.items), y(bs(te.errors)));
    } catch (te) {
      ee === Q.current && y(se("calendar.loadError", { error: Ee(te) }));
    } finally {
      ee === Q.current && _(!1);
    }
  }, [a]), fe = _t(async () => {
    const ee = ++he.current;
    try {
      const te = lu(
        await o.current.get(`${a}/calendar/connection`)
      );
      ee === he.current && (f(te.connections), D(null));
    } catch (te) {
      ee === he.current && (D(
        se("calendar.connectionLoadError", { error: Ee(te) })
      ), f([]));
    }
  }, [a]), ht = _t(async () => {
    const ee = ++L.current;
    try {
      const te = du(
        await o.current.get(`${a}/calendar/preferences`)
      );
      ee === L.current && (B(te.preferences), z(!0));
    } catch (te) {
      ee === L.current && r(
        se("settings.loadError", { error: Ee(te) }),
        "error"
      );
    }
  }, [a, r]), Be = _t(async () => {
    const ee = ++J.current;
    if (!h.some((te) => te.selectedCalendarIds.length)) {
      d([]), w(null);
      return;
    }
    try {
      const te = cu(
        await o.current.get(
          `${a}/calendar/events?start=${encodeURIComponent(t)}&end=${encodeURIComponent(e)}`
        )
      );
      ee === J.current && (d(te.events), w(bs(te.errors)));
    } catch (te) {
      ee === J.current && (d([]), w(se("calendar.lookupError", { error: Ee(te) })));
    }
  }, [a, t, e, V]);
  $e(() => {
    ae(), fe(), ht();
  }, [ae, fe, ht]), $e(() => {
    d([]);
  }, [Be]), $e(() => {
    Be();
  }, [Be, H]);
  const Ft = _t(async () => {
    W((ee) => ee + 1), await ae();
  }, [ae]);
  async function Me() {
    N(!0);
    try {
      await Promise.all([
        n(),
        ae(),
        fe(),
        ht(),
        Be()
      ]);
    } catch (ee) {
      r(Ee(ee), "error");
    } finally {
      N(!1);
    }
  }
  return {
    records: s,
    events: l,
    connections: h,
    recordError: g,
    eventError: b,
    connectionError: x,
    loading: E,
    refreshing: M,
    preferences: A,
    preferencesReady: $,
    loadRecords: ae,
    loadConnection: fe,
    loadPreferences: ht,
    changed: Ft,
    refresh: Me
  };
}
function Kc(t, e) {
  return (t == null ? void 0 : t.mode) === "provider" ? v(
    e === "apple" ? "delivery.confirmOnMac" : "delivery.confirmInProvider"
  ) : v("common.saveToThisCalendar");
}
const hu = (t) => v(
  (t == null ? void 0 : t.mode) === "provider" ? "delivery.providerPending" : "common.checkingTheSaveResult"
);
function mu(t) {
  switch (t) {
    case "ready":
      return "";
    case "needs_authorization":
      return v("connections.permissionRequired");
    case "denied":
      return v("connections.permissionDenied");
    case "unsupported":
      return v("connections.unsupported");
    case "unavailable":
      return v("connections.unavailable");
  }
}
function zi(t) {
  return (t == null ? void 0 : t.kind) === "custom" ? t.text : v(
    (t == null ? void 0 : t.kind) === "system" && t.key === "appleLocal" ? "connections.appleLocal" : "common.externalCalendar"
  );
}
function fa(t, e) {
  return [t ? zi(t) : "", e.sourceTitle, e.title].filter(Boolean).join(" · ");
}
function Vc(t, e) {
  var a;
  if (t.destination.connectionId === "crew") return "Crew Calendar";
  const n = e.find((s) => s.id === t.destination.connectionId), r = n == null ? void 0 : n.calendars.find(
    (s) => s.id === t.destination.calendarId
  ), o = ((a = t.delivery) == null ? void 0 : a.state) === "unavailable" ? void 0 : t.delivery, i = (n == null ? void 0 : n.displayName) ?? (o == null ? void 0 : o.connectionName);
  return fa(
    i,
    r ?? {
      title: (o == null ? void 0 : o.calendarTitle) || v("destination.unavailable"),
      sourceTitle: (o == null ? void 0 : o.sourceTitle) || ""
    }
  );
}
function ga(t) {
  return t && /^#[0-9a-f]{6}$/i.test(t) ? t : void 0;
}
function fu(t, e) {
  var o, i;
  if (t.destination.connectionId === "crew") return;
  const n = (o = e.find((a) => a.id === t.destination.connectionId)) == null ? void 0 : o.calendars.find((a) => a.id === t.destination.calendarId), r = ((i = t.delivery) == null ? void 0 : i.state) === "unavailable" ? void 0 : t.delivery;
  return ga((n == null ? void 0 : n.color) ?? (r == null ? void 0 : r.calendarColor));
}
function gu({
  connections: t,
  error: e,
  onRefresh: n
}) {
  return /* @__PURE__ */ k(
    Kr,
    {
      title: v("common.externalCalendarConnections"),
      actions: /* @__PURE__ */ p(P, { onClick: () => void n(), children: v("common.refreshConnections") }),
      children: [
        e && /* @__PURE__ */ p(ct, { children: ke(e) }),
        t.map((r) => /* @__PURE__ */ p(
          pu,
          {
            connection: r,
            onRefresh: n
          },
          r.id
        )),
        !t.length && !e && /* @__PURE__ */ p("p", { children: v("connections.empty") })
      ]
    }
  );
}
function pu({
  connection: t,
  onRefresh: e
}) {
  const n = zt(), { name: r } = Ut(), o = `/api/apps/${r}/calendar`, [i, a] = I(!1), [s, c] = I(null);
  async function l(f) {
    a(!0), c(null);
    try {
      await f(), await e();
    } catch (g) {
      c(Ee(g));
    } finally {
      a(!1);
    }
  }
  function d(f) {
    l(
      () => n.put(`${o}/connection`, {
        connectionId: t.id,
        selectedCalendarIds: f
      })
    );
  }
  const h = t.state === "ready";
  return /* @__PURE__ */ k("section", { className: "cc-connection-group", "aria-label": zi(t.displayName), children: [
    /* @__PURE__ */ p("h4", { children: zi(t.displayName) }),
    t.state !== "ready" && /* @__PURE__ */ p("p", { className: "cc-page-section-note", children: mu(t.state) }),
    s && /* @__PURE__ */ p(ct, { children: ke(s) }),
    ["needs_authorization", "denied"].includes(t.state) && /* @__PURE__ */ p(
      P,
      {
        disabled: i,
        onClick: () => void l(() => n.post(`${o}/authorize`, { connectionId: t.id })),
        children: v(i ? "common.checkThePermissionPrompt" : "connections.authorize")
      }
    ),
    h && t.capabilities.read && /* @__PURE__ */ k(tn, { children: [
      /* @__PURE__ */ p("p", { className: "cc-page-section-note", children: v("common.chooseTheCalendarsToDisplay") }),
      /* @__PURE__ */ p("div", { className: "cc-calendar-choices", children: t.calendars.map((f) => /* @__PURE__ */ p(
        sa,
        {
          disabled: i,
          checked: t.selectedCalendarIds.includes(f.id),
          onChange: (g) => d(
            g.target.checked ? [...t.selectedCalendarIds, f.id] : t.selectedCalendarIds.filter((y) => y !== f.id)
          ),
          children: /* @__PURE__ */ k("span", { children: [
            /* @__PURE__ */ p(
              "span",
              {
                className: "cc-calendar-dot",
                "aria-hidden": "true",
                style: { background: ga(f.color) ?? "var(--accent)" }
              }
            ),
            f.sourceTitle,
            " · ",
            f.title,
            !f.writable && /* @__PURE__ */ p("small", { children: v("common.readOnly") })
          ] })
        },
        f.id
      )) })
    ] })
  ] });
}
const ft = (t) => JSON.stringify([t.connectionId, t.calendarId]);
function Bo({
  connections: t,
  value: e,
  onChange: n,
  disabled: r = !1,
  label: o = v("common.saveToCalendar")
}) {
  const i = [
    { target: Gc, label: "Crew Calendar" },
    ...t.filter((s) => s.state === "ready" && s.capabilities.create).flatMap(
      (s) => s.calendars.filter((c) => c.writable).map((c) => ({
        target: { connectionId: s.id, calendarId: c.id },
        label: fa(s.displayName, c)
      }))
    )
  ], a = i.some(
    (s) => ft(s.target) === ft(e)
  );
  return /* @__PURE__ */ k("label", { className: "cc-field", children: [
    o,
    /* @__PURE__ */ k(
      Xo,
      {
        disabled: r,
        value: ft(e),
        onChange: (s) => {
          const [c, l] = JSON.parse(s.target.value);
          n({ connectionId: c, calendarId: l });
        },
        children: [
          !a && /* @__PURE__ */ p("option", { value: ft(e), disabled: !0, children: v("editor.destinationUnavailable") }),
          i.map((s) => /* @__PURE__ */ p("option", { value: ft(s.target), children: s.label }, ft(s.target)))
        ]
      }
    )
  ] });
}
function yu({
  value: t,
  connections: e,
  onRefresh: n
}) {
  const r = zt(), { name: o } = Ut(), [i, a] = I(!1), [s, c] = I(null);
  async function l(d) {
    a(!0), c(null);
    try {
      await r.put(`/api/apps/${o}/calendar/preferences`, d), await n();
    } catch (h) {
      c(Ee(h));
    } finally {
      a(!1);
    }
  }
  return /* @__PURE__ */ k(
    Kr,
    {
      title: v("common.defaultCalendar"),
      description: v("settings.localStorageDescription"),
      children: [
        /* @__PURE__ */ p(
          Bo,
          {
            label: v("common.defaultSaveCalendar"),
            disabled: i,
            connections: e,
            value: t.defaultDestination,
            onChange: (d) => void l({ defaultDestination: d })
          }
        ),
        /* @__PURE__ */ p(
          sa,
          {
            disabled: i,
            checked: t.showCrew,
            onChange: (d) => void l({ showCrew: d.target.checked }),
            children: v("common.showCrewCalendar")
          }
        ),
        s && /* @__PURE__ */ p(ct, { children: ke(s) })
      ]
    }
  );
}
function vu({
  drafts: t,
  timezone: e,
  error: n,
  onRefresh: r,
  onSelect: o,
  onDismiss: i,
  onOrigin: a
}) {
  return /* @__PURE__ */ k(
    Kr,
    {
      title: v("common.eventDrafts"),
      actions: /* @__PURE__ */ p(P, { onClick: r, children: v("common.refreshDrafts") }),
      children: [
        n && /* @__PURE__ */ p(ct, { children: ke(n) }),
        !t.length && /* @__PURE__ */ k(tn, { children: [
          /* @__PURE__ */ p("p", { children: v("common.noDraftsToReview") }),
          /* @__PURE__ */ p("p", { className: "cc-page-section-note", children: v("drafts.emptyHint") })
        ] }),
        t.length > 0 && /* @__PURE__ */ p("div", { children: t.map((s) => {
          var c, l, d;
          return /* @__PURE__ */ k("div", { className: "cc-list-row", children: [
            /* @__PURE__ */ k("div", { className: "cc-list-content", children: [
              /* @__PURE__ */ p("strong", { children: s.title }),
              /* @__PURE__ */ k("span", { children: [
                Cl(s.start, e),
                " ·",
                " ",
                ((c = s.delivery) == null ? void 0 : c.state) === "confirmed" ? v("common.saveConfirmed") : ((l = s.delivery) == null ? void 0 : l.state) === "awaiting_confirmation" ? v("common.awaitingSaveConfirmation") : ((d = s.delivery) == null ? void 0 : d.state) === "unknown" ? v("common.saveNeedsVerification") : v("common.draftForReview")
              ] }),
              s.reason && /* @__PURE__ */ p("small", { children: s.reason })
            ] }),
            /* @__PURE__ */ k("div", { className: "cc-inline-actions", children: [
              /* @__PURE__ */ p(P, { primary: !0, onClick: () => o(s), children: He(s, "edit") ? v("common.reviewAndEdit") : v("common.checkSaveStatus") }),
              s.origin.sessionKey.startsWith("dashboard:") && /* @__PURE__ */ p(P, { onClick: () => a(s.origin.sessionKey), children: v("common.originalConversation") }),
              He(s, "dismiss") && /* @__PURE__ */ p(P, { onClick: () => i(s), children: v("common.dismiss") })
            ] })
          ] }, s.id);
        }) })
      ]
    }
  );
}
function Cs({
  label: t,
  value: e,
  zone: n,
  onChange: r
}) {
  const o = ua(e.wall, n);
  return /* @__PURE__ */ k("div", { className: "cc-time-field", children: [
    /* @__PURE__ */ k("label", { className: "cc-field", children: [
      t,
      /* @__PURE__ */ p(
        Lo,
        {
          type: "datetime-local",
          required: !0,
          value: e.wall,
          onChange: (i) => r(Li(i.target.value, n))
        }
      )
    ] }),
    o.length > 1 && /* @__PURE__ */ k("label", { className: "cc-time-choice", children: [
      v("common.thisTimeOccursTwice"),
      /* @__PURE__ */ k(
        Xo,
        {
          "aria-label": v("time.offsetLabel", { field: t }),
          required: !0,
          value: qc(e, n),
          onChange: (i) => {
            var a;
            return r({
              ...e,
              instant: ((a = o.find((s) => s.offset === i.target.value)) == null ? void 0 : a.instant) || null
            });
          },
          children: [
            /* @__PURE__ */ p("option", { value: "", children: v("common.chooseWhichOccurrence") }),
            o.map((i, a) => /* @__PURE__ */ p("option", { value: i.offset, children: v("time.occurrenceOffset", {
              occurrence: a + 1,
              offset: i.offset
            }) }, i.offset))
          ]
        }
      )
    ] })
  ] });
}
function pa({
  item: t,
  initialTimes: e,
  date: n,
  timezone: r,
  refreshTimezone: o,
  heading: i,
  label: a,
  submitLabel: s,
  onClose: c,
  onSubmit: l,
  children: d,
  secondary: h,
  targetChanged: f = !1
}) {
  const g = () => {
    const L = Bd(n);
    return {
      title: (t == null ? void 0 : t.title) || "",
      start: t ? Dn(t.start, r) : e ? Dn(e.start, r) : Li(L.start, r),
      end: t != null && t.end ? Dn(t.end, r) : t ? Dn(jc(t), r) : e ? Dn(e.end, r) : Li(L.end, r),
      notes: (t == null ? void 0 : t.notes) || ""
    };
  }, [y, b] = I(() => {
    const L = g();
    return { zone: r, initial: L, values: L };
  }), w = (L) => ({
    ...L,
    start: ys(L.start, r),
    end: ys(L.end, r)
  }), x = y.zone === r ? y : {
    zone: r,
    initial: w(y.initial),
    values: w(y.values)
  };
  x !== y && b(x);
  const { initial: D, values: E } = x, _ = (L) => b((V) => ({ ...V, values: L(V.values) })), [M, N] = I(!1), [H, W] = I(null), [A, B] = I(!1), $ = xe(null), z = f || JSON.stringify(E) !== JSON.stringify(D);
  $e(() => {
    var L;
    return (L = $.current) == null || L.showModal(), () => {
      var V;
      return (V = $.current) == null ? void 0 : V.close();
    };
  }, []);
  const Q = () => {
    M || (z ? B(!0) : c());
  };
  function J(L, V) {
    _((ae) => ({ ...ae, [L]: V }));
  }
  async function he(L) {
    if (!M) {
      N(!0), W(null);
      try {
        if (await o() !== r)
          throw new mn(se("editor.timezoneChanged"));
        const ae = {
          ...E,
          timezone: r,
          start: vs(E.start, r),
          end: vs(E.end, r)
        };
        if (!Ac(ae.title) || Date.parse(ae.end) <= Date.parse(ae.start))
          throw new mn(se("editor.invalidFields"));
        const fe = Kd(ae);
        if (fe) throw new mn(se(fe));
        await L(ae);
      } catch (V) {
        W(Ee(V));
      } finally {
        N(!1);
      }
    }
  }
  return /* @__PURE__ */ p(
    "dialog",
    {
      ref: $,
      className: "cc-editor",
      "aria-labelledby": "cc-event-editor-title",
      onCancel: (L) => {
        L.preventDefault(), Q();
      },
      children: /* @__PURE__ */ k(
        "form",
        {
          onSubmit: (L) => {
            L.preventDefault(), he(l);
          },
          children: [
            /* @__PURE__ */ k("header", { className: "cc-editor-header", children: [
              /* @__PURE__ */ k("div", { children: [
                /* @__PURE__ */ p(Ui, { variant: "muted", children: a }),
                /* @__PURE__ */ p("h2", { id: "cc-event-editor-title", children: i })
              ] }),
              /* @__PURE__ */ p(
                P,
                {
                  disabled: M,
                  type: "button",
                  "aria-label": v("common.closeEditor"),
                  onClick: Q,
                  children: "×"
                }
              )
            ] }),
            /* @__PURE__ */ k("div", { className: "cc-editor-body", children: [
              /* @__PURE__ */ k("fieldset", { disabled: M, className: "cc-editor-fields", children: [
                /* @__PURE__ */ k("label", { className: "cc-field", children: [
                  v("common.title"),
                  /* @__PURE__ */ p(
                    Lo,
                    {
                      autoFocus: !0,
                      required: !0,
                      value: E.title,
                      onChange: (L) => J("title", L.target.value)
                    }
                  )
                ] }),
                /* @__PURE__ */ k("div", { className: "cc-field-pair", children: [
                  /* @__PURE__ */ p(
                    Cs,
                    {
                      label: v("common.start"),
                      value: E.start,
                      zone: r,
                      onChange: (L) => _((V) => ({ ...V, start: L }))
                    }
                  ),
                  /* @__PURE__ */ p(
                    Cs,
                    {
                      label: v("common.end"),
                      value: E.end,
                      zone: r,
                      onChange: (L) => _((V) => ({ ...V, end: L }))
                    }
                  )
                ] }),
                /* @__PURE__ */ p("p", { className: "cc-page-section-note", children: v("editor.timezoneHint", { zone: r }) }),
                /* @__PURE__ */ k("label", { className: "cc-field", children: [
                  v("common.description"),
                  /* @__PURE__ */ p(
                    jd,
                    {
                      rows: 3,
                      value: E.notes,
                      onChange: (L) => J("notes", L.target.value)
                    }
                  )
                ] }),
                d
              ] }),
              A && /* @__PURE__ */ k("div", { className: "cc-editor-confirm", role: "alert", children: [
                /* @__PURE__ */ p("p", { children: v("common.discardYourUnsavedChanges") }),
                /* @__PURE__ */ p(P, { type: "button", disabled: M, onClick: () => B(!1), children: v("common.keepEditing") }),
                /* @__PURE__ */ p(P, { type: "button", danger: !0, disabled: M, onClick: c, children: v("common.discardAndClose") })
              ] }),
              H && /* @__PURE__ */ p(ct, { children: ke(H) })
            ] }),
            /* @__PURE__ */ k("footer", { className: "cc-editor-footer", children: [
              /* @__PURE__ */ p(P, { type: "button", disabled: M, onClick: Q, children: v("common.cancel") }),
              /* @__PURE__ */ k("div", { children: [
                h && /* @__PURE__ */ p(
                  P,
                  {
                    type: "button",
                    disabled: M,
                    onClick: () => void he(h.action),
                    children: h.label
                  }
                ),
                /* @__PURE__ */ p(P, { primary: !0, type: "submit", disabled: M, children: M ? v("common.saving") : s })
              ] })
            ] })
          ]
        }
      )
    }
  );
}
function ya(t, e, n) {
  const r = e.find((o) => o.id === t.connectionId);
  return t.connectionId === "crew" ? n : Kc(r == null ? void 0 : r.confirmation, r == null ? void 0 : r.provider);
}
function wu(t) {
  const e = zt(), { name: n } = Ut(), [r, o] = I(t.defaultDestination), [i] = I(() => crypto.randomUUID());
  return /* @__PURE__ */ p(
    pa,
    {
      ...t,
      heading: v("common.addEvent"),
      label: v("common.newEvent"),
      submitLabel: ya(r, t.connections, v("common.save")),
      targetChanged: ft(r) !== ft(t.defaultDestination),
      onSubmit: async (a) => {
        const s = ar(
          await e.post(`/api/apps/${n}/calendar/items`, {
            ...a,
            destination: r,
            requestId: i
          })
        );
        await t.onSaved(s.item);
      },
      children: /* @__PURE__ */ p(
        Bo,
        {
          connections: t.connections,
          value: r,
          onChange: o
        }
      )
    }
  );
}
function bu(t) {
  const e = zt(), { name: n } = Ut(), r = `/api/apps/${n}/calendar`, [o, i] = I(t.defaultDestination), [a] = I(() => crypto.randomUUID());
  return /* @__PURE__ */ p(
    pa,
    {
      ...t,
      heading: v("common.reviewSuggestion"),
      label: v("common.draftForReview"),
      submitLabel: ya(o, t.connections, v("common.saveAsEvent")),
      targetChanged: ft(o) !== ft(t.defaultDestination),
      secondary: {
        label: v("common.saveDraftChanges"),
        action: async (s) => {
          const c = ar(
            await e.put(`${r}/items/${t.item.id}`, {
              ...s,
              revision: t.item.revision
            })
          );
          await t.onSaved(c.item);
        }
      },
      onSubmit: async (s) => {
        const c = ar(
          await e.post(`${r}/items/${t.item.id}/accept`, {
            ...s,
            revision: t.item.revision,
            destination: o,
            requestId: a
          })
        );
        await t.onSaved(c.item);
      },
      children: /* @__PURE__ */ p(
        Bo,
        {
          connections: t.connections,
          value: o,
          onChange: i
        }
      )
    }
  );
}
function xu(t) {
  const e = zt(), { name: n } = Ut(), [r, o] = I(t.item.destination), i = He(t.item, "retarget");
  return /* @__PURE__ */ p(
    pa,
    {
      ...t,
      heading: v("common.editEventDetails"),
      label: i ? v("common.editExternalSaveDetails") : "Crew Calendar",
      submitLabel: i ? ya(r, t.connections, v("common.saveChanges")) : v("common.saveChanges"),
      targetChanged: ft(r) !== ft(t.item.destination),
      onSubmit: async (a) => {
        const s = ar(
          await e.put(`/api/apps/${n}/calendar/items/${t.item.id}`, {
            ...a,
            revision: t.item.revision,
            ...i ? { destination: r } : {}
          })
        );
        await t.onSaved(s.item);
      },
      children: i ? /* @__PURE__ */ p(
        Bo,
        {
          connections: t.connections,
          value: r,
          onChange: o
        }
      ) : null
    }
  );
}
function Cu({
  items: t,
  onRestore: e
}) {
  const [n, r] = I(""), [o, i] = I(null);
  return /* @__PURE__ */ p("section", { className: "cc-section", children: /* @__PURE__ */ k(ui, { title: v("trash.count", { count: t.length }), children: [
    t.length > 0 && /* @__PURE__ */ p("div", { children: t.map((a) => /* @__PURE__ */ k("div", { className: "cc-list-row", children: [
      /* @__PURE__ */ p("strong", { children: a.title }),
      /* @__PURE__ */ p(
        P,
        {
          disabled: !!n || !He(a, "restore"),
          onClick: () => {
            r(a.id), i(null), e(a).catch((s) => i(Ee(s))).finally(() => r(""));
          },
          children: v("common.restore")
        }
      )
    ] }, a.id)) }),
    !t.length && /* @__PURE__ */ p("p", { children: v("common.noDeletedEvents") }),
    o && /* @__PURE__ */ p(ct, { children: ke(o) })
  ] }) });
}
const Xc = (t) => ({
  item: t,
  busy: !1,
  checking: !1,
  error: null
});
class Du {
  constructor(e, n, r) {
    gr(this, "state");
    gr(this, "ports");
    gr(this, "publish");
    this.ports = n, this.publish = r, this.state = Xc(e);
  }
  update(e) {
    this.state = { ...this.state, ...e }, this.publish(this.state);
  }
  async read() {
    const e = await this.ports.read();
    return this.update({ item: e, checking: !1 }), e;
  }
  async run(e) {
    if (!this.state.busy) {
      this.update({ busy: !0, error: null });
      try {
        await e();
      } catch (n) {
        this.update({ checking: !0, error: Ee(n) });
        try {
          await this.read();
        } catch {
        }
      } finally {
        this.update({ busy: !1 });
      }
    }
  }
  async refresh() {
    await this.run(async () => {
      await this.read();
    });
  }
  async save() {
    const e = this.state.item.delivery;
    await this.run(async () => {
      var a;
      const n = await this.read();
      if (!He(n, "submit")) return;
      const r = await this.ports.prepare(n.revision);
      this.update({ item: r.item, checking: !1 });
      const o = (e == null ? void 0 : e.state) === "prepared" && e.id === r.operation.id;
      if (((a = r.operation.confirmation) == null ? void 0 : a.mode) !== "provider" && !o)
        return;
      this.update({ checking: !0 });
      const i = await this.ports.execute(r.operation.id);
      this.update({ item: i.item, checking: !1 });
    });
  }
  async reconcile() {
    await this.run(async () => {
      const e = await this.read();
      if (!He(e, "reconcile") || !e.delivery || e.delivery.state === "unavailable")
        return;
      this.update({ checking: !0 });
      const n = await this.ports.reconcile(e.delivery.id);
      this.update({ item: n.item, checking: !1 });
    });
  }
}
function Eu({
  item: t,
  timezone: e,
  connections: n,
  refreshTimezone: r,
  startImmediately: o = !1,
  onClose: i,
  onChanged: a,
  onEdit: s,
  onDelete: c
}) {
  var W, A, B;
  const l = xe(zt()), { name: d } = Ut(), h = `/api/apps/${d}/calendar/items/${t.id}/delivery`, f = xe(null), g = xe(!1), [{ item: y, busy: b, checking: w, error: x }, D] = I(
    () => Xc(t)
  ), [E] = I(
    () => new Du(
      t,
      {
        read: async () => ar(
          await l.current.get(`/api/apps/${d}/calendar/items/${t.id}`)
        ).item,
        prepare: async ($) => (await r(), li(await l.current.post(h, { revision: $ }))),
        execute: async ($) => li(await l.current.post(`${h}/${$}/execute`)),
        reconcile: async ($) => li(await l.current.post(`${h}/${$}/reconcile`))
      },
      D
    )
  ), _ = ((W = y.delivery) == null ? void 0 : W.state) === "unavailable" ? null : y.delivery, M = (A = y.delivery) == null ? void 0 : A.state;
  $e(() => {
    var $;
    return ($ = f.current) == null || $.showModal(), () => {
      var z;
      return (z = f.current) == null ? void 0 : z.close();
    };
  }, []);
  async function N($) {
    const z = E.state.item;
    await $(), JSON.stringify(z) !== JSON.stringify(E.state.item) && await a();
  }
  $e(() => {
    g.current || (g.current = !0, N(() => o ? E.save() : E.refresh()));
  }, []), $e(() => {
    if (!w && M !== "awaiting_confirmation" && M !== "unknown") return;
    const $ = window.setInterval(() => {
      E.state.busy || N(() => E.refresh());
    }, 1500);
    return () => window.clearInterval($);
  }, [w, M, E]);
  const H = ($) => `${en($, e)} UTC${qc(Dn($, e), e)}`;
  return /* @__PURE__ */ k(
    "dialog",
    {
      ref: f,
      className: "cc-editor",
      "aria-labelledby": "cc-external-title",
      onCancel: ($) => {
        $.preventDefault(), b || i();
      },
      children: [
        /* @__PURE__ */ k("header", { className: "cc-editor-header", children: [
          /* @__PURE__ */ k("div", { children: [
            /* @__PURE__ */ p(Ui, { variant: "muted", children: v("common.externalCalendar") }),
            /* @__PURE__ */ p("h2", { id: "cc-external-title", children: v("common.saveStatus") })
          ] }),
          /* @__PURE__ */ p(P, { disabled: b, "aria-label": v("common.closeSaveStatus"), onClick: i, children: "×" })
        ] }),
        /* @__PURE__ */ k("div", { className: "cc-editor-body", children: [
          /* @__PURE__ */ p("h3", { children: y.title }),
          /* @__PURE__ */ k("p", { children: [
            H(y.start),
            " – ",
            y.end ? H(y.end) : ""
          ] }),
          y.notes && /* @__PURE__ */ p("p", { children: y.notes }),
          /* @__PURE__ */ p("p", { children: Vc(y, n) }),
          /* @__PURE__ */ k("div", { className: "cc-operation-state", role: "status", children: [
            !M && /* @__PURE__ */ p("p", { children: v("delivery.notSubmitted") }),
            M === "prepared" && /* @__PURE__ */ p("p", { children: v("delivery.reviewHint") }),
            M === "awaiting_confirmation" && /* @__PURE__ */ p("p", { children: hu(_ == null ? void 0 : _.confirmation) }),
            M === "confirmed" && /* @__PURE__ */ p("p", { children: v("delivery.confirmed") }),
            M === "cancelled" && /* @__PURE__ */ p("p", { children: v("delivery.cancelled") }),
            M === "failed" && /* @__PURE__ */ p(ct, { children: _ != null && _.error ? ke(Ee(_.error)) : v("delivery.failed") }),
            M === "unknown" && /* @__PURE__ */ p("p", { children: v("delivery.unknown") }),
            ((B = y.delivery) == null ? void 0 : B.state) === "unavailable" && /* @__PURE__ */ p(ct, { children: ke(Ee(y.delivery.error)) }),
            (_ == null ? void 0 : _.verification) && _.verification.state !== "confirmed" && /* @__PURE__ */ p(ct, { children: _.verification.error ? ke(Ee(_.verification.error)) : v("delivery.eventChanged") })
          ] }),
          w && /* @__PURE__ */ p("p", { role: "status", children: v("delivery.checking") }),
          x && /* @__PURE__ */ p(ct, { children: ke(x) }),
          !w && (He(y, "edit") || He(y, "delete")) && /* @__PURE__ */ k("div", { className: "cc-inline-actions", children: [
            He(y, "edit") && /* @__PURE__ */ p(P, { disabled: b, onClick: () => s(y), children: v("common.editDetails") }),
            He(y, "delete") && /* @__PURE__ */ p(
              P,
              {
                danger: !0,
                disabled: b,
                onClick: () => void N(() => E.run(() => c(y))),
                children: v("common.deleteRequest")
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ k("footer", { className: "cc-editor-footer", children: [
          /* @__PURE__ */ p(P, { disabled: b, onClick: i, children: v("common.close") }),
          /* @__PURE__ */ k("div", { children: [
            !w && He(y, "submit") && /* @__PURE__ */ p(
              P,
              {
                primary: !0,
                disabled: b,
                onClick: () => void N(() => E.save()),
                children: (_ == null ? void 0 : _.state) === "prepared" ? Kc(_.confirmation, _.provider) : v("common.continueExternalSave")
              }
            ),
            (w || He(y, "reconcile")) && /* @__PURE__ */ p(
              P,
              {
                disabled: b,
                onClick: () => void N(() => w ? E.refresh() : E.reconcile()),
                children: v(w ? "common.checkCurrentSaveStatus" : "common.verifySaveResult")
              }
            )
          ] })
        ] })
      ]
    }
  );
}
function Qc(t, e, n, r) {
  const o = new Date(t.start), i = new Date(t.end);
  if (!Number.isFinite(+o) || !Number.isFinite(+i) || i <= o) return [];
  const a = en(o, r), s = {
    startDate: t.allDay ? t.startDate : a.slice(0, 10),
    endDate: t.allDay ? oe(ge(Wr(t.endDate), -1)) : en(i, r).slice(0, 10),
    timeLabels: t.allDay ? void 0 : ps(+o, +i, r)
  }, c = t.allDay ? It(t.startDate, e) : It(a.slice(0, 10), e), l = t.allDay ? It(t.endDate, e) - 1 : It(en(new Date(+i - 1), r).slice(0, 10), e), d = JSON.stringify([
    "event",
    t.connectionId ?? null,
    t.calendarId,
    t.eventId,
    o.getTime()
  ]), h = [];
  for (let f = Math.max(c, n.first); f <= Math.min(l, n.end - 1); f++) {
    const g = Gr(oe(ge(e, f)), r);
    if (g.durationMinutes === 0) continue;
    const y = Math.max(+o, g.startMs), b = Math.min(+i, g.endMs);
    !t.allDay && b <= y || h.push({
      id: `event:${JSON.stringify([t.connectionId ?? null, t.calendarId, t.eventId, t.start, f])}`,
      occurrenceKey: d,
      day: f,
      title: t.title,
      start: t.allDay ? 0 : (y - g.startMs) / 6e4,
      end: t.allDay ? void 0 : (b - g.startMs) / 6e4,
      timeLabels: t.allDay ? void 0 : ps(y, b, r, g.endMs),
      interval: s,
      allDay: t.allDay,
      source: "",
      calendarColor: ga(t.calendarColor),
      calendarLocation: fa(t.connectionName, {
        title: t.calendarTitle,
        sourceTitle: t.sourceTitle
      }),
      description: t.notes,
      storage: "external",
      itemId: t.itemId,
      providerEvent: t
    });
  }
  return h;
}
function ku(t, e, n, r, o, i = []) {
  return t.filter((a) => !a.deletedAt && a.status !== "dismissed").flatMap((a) => {
    var l;
    const s = a.status === "proposed", c = a.destination.connectionId === "crew";
    return (s ? ((l = a.delivery) == null ? void 0 : l.state) === "confirmed" : a.externalRef || c && !o) ? [] : Number.isFinite(Date.parse(a.start)) ? Qc(
      {
        eventId: a.id,
        calendarId: s ? "drafts" : "default",
        title: a.title,
        start: a.start,
        end: jc(a),
        allDay: !1,
        startDate: "",
        endDate: "",
        timezone: a.timezone,
        calendarTitle: s ? v("common.draft") : "Crew Calendar",
        sourceTitle: "Crew",
        notes: a.notes || (s ? a.reason : ""),
        recurring: !1
      },
      e,
      n,
      r
    ).map((d) => {
      var h;
      return {
        ...d,
        id: `draft:${a.id}@${d.day}`,
        occurrenceKey: JSON.stringify(["draft", a.id]),
        storage: s ? "draft" : c ? "local" : "pending",
        itemId: a.id,
        providerEvent: void 0,
        source: s && a.source === "proactive" ? v("common.crewSuggestion") : "",
        calendarLocation: s ? void 0 : Vc(a, i),
        calendarColor: s ? d.calendarColor : fu(a, i),
        deliveryState: s || c ? void 0 : ((h = a.delivery) == null ? void 0 : h.state) ?? "unsubmitted"
      };
    }) : [];
  });
}
function Tu(t) {
  switch (t) {
    case "ok":
      return null;
    case "not_run":
      return { text: v("suggestions.registered"), failure: !1 };
    case "timeout":
      return { text: v("suggestions.runTimeout"), failure: !0 };
    case "blocked":
      return { text: v("suggestions.runBlocked"), failure: !0 };
    case "error":
      return { text: v("suggestions.runFailed"), failure: !0 };
    default:
      return { text: v("suggestions.runUnknown"), failure: !1 };
  }
}
function _u() {
  const t = zt(), e = xe(t);
  e.current = t;
  const { name: n } = Ut(), [r, o] = I(), [i, a] = I(!1), [s, c] = I(null), [l, d] = I(""), [h, f] = I(!1), g = xe(!0), y = `/api/apps/${n}/settings`, b = _t(async () => {
    a(!0), c(null);
    try {
      const N = Pi(await e.current.get(y));
      g.current && o(N);
    } catch {
      g.current && c(se("suggestions.loadError"));
    } finally {
      g.current && a(!1);
    }
  }, [y]);
  $e(() => (g.current = !0, b(), () => {
    g.current = !1;
  }), [b]);
  async function w(N) {
    a(!0), c(null);
    try {
      const H = Pi(await e.current.put(y, N));
      g.current && (o(H), d(""));
    } catch {
      g.current && c(se("suggestions.saveError"));
    } finally {
      g.current && a(!1);
    }
  }
  const x = r == null ? void 0 : r.settings.suggestionsEnabled, D = (r == null ? void 0 : r.hook.status) === "ready", E = (r == null ? void 0 : r.settings.sessionKeys) ?? [], _ = D && E.length > 0, M = Tu(r == null ? void 0 : r.hook.executionStatus);
  return /* @__PURE__ */ k(
    Kr,
    {
      title: v("common.eventSuggestionsInConversations"),
      actions: /* @__PURE__ */ p(P, { disabled: i, onClick: () => void b(), children: v("common.refreshSettings") }),
      children: [
        /* @__PURE__ */ p(
          _a,
          {
            action: /* @__PURE__ */ k("div", { className: "cc-proposal-toggle", children: [
              /* @__PURE__ */ p("span", { children: r ? i ? v("common.savingStatus") : x ? "ON" : "OFF" : v("common.checking") }),
              /* @__PURE__ */ p(
                ul,
                {
                  checked: x ?? !1,
                  label: v("common.eventSuggestionsInConversations"),
                  disabled: i || !r || !x && !_,
                  onChange: (N) => void w({ suggestionsEnabled: N })
                }
              )
            ] }),
            children: /* @__PURE__ */ k("p", { className: "cc-page-section-note", children: [
              v("suggestions.description"),
              /* @__PURE__ */ p("br", {}),
              v("suggestions.reviewHint")
            ] })
          }
        ),
        /* @__PURE__ */ p("p", { className: "cc-page-section-note", children: v("suggestions.activationHint") }),
        s && /* @__PURE__ */ p(ct, { children: ke(s) }),
        r && !D && /* @__PURE__ */ p("p", { role: "status", className: "cc-page-section-note", children: r.hook.status === "blocked" ? v("suggestions.policyBlocked") : v("suggestions.setupRequired") }),
        D && M && (M.failure ? /* @__PURE__ */ p(ct, { children: M.text }) : /* @__PURE__ */ p("p", { className: "cc-page-section-note", role: "status", children: M.text })),
        /* @__PURE__ */ k(ui, { title: v("suggestions.conversationCount", { count: E.length }), children: [
          /* @__PURE__ */ p("p", { className: "cc-page-section-note", children: v("suggestions.scopeHint") }),
          E.map((N) => {
            var H;
            return /* @__PURE__ */ p(
              _a,
              {
                action: /* @__PURE__ */ p(
                  P,
                  {
                    disabled: i,
                    onClick: () => void w({
                      sessionKeys: E.filter((W) => W !== N),
                      ...E.length === 1 ? { suggestionsEnabled: !1 } : {}
                    }),
                    children: v("common.remove")
                  }
                ),
                children: /* @__PURE__ */ p("span", { children: ((H = r == null ? void 0 : r.chats.find((W) => W.sessionKey === N)) == null ? void 0 : H.title) ?? v("common.closedConversation") })
              },
              N
            );
          }),
          /* @__PURE__ */ p(
            _s,
            {
              field: /* @__PURE__ */ k(
                Xo,
                {
                  "aria-label": v("common.conversationForSuggestions"),
                  value: l,
                  disabled: i || !r,
                  onChange: (N) => d(N.target.value),
                  children: [
                    /* @__PURE__ */ p("option", { value: "", children: v("common.chooseAConversation") }),
                    r == null ? void 0 : r.chats.filter((N) => !E.includes(N.sessionKey)).map((N) => /* @__PURE__ */ p("option", { value: N.sessionKey, children: N.title }, N.sessionKey))
                  ]
                }
              ),
              action: /* @__PURE__ */ p(
                P,
                {
                  disabled: i || !l,
                  onClick: () => void w({ sessionKeys: [...E, l] }),
                  children: v("common.add")
                }
              )
            }
          )
        ] }),
        (r == null ? void 0 : r.hook.command) && !D && /* @__PURE__ */ k(ui, { title: v("common.connectSuggestions"), children: [
          /* @__PURE__ */ p("p", { className: "cc-page-section-note", children: v("suggestions.setupInstructions") }),
          /* @__PURE__ */ p("pre", { className: "cc-hook-command", children: r.hook.command })
        ] }),
        /* @__PURE__ */ p(P, { "aria-expanded": h, onClick: () => f((N) => !N), children: v(h ? "suggestions.hideExample" : "suggestions.showExample") }),
        h && /* @__PURE__ */ p("div", { className: "cc-proposal-example", children: /* @__PURE__ */ k("blockquote", { children: [
          v("suggestions.exampleUser"),
          /* @__PURE__ */ p("br", {}),
          v("suggestions.exampleAssistant")
        ] }) })
      ]
    }
  );
}
const Bc = '.cc-calendar{--cc-detail-width: 340px;--cc-space-page: calc(var(--spacing) * 4);--cc-space-field: calc(var(--spacing) * 4)}@media(min-width:48rem){.cc-calendar{--cc-space-page: calc(var(--spacing) * 6)}}.cc-calendar{display:flex;flex:1;flex-direction:column;min-height:0;color:var(--text);font-family:var(--font-body);font-size:var(--text-sm);container-type:inline-size;container-name:calendar}.cc-calendar *{box-sizing:border-box}.cc-calendar svg{flex-shrink:0}.cc-calendar [hidden]{display:none}.cc-inline-actions{display:flex;gap:8px;flex-wrap:wrap}.cc-field{display:flex;flex-direction:column;gap:8px;font-size:var(--text-xs);font-weight:500;min-width:0;margin:0}.cc-field small{color:var(--muted);font-size:var(--text-xs);font-weight:400;line-height:1.7}.cc-field-pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:var(--cc-space-field)}.cc-field>input{width:100%;flex:none}.cc-native-control{box-sizing:border-box;min-width:0;width:100%;padding:calc(var(--spacing) * 2) calc(var(--spacing) * 3);border:1px solid var(--border);border-radius:var(--radius-md);background:var(--bg-elevated);color:var(--text);font-family:var(--font-body);font-size:var(--text-sm);line-height:var(--leading-normal)}.cc-native-control:disabled{opacity:.4;cursor:not-allowed}textarea.cc-native-control{resize:vertical}.cc-checkbox{display:flex;align-items:center;gap:calc(var(--spacing) * 2);padding:calc(var(--spacing) * 1.5) 0;margin:0;cursor:pointer;font-size:var(--text-sm)}.cc-checkbox input{accent-color:var(--accent)}.cc-route-panel{display:flex;flex:1;min-height:0;overflow:hidden}.cc-feedback{--cc-feedback-color: var(--accent);--cc-feedback-background: var(--accent-subtle);display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px var(--cc-space-page);background:var(--cc-feedback-background);color:var(--cc-feedback-color);font-size:var(--text-xs);flex-wrap:wrap}.cc-feedback>div{display:flex;gap:6px}@container calendar (max-width: 600px){.cc-feedback{padding-block:10px}}.cc-feedback--error{--cc-feedback-color: var(--danger);--cc-feedback-background: var(--danger-subtle);border-inline-start:3px solid var(--danger)}.cc-work-nav{display:flex;gap:4px;padding:0 var(--cc-space-page) 12px;flex-wrap:wrap}.cc-calendar-dot{display:inline-block;width:9px;height:9px;margin-right:7px;border-radius:50%;background:var(--accent)}.cc-app-header{position:relative;z-index:20;flex-shrink:0}.cc-app-title{font:inherit;margin:0}.cc-workspace-page{flex:1;min-width:0;min-height:0;width:100%;overflow-y:auto;padding:calc(var(--spacing) * 4) var(--cc-space-page) calc(var(--spacing) * 6)}.cc-workspace-page>.cc-inline-error{margin-block-end:calc(var(--spacing) * 3)}.cc-page-heading{margin:0 0 calc(var(--spacing) * 4)}.cc-page-heading h2{font-size:var(--text-lg);font-weight:600;letter-spacing:var(--tracking-tight);margin:0}.cc-page-section-note{font-size:var(--text-xs);color:var(--muted);line-height:1.7;margin:0}@container calendar (max-width: 760px){.cc-workspace-page{padding-bottom:calc(var(--spacing) * 4)}}.cc-list-row{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 0;border-top:1px solid var(--border)}.cc-list-content{display:grid;gap:4px;min-width:0;font-size:var(--text-xs)}.cc-list-row strong{min-width:0;overflow-wrap:anywhere;font-size:var(--text-sm);font-weight:500}.cc-list-row small{color:var(--muted);font-size:var(--text-xs);overflow-wrap:anywhere}.cc-section+.cc-section{margin-block-start:calc(var(--spacing) * 6);padding-block-start:calc(var(--spacing) * 6);border-block-start:1px solid var(--border)}.cc-section{container:section / inline-size}.cc-section-header{display:flex;align-items:center;justify-content:space-between;gap:calc(var(--spacing) * 4);min-block-size:calc(var(--spacing) * 8);margin-block-end:calc(var(--spacing) * 3)}.cc-section-header h3{min-inline-size:0;margin:0;font-size:var(--text-base);font-weight:600}.cc-section-actions{display:flex;flex-wrap:wrap;gap:calc(var(--spacing) * 2)}.cc-section-body,.cc-disclosure-body{display:grid;gap:calc(var(--spacing) * 3)}.cc-section-body>p,.cc-disclosure-body>p{margin:0}.cc-section-body>button{justify-self:start}.cc-disclosure{min-inline-size:0}.cc-disclosure>summary{cursor:pointer;font-size:var(--text-sm);font-weight:600;padding-block:calc(var(--spacing) * 1.5)}.cc-disclosure-body{padding-block-start:calc(var(--spacing) * 3)}@container section (max-width: 540px){.cc-section-header{align-items:flex-start;flex-direction:column;gap:calc(var(--spacing) * 2)}}.cc-control-cell{display:grid;grid-template-rows:minmax(0,1fr);align-items:stretch;block-size:calc(var(--spacing) * 10);min-inline-size:0;flex-shrink:0}.cc-control-row{display:flex;align-items:center;gap:calc(var(--spacing) * 2);min-inline-size:0}.cc-control-field{flex:1;min-inline-size:0}.cc-control-meta{flex-shrink:0;white-space:nowrap;color:var(--muted);font-size:var(--text-xs)}.cc-inline-error{margin:0;color:var(--danger);font-size:var(--text-xs);line-height:1.7}.cc-popover{position:relative}.cc-popover-panel{position:absolute;top:calc(100% + var(--spacing) * 2);z-index:25;inline-size:min(300px,calc(100vw - var(--spacing) * 8));padding:calc(var(--spacing) * 4);background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg)}.cc-popover-start{inset-inline-start:0}.cc-popover-end{inset-inline-end:0}.cc-popover-panel h3{margin:0 0 calc(var(--spacing) * 3);font-size:var(--text-sm);font-weight:600}.cc-popover-panel form{display:grid;gap:calc(var(--spacing) * 3)}.cc-content{padding:0 var(--cc-space-page) 12px;min-height:0;flex:1;display:flex;flex-direction:column;overflow:visible}.cc-workspace{position:relative;display:flex;min-height:0;flex:1;align-items:stretch;gap:16px}.cc-main{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0}.cc-empty{display:flex;align-items:center;justify-content:safe center;flex-direction:column;text-align:center;min-height:0;overflow-y:auto;padding:35px;flex:1;border-top:1px solid var(--border)}.cc-empty-icon{color:var(--accent);background:var(--accent-subtle);padding:17px;border-radius:var(--radius-xl)}.cc-empty h3{margin:24px 0 12px;font-size:var(--text-xl);font-weight:600;letter-spacing:-.025em}.cc-empty p{max-width:340px;color:var(--muted);font-size:var(--text-sm);line-height:1.8;margin:0 0 24px}.cc-search-row{margin-bottom:10px}.cc-state-panel{display:flex;align-items:center;justify-content:safe center;flex-direction:column;text-align:center;min-height:0;overflow-y:auto;padding:28px;flex:1}.cc-state-panel h3{font-size:var(--text-xl);font-weight:500;margin:10px 0}.cc-state-panel p{font-size:var(--text-sm);color:var(--muted);line-height:1.8;margin:8px 0 20px}.cc-empty>button+button{margin-top:10px}@container calendar (max-width: 760px){.cc-content{padding-bottom:10px;overflow:visible}.cc-empty{padding:30px 15px}.cc-empty h3{font-size:var(--text-lg)}}.cc-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;min-height:44px;margin-bottom:8px;padding:2px 0;position:relative;z-index:10}.cc-date-nav{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.cc-toolbar-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}@container calendar (max-width: 760px){.cc-toolbar .cc-popover{position:static}.cc-toolbar{gap:9px}.cc-toolbar-actions{margin-left:auto}}.cc-date-trigger{display:inline-flex;align-items:center;gap:calc(var(--spacing) * 2);border:0;background:transparent;color:inherit;font:inherit;font-size:var(--text-lg);font-weight:600;letter-spacing:var(--tracking-tight);cursor:pointer;padding:calc(var(--spacing) * 1.5);border-radius:var(--radius-md)}@container calendar (max-width: 760px){.cc-date-trigger{font-size:var(--text-sm)}}.cc-event-button:hover{background:var(--accent-subtle)}.cc-event-button[aria-pressed=true]{box-shadow:inset 0 0 0 2px var(--accent)}.cc-event-status{flex-shrink:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-radius:var(--radius-sm);padding:0 3px;background:var(--bg-elevated);color:var(--text);font-size:var(--text-xs);font-weight:500}.cc-grid-head{position:sticky;top:0;z-index:6;height:60px;background:var(--bg);display:grid;grid-template-columns:54px repeat(var(--cc-day-columns),minmax(0,1fr));border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding-right:0}.cc-all-day{position:sticky;top:60px;z-index:6;background:var(--bg);display:grid;grid-template-columns:54px repeat(var(--cc-day-columns),minmax(0,1fr));border-bottom:1px solid var(--border);min-height:29px;padding-right:0}.cc-grid-corner{align-self:end;font-size:var(--text-xs);color:var(--muted);padding:0 0 12px 8px}.cc-day-heading{border:0;background:transparent;cursor:pointer;font:inherit;display:flex;gap:2px;flex-direction:column;align-items:center;padding:6px 3px;color:var(--muted);font-size:var(--text-xs);height:58px}.cc-date-number{font-size:var(--text-lg);font-weight:500;color:var(--text)}.cc-all-day>span{align-self:center;padding-left:8px;font-size:var(--text-xs);color:var(--muted)}.cc-all-day>div{padding:3px 4px;border-left:1px solid var(--border)}.cc-all-day-event{font-size:var(--text-xs);display:block;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 6px;background:color-mix(in srgb,var(--cc-calendar-color) 9%,var(--bg));border:0;text-align:left}.cc-time-scroll{overflow-y:scroll;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--border) transparent;min-height:160px;max-height:none;flex:1;scrollbar-gutter:stable}.cc-time-grid{display:grid;grid-template-columns:54px repeat(var(--cc-day-columns),minmax(0,1fr));height:var(--cc-day-height)}.cc-hour-labels{position:relative}.cc-hour-labels>span{position:absolute;right:10px;transform:translateY(-50%);font-size:var(--text-xs);font-variant-numeric:tabular-nums;color:var(--muted)}.cc-hour-labels>span:first-child{transform:none}.cc-day-column{position:relative;border-left:1px solid var(--border);background:repeating-linear-gradient(to bottom,transparent 0,transparent calc(var(--cc-hour-height) - 1px),var(--border) calc(var(--cc-hour-height) - 1px),var(--border) var(--cc-hour-height))}.cc-weekend{background-color:color-mix(in srgb,var(--muted) 3%,var(--bg))}.cc-item{position:absolute;display:flex;flex-direction:column;justify-content:flex-start;text-align:left;white-space:normal;align-items:stretch;border-radius:5px;font-size:var(--text-sm);line-height:1.35;padding:6px 7px;color:var(--text);min-width:0;z-index:2;-webkit-appearance:none;-moz-appearance:none;appearance:none;font-family:inherit;font-weight:400;cursor:pointer}.cc-item-title{display:flex;gap:4px;align-items:flex-start;font-weight:600}.cc-item-title svg{flex-shrink:0;margin-top:1px}.cc-item-title>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cc-item-meta{display:flex;gap:4px;align-items:center;margin-top:3px}.cc-item-time{display:block;font-size:var(--text-xs);color:var(--muted);font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cc-item-meta .cc-event-status{flex-shrink:1;min-width:0}.cc-item-meta .cc-event-status+.cc-item-time{min-width:min(5ch,100%);text-overflow:clip}.cc-item-event{border:0;border-left:3px solid var(--cc-calendar-color);background:color-mix(in srgb,var(--cc-calendar-color) 9%,var(--bg));overflow:hidden}.cc-item-event-short{padding:4px 7px;border-left:0;background:var(--bg)}.cc-item-event-short:before{content:"";position:absolute;top:0;left:0;width:3px;height:var(--cc-span);border-radius:var(--radius-sm);background:var(--cc-calendar-color)}.cc-now-line{position:absolute;left:0;right:0;height:1px;background:var(--accent);z-index:3;pointer-events:none}.cc-now-line:before{content:"";position:absolute;left:-3px;top:-3px;width:7px;height:7px;background:var(--accent);border-radius:50%}.cc-now-line span{position:absolute;right:2px;top:1px;font-size:var(--text-xs);background:var(--bg);color:var(--accent);padding:0 2px}.cc-time-axis-note{margin:6px 0;color:var(--muted);font-size:var(--text-xs)}.cc-day-clock{position:absolute;width:54px;text-align:right;right:3px;transform:translateY(-100%);font-size:var(--text-xs);line-height:12px;color:var(--muted);pointer-events:none}.cc-day-clock:first-child{transform:none}.cc-day-clock>span{display:block;white-space:nowrap}.cc-month-view{height:100%;overflow:auto}.cc-month-weekdays{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));position:sticky;top:0;z-index:1;background:var(--bg);text-align:center;font-size:var(--text-xs);color:var(--muted);padding:10px 0;border-bottom:1px solid var(--border)}.cc-month-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));min-height:calc(100% - 38px);grid-template-rows:repeat(6,minmax(100px,1fr))}.cc-month-cell{position:relative;min-width:0;padding:5px;border-right:1px solid var(--border);border-bottom:1px solid var(--border)}.cc-month-cell:nth-child(7n){border-right:0}.cc-month-day{display:block;width:27px;height:27px;border:0;background:transparent;color:inherit;border-radius:50%;font-size:var(--text-xs);cursor:pointer;margin-bottom:3px;padding:0}.cc-outside-month .cc-month-day{color:var(--muted)}.cc-outside-month{background:color-mix(in srgb,var(--border) 15%,transparent)}.cc-month-item{width:100%;display:grid;grid-template-columns:auto minmax(0,1fr);gap:2px 4px;align-items:center;text-align:left;padding:4px;margin-bottom:3px;border:0;border-left:2px solid var(--cc-calendar-color);border-radius:var(--radius-sm);color:inherit;background:color-mix(in srgb,var(--cc-calendar-color) 7%,transparent);font:inherit;font-size:var(--text-xs);cursor:pointer}.cc-month-item .cc-event-status{grid-column:1 / -1;justify-self:start}.cc-month-item span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cc-month-item-time{flex-shrink:0;color:var(--muted);font-size:var(--text-xs)}.cc-month-more{border:0;background:transparent;color:var(--muted);font-size:var(--text-xs);padding:3px;cursor:pointer}@container calendar (max-width: 760px){.cc-month-cell{padding:3px}.cc-month-item-time{display:none}.cc-month-item span:last-child{grid-column:1 / -1}}.cc-month-add{position:absolute;top:6px;right:6px;border:0;padding:4px;border-radius:var(--radius-sm);color:var(--muted);background:transparent;cursor:pointer}.cc-month-add:hover{background:var(--accent-subtle);color:var(--text)}.cc-year-view{height:100%;overflow:auto;padding:18px}.cc-year-note{font-size:var(--text-xs);color:var(--muted);margin:0 0 18px}.cc-year-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.cc-year-month{border:1px solid transparent;border-radius:var(--radius-lg);background:transparent;color:inherit;text-align:left;padding:10px;cursor:pointer;font:inherit}.cc-year-month:hover{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 4%,transparent)}.cc-year-month:focus-visible{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 4%,transparent)}.cc-year-month-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.cc-year-month-heading strong{font-size:var(--text-sm)}.cc-year-month-heading small{color:var(--muted);font-size:var(--text-xs)}.cc-mini-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));text-align:center;gap:1px 0}.cc-mini-grid>span{min-height:18px;line-height:18px;position:relative;font-size:var(--text-xs)}.cc-mini-weekday{color:var(--muted)}.cc-occupied-day:after{content:"";position:absolute;bottom:0;left:calc(50% - 1.5px);width:3px;height:3px;border-radius:50%;background:var(--accent)}@container calendar (max-width: 900px){.cc-year-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}}@container calendar (max-width: 760px){.cc-year-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.cc-year-view{padding:10px}}.cc-agenda{width:100%;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border) transparent;scrollbar-gutter:stable;max-height:none;min-height:160px;flex:1}.cc-agenda section{margin-bottom:25px}.cc-agenda h3{display:flex;align-items:center;gap:8px;font-size:var(--text-sm);font-weight:600;padding:14px 2px 11px;margin:0;border-bottom:1px solid var(--border)}.cc-agenda h3>span{font-size:var(--text-xs);color:var(--muted);font-weight:400}.cc-agenda-item{display:grid;grid-template-columns:112px minmax(0,1fr) auto;align-items:center;background:transparent;color:var(--text);font:inherit;cursor:pointer;width:100%;text-align:left;border:0;border-bottom:1px solid var(--border);border-radius:0;padding:12px 8px;gap:4px 16px}.cc-agenda-time{width:auto;flex-shrink:0;font-size:var(--text-xs);color:var(--muted);font-variant-numeric:tabular-nums}.cc-agenda-title{display:flex;align-items:center;gap:8px;flex:1;min-width:0;font-size:var(--text-sm);overflow-wrap:anywhere}.cc-agenda-source,.cc-agenda-delivery{grid-column:2;font-size:var(--text-xs)}.cc-agenda-month{font-size:var(--text-sm);font-weight:600;margin:18px 0 4px;color:var(--muted)}.cc-agenda-month:first-child{margin-top:0}.cc-agenda-source{grid-row:2;color:var(--muted)}.cc-agenda-delivery{color:var(--accent)}.cc-agenda-item>svg{grid-column:3;grid-row:1}@container calendar (max-width: 760px){.cc-agenda-item{grid-template-columns:1fr auto;gap:6px}.cc-agenda-time,.cc-agenda-title{grid-column:1}.cc-agenda-source,.cc-agenda-delivery{grid-column:1;grid-row:auto}.cc-agenda-item>svg{grid-column:2}}.cc-detail{width:var(--cc-detail-width);flex:0 0 var(--cc-detail-width);background:var(--card);border-left:1px solid var(--border);padding:18px 20px;overflow-y:auto;max-height:none}.cc-detail-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.cc-kind-label{display:flex;align-items:center;gap:6px;font-size:var(--text-xs);color:var(--accent)}.cc-detail h2{font-size:var(--text-xl);letter-spacing:-.03em;line-height:1.4;font-weight:600;margin:12px 0 18px;overflow-wrap:anywhere}.cc-detail h2:focus{outline:none}.cc-description{font-size:var(--text-sm);color:var(--muted);line-height:1.8;margin:17px 0 22px}.cc-detail dl{display:grid;grid-template-columns:64px minmax(0,1fr);gap:12px 12px;font-size:var(--text-sm);padding:16px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin:0}.cc-detail dt{color:var(--muted);display:flex;gap:6px;align-items:center}.cc-detail dd{margin:0;overflow-wrap:anywhere}.cc-detail-bottom{padding-top:16px;margin:24px 0 0;border-top:1px solid var(--border);font-size:var(--text-xs);color:var(--muted)}.cc-detail-overlay .cc-detail{position:absolute;z-index:8;right:0;top:0;bottom:0;width:min(var(--cc-detail-width),100%);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg)}@container calendar (max-width: 760px){.cc-detail-overlay .cc-detail{width:100%}}.cc-detail .cc-inline-actions{margin-top:18px}.cc-date-badge{display:inline-grid;place-items:center;justify-self:center;flex-shrink:0;position:relative;width:27px;height:27px;border-radius:50%}.cc-date-badge-mini{width:18px;height:18px}.cc-date-badge.cc-date-badge-today{background:var(--accent);color:var(--accent-fg)}.cc-editor{container:editor / inline-size;padding:0;position:fixed;inset:0 0 0 auto;margin:0;width:min(460px,100vw);height:100dvh;max-height:100dvh;max-width:100vw;border:0;border-left:1px solid var(--border);background:var(--card);color:var(--text);box-shadow:var(--shadow-lg);overflow:hidden}.cc-editor[open]{display:flex;flex-direction:column}.cc-editor::backdrop{background:color-mix(in srgb,var(--bg) 60%,transparent);-webkit-backdrop-filter:blur(var(--blur-md));backdrop-filter:blur(var(--blur-md))}.cc-editor form{display:flex;flex-direction:column;min-height:0;margin:0;height:100%}.cc-editor-header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:calc(var(--spacing) * 6);border-bottom:1px solid var(--border);flex-shrink:0}.cc-editor-header h2{display:flex;gap:8px;align-items:center;font-size:var(--text-xl);font-weight:600;margin:12px 0 0}.cc-editor-body{display:grid;grid-template-columns:minmax(0,1fr);align-content:start;gap:var(--cc-space-field);padding:calc(var(--spacing) * 6);flex:1;overflow-y:auto;min-height:0}.cc-editor-body>h3{font-size:var(--text-base);font-weight:600;margin:0}.cc-editor-body>p{margin:0}.cc-editor-footer{position:static;bottom:0;padding:calc(var(--spacing) * 4) calc(var(--spacing) * 6);border-top:1px solid var(--border);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;background:var(--card);flex-shrink:0}.cc-editor-footer>div{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.cc-editor-confirm{border:1px solid var(--border);padding:15px;background:var(--accent-subtle);border-radius:var(--radius-md);font-size:var(--text-sm)}.cc-editor-confirm p{color:var(--muted);font-size:var(--text-xs);line-height:1.7}.cc-operation-state{display:grid;gap:calc(var(--spacing) * 2);padding:12px;border:1px solid var(--border);border-radius:var(--radius-md);font-size:var(--text-sm);line-height:1.6}.cc-operation-state>p{margin:0}@container editor (max-width: 400px){.cc-editor-header,.cc-editor-body,.cc-editor-footer{padding:calc(var(--spacing) * 4)}}.cc-editor-fields{border:0;padding:0;margin:0;min-width:0;display:grid;gap:var(--cc-space-field)}.cc-time-field{display:grid;gap:calc(var(--spacing) * 1.5);min-width:0}.cc-time-choice{display:grid;gap:var(--spacing);margin:0;font-size:var(--text-xs);color:var(--muted)}.cc-calendar-choices{display:grid;gap:var(--spacing)}.cc-connection-group{display:grid;gap:calc(var(--spacing) * 2)}.cc-connection-group>button{justify-self:start}.cc-connection-group+.cc-connection-group{padding-block-start:calc(var(--spacing) * 3);border-block-start:1px solid var(--border)}.cc-connection-group h4{font-size:var(--text-sm);font-weight:500;margin:0}.cc-settings-content{max-inline-size:800px}.cc-settings-row{display:flex;align-items:center;justify-content:space-between;gap:calc(var(--spacing) * 4)}.cc-settings-row-content{min-inline-size:0;overflow-wrap:anywhere}.cc-settings-row-action{flex-shrink:0}.cc-proposal-toggle{display:flex;gap:calc(var(--spacing) * 3);align-items:center;color:var(--muted);font-size:var(--text-xs)}.cc-proposal-example{max-width:560px}.cc-proposal-example blockquote{margin:0;padding-left:12px;border-left:2px solid var(--border);font-size:var(--text-sm);line-height:1.7}.cc-hook-command{font-size:var(--text-xs);white-space:pre-wrap;overflow-wrap:anywhere;padding:12px;background:var(--accent-subtle);border-radius:var(--radius-md)}';
function Lu() {
  Zc();
  const t = xe(zt()), { name: e } = Ut(), [n, r] = I(""), [o, i] = I(null), a = _t(async () => {
    try {
      const s = Pi(
        await t.current.get(`/api/apps/${e}/settings`)
      );
      return r(s.settings.timezone), i(null), s.settings.timezone;
    } catch {
      throw i(se("timezone.loadError")), new mn(se("timezone.loadError"));
    }
  }, [e]);
  return $e(() => {
    const s = () => {
      a().catch(() => {
      });
    };
    return s(), window.addEventListener("focus", s), () => window.removeEventListener("focus", s);
  }, [a]), n ? /* @__PURE__ */ p(Mu, { timezone: n, refreshTimezone: a }) : /* @__PURE__ */ k("div", { className: "cc-calendar", children: [
    /* @__PURE__ */ p("style", { children: Bc }),
    /* @__PURE__ */ p("p", { role: "status", children: ke(o) || v("common.loadingCalendar") }),
    o && /* @__PURE__ */ p(P, { onClick: () => void a().catch(() => {
    }), children: v("common.checkAgain") })
  ] });
}
function Mu({
  timezone: t,
  refreshTimezone: e
}) {
  var Ca, Da;
  const n = Zc(), r = Io(), o = xe(zt()), { name: i } = Ut(), { openChat: a } = dl(), s = `/api/apps/${i}`, [c, l] = I(() => /* @__PURE__ */ new Date()), [d] = I(() => aa(ci(/* @__PURE__ */ new Date(), t))), [h, f] = I(() => ci(/* @__PURE__ */ new Date(), t)), [g, y] = I("week"), [b, w] = I("calendar"), [x, D] = I(
    () => new URLSearchParams(window.location.search).get("view") === "drafts" ? "proposals" : "calendar"
  ), [E, _] = I(null), [M, N] = I(null), [H, W] = I(), [A, B] = I(null), $ = _t(
    (R, ye = "info") => {
      B(R ? { notice: R, tone: ye } : null);
    },
    []
  ), z = Uc(h, g, d, b), Q = ge(d, z.first), J = ge(d, z.end), { start: he, end: L } = Vd(
    oe(Q),
    oe(J),
    t
  ), {
    records: V,
    events: ae,
    connections: fe,
    recordError: ht,
    eventError: Be,
    connectionError: Ft,
    loading: Me,
    refreshing: ee,
    preferences: te,
    preferencesReady: zn,
    loadRecords: Un,
    loadConnection: qt,
    loadPreferences: Jo,
    changed: bn,
    refresh: j
  } = uu(he, L, e, $);
  $e(() => {
    const R = window.setInterval(() => l(/* @__PURE__ */ new Date()), 6e4);
    return () => window.clearInterval(R);
  }, []);
  const Je = ks(
    () => [
      ...ku(
        V,
        d,
        z,
        t,
        te.showCrew,
        fe
      ),
      ...ae.flatMap((R) => Qc(R, d, z, t))
    ],
    [
      V,
      ae,
      d,
      z.first,
      z.end,
      t,
      te.showCrew,
      fe,
      n
    ]
  ), ei = Math.floor(It(oe(h), d) / 7), Jc = en(c, t), el = {
    day: It(Jc.slice(0, 10), d),
    instant: c.toISOString()
  };
  function mr(R, ye) {
    if (R && !He(R, "edit")) {
      ho(R);
      return;
    }
    if ((!R || R.status === "proposed") && !zn) {
      $(se("editor.destinationLoading"));
      return;
    }
    _({ key: crypto.randomUUID(), item: R, mode: "content", seed: ye });
  }
  function ho(R, ye = !1) {
    _({
      key: crypto.randomUUID(),
      item: R,
      mode: "delivery",
      startImmediately: ye
    });
  }
  function tl(R) {
    f(ci(R.start, t)), D("calendar"), W({
      id: `draft:${R.id}@${It(en(R.start, t).slice(0, 10), d)}`,
      serial: Date.now()
    }), mr(R);
  }
  async function ti(R) {
    var ye;
    R.status === "confirmed" && ((ye = R.destination) == null ? void 0 : ye.connectionId) !== "crew" ? ho(R, !0) : _(null), await bn();
  }
  async function va(R) {
    const ye = ar(
      await o.current.post(`${s}/calendar/items/${R.id}/delete`, {
        revision: R.revision
      })
    );
    N(ye.item), $(se("common.eventDeleted")), _((pe) => (pe == null ? void 0 : pe.key) === (E == null ? void 0 : E.key) ? null : pe), await bn();
  }
  async function wa(R) {
    await o.current.post(`${s}/calendar/items/${R.id}/restore`, {
      revision: R.revision
    }), N(null), $(se("common.eventRestored")), await bn();
  }
  function ba(R) {
    R != null && R.startsWith("dashboard:") && a({ slotKey: R.slice(10) });
  }
  async function nl(R) {
    try {
      await o.current.post(`${s}/calendar/items/${R.id}/dismiss`, {
        revision: R.revision
      }), await Un();
    } catch (ye) {
      $(Ee(ye), "error");
    }
  }
  function rl(R) {
    var Ea, ka;
    const ye = Je.find((fr) => fr.id === R);
    if (!ye) return null;
    const pe = V.find((fr) => fr.id === ye.itemId), mo = (pe == null ? void 0 : pe.origin.sessionKey) || ((ka = (Ea = ye.providerEvent) == null ? void 0 : Ea.origin) == null ? void 0 : ka.sessionKey);
    return /* @__PURE__ */ k("div", { className: "cc-inline-actions", children: [
      (mo == null ? void 0 : mo.startsWith("dashboard:")) && /* @__PURE__ */ p(P, { onClick: () => ba(mo), children: v("common.returnToConversation") }),
      pe && He(pe, "edit") && /* @__PURE__ */ p(P, { onClick: () => mr(pe), children: pe.status === "proposed" ? v("common.reviewAndSave") : v("common.edit") }),
      (pe == null ? void 0 : pe.status) === "confirmed" && pe.destination.connectionId !== "crew" && /* @__PURE__ */ p(P, { onClick: () => ho(pe), children: v("common.externalSaveStatus") }),
      pe && He(pe, "delete") && /* @__PURE__ */ p(
        P,
        {
          danger: !0,
          onClick: () => void va(pe).catch((fr) => $(Ee(fr), "error")),
          children: v("common.delete")
        }
      )
    ] });
  }
  const xa = V.filter((R) => R.status === "proposed" && !R.deletedAt);
  return /* @__PURE__ */ k("div", { className: "cc-calendar", children: [
    /* @__PURE__ */ p("style", { children: Bc }),
    /* @__PURE__ */ p("header", { className: "cc-app-header", children: /* @__PURE__ */ p(
      hl,
      {
        title: /* @__PURE__ */ p("h1", { className: "cc-app-title", children: "Calendar" }),
        subtitle: t,
        actions: /* @__PURE__ */ k(tn, { children: [
          /* @__PURE__ */ p(mt, { children: /* @__PURE__ */ p(
            P,
            {
              "aria-label": v("common.refreshEvents"),
              disabled: ee,
              onClick: () => void j(),
              children: /* @__PURE__ */ p(Ml, { size: 14 })
            }
          ) }),
          /* @__PURE__ */ p(mt, { children: /* @__PURE__ */ k(P, { disabled: !zn, onClick: () => mr(null), children: [
            /* @__PURE__ */ p(Rs, { size: 15 }),
            v("common.addEvent")
          ] }) }),
          /* @__PURE__ */ p(mt, { children: /* @__PURE__ */ p(
            P,
            {
              "aria-label": v("common.calendarSettings"),
              "aria-pressed": x === "settings",
              onClick: () => D(x === "settings" ? "calendar" : "settings"),
              children: /* @__PURE__ */ p(Rl, { size: 16 })
            }
          ) })
        ] })
      }
    ) }),
    /* @__PURE__ */ p("nav", { className: "cc-work-nav", "aria-label": v("navigation.label"), children: /* @__PURE__ */ p(
      Ts,
      {
        ariaLabel: v("navigation.label"),
        layoutId: r,
        collapse: !1,
        value: x,
        onChange: D,
        segments: [
          { key: "calendar", label: v("common.calendar") },
          {
            key: "proposals",
            label: v("navigation.proposals"),
            count: xa.length
          },
          { key: "activity", label: v("navigation.activity") }
        ]
      }
    ) }),
    A && /* @__PURE__ */ k(
      "div",
      {
        className: `cc-feedback ${A.tone === "error" ? "cc-feedback--error" : ""}`,
        role: A.tone === "error" ? "alert" : "status",
        children: [
          A.tone === "error" && /* @__PURE__ */ p(La, { size: 16, "aria-hidden": "true" }),
          ke(A.notice),
          M && /* @__PURE__ */ p(
            P,
            {
              onClick: () => void wa(M).catch((R) => $(Ee(R), "error")),
              children: v("common.undo")
            }
          ),
          /* @__PURE__ */ p(
            P,
            {
              "aria-label": v("common.dismissMessage"),
              onClick: () => $(null),
              children: "×"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ p(
      "div",
      {
        className: "cc-route-panel",
        hidden: x !== "calendar",
        role: "region",
        "aria-label": v("common.calendar"),
        children: /* @__PURE__ */ p(
          nu,
          {
            timezone: t,
            items: Je,
            weekStart: d,
            referenceTime: el,
            view: g,
            layout: b,
            onView: y,
            onLayout: w,
            focusDate: h,
            onFocusDate: f,
            offset: ei,
            jump: H,
            status: Me ? "loading" : "ready",
            onReload: () => void j(),
            onAdd: (R) => mr(null, R),
            eventActions: rl,
            notice: /* @__PURE__ */ p(tn, { children: (ht || Be || Ft) && /* @__PURE__ */ k("div", { className: "cc-feedback cc-feedback--error", role: "alert", children: [
              /* @__PURE__ */ p(La, { size: 16, "aria-hidden": "true" }),
              [ht, Be, Ft].map(ke).filter(Boolean).join(" "),
              /* @__PURE__ */ p(P, { onClick: () => void j(), children: v("common.checkAgain") })
            ] }) })
          }
        )
      }
    ),
    /* @__PURE__ */ k(ml, { title: v("common.settings"), hidden: x !== "settings", children: [
      x === "settings" && /* @__PURE__ */ p(_u, {}),
      zn && /* @__PURE__ */ p(
        yu,
        {
          value: te,
          connections: fe,
          onRefresh: Jo
        }
      ),
      /* @__PURE__ */ p(
        gu,
        {
          connections: fe,
          error: Ft,
          onRefresh: qt
        }
      )
    ] }),
    x === "proposals" && /* @__PURE__ */ p(di, { label: v("navigation.proposals"), children: /* @__PURE__ */ p(
      vu,
      {
        drafts: xa,
        timezone: t,
        error: ht,
        onRefresh: () => void Un(),
        onSelect: tl,
        onDismiss: (R) => void nl(R),
        onOrigin: ba
      }
    ) }),
    x === "activity" && /* @__PURE__ */ k(di, { label: v("navigation.activity"), children: [
      ht && /* @__PURE__ */ p(ct, { children: ke(ht) }),
      /* @__PURE__ */ p(Kr, { title: v("common.externalSaveHistory"), children: /* @__PURE__ */ p("div", { children: V.filter(
        (R) => {
          var ye;
          return R.status === "confirmed" && ((ye = R.destination) == null ? void 0 : ye.connectionId) !== "crew" && !R.deletedAt;
        }
      ).map((R) => /* @__PURE__ */ k("div", { className: "cc-list-row", children: [
        /* @__PURE__ */ p("strong", { children: R.title }),
        /* @__PURE__ */ p(P, { onClick: () => ho(R), children: v("common.saveStatus") })
      ] }, R.id)) }) }),
      /* @__PURE__ */ p(
        Cu,
        {
          items: V.filter((R) => !!R.deletedAt),
          onRestore: wa
        }
      )
    ] }),
    E && (E.item ? E.mode === "delivery" ? /* @__PURE__ */ p(
      Eu,
      {
        connections: fe,
        refreshTimezone: e,
        item: E.item,
        timezone: t,
        startImmediately: E.startImmediately,
        onClose: () => _(null),
        onChanged: bn,
        onEdit: mr,
        onDelete: va
      },
      E.key
    ) : E.item.status === "proposed" ? /* @__PURE__ */ p(
      bu,
      {
        refreshTimezone: e,
        item: E.item,
        date: h,
        timezone: t,
        connections: fe,
        defaultDestination: te.defaultDestination,
        onClose: () => _(null),
        onSaved: ti
      },
      E.key
    ) : /* @__PURE__ */ p(
      xu,
      {
        refreshTimezone: e,
        item: E.item,
        date: h,
        timezone: t,
        connections: fe,
        onClose: () => _(null),
        onSaved: ti
      },
      E.key
    ) : /* @__PURE__ */ p(
      wu,
      {
        refreshTimezone: e,
        date: ((Ca = E.seed) == null ? void 0 : Ca.date) ?? h,
        initialTimes: (Da = E.seed) == null ? void 0 : Da.times,
        timezone: t,
        connections: fe,
        defaultDestination: te.defaultDestination,
        onClose: () => _(null),
        onSaved: ti
      },
      E.key
    ))
  ] });
}
export {
  Lu as default
};
