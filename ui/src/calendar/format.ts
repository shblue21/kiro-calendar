import { t } from "../i18n/index.ts";
import type { CalendarViewItem as Item, Kind } from "./types";
export const KIND_LABEL: Record<Kind, string> = {
  get event() {
    return t("common.event");
  },
  get trigger() {
    return t("common.aiSchedule");
  },
  get run() {
    return t("common.run");
  },
};
export const STATUS_LABEL = {
  get running() {
    return t("common.running");
  },
  get success() {
    return t("common.complete");
  },
  get failed() {
    return t("common.failed");
  },
  get scheduled() {
    return t("common.scheduled");
  },
};
export function clock(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
export function timeLabel(item: Item) {
  if (item.allDay) return t("common.allDay");
  if (item.timeLabels) return `${item.timeLabels.start}–${item.timeLabels.end}`;
  if (item.kind === "trigger")
    return clock(item.start) + (item.flexible ? t("common.approximately") : "");
  return `${clock(item.start)}–${item.end == null ? t("common.now") : clock(item.end)}`;
}

export function deliveryLabel(state: Item["deliveryState"]): string {
  switch (state) {
    case "awaiting_confirmation":
      return t("common.awaitingExternalSaveConfirmation");
    case "unknown":
      return t("common.externalSaveNeedsVerification");
    case "unavailable":
      return t("common.externalSaveRecordsNeedRecovery");
    case "failed":
      return t("common.externalSaveFailed");
    case "cancelled":
      return t("common.externalSaveCancelled");
    case "prepared":
    case "unsubmitted":
      return t("common.externalSavePending");
    default:
      return "";
  }
}
export function sourceLabel(item: Item): string {
  return item.kind === "event"
    ? item.calendarLocation || item.source
    : item.source;
}
