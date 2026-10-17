import { t } from "../i18n/index.ts";
import type { CalendarViewItem as Item } from "./types";
export function clock(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
export function timeLabel(item: Item) {
  if (item.allDay) return t("common.allDay");
  if (item.timeLabels) return `${item.timeLabels.start}–${item.timeLabels.end}`;
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
  return item.calendarLocation || item.source;
}
