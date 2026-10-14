import type { MessageKey } from "../i18n/index.ts";
import type { Notice } from "../i18n/notice.ts";
import { notice, NoticeError } from "../i18n/notice.ts";
const errorKeys = {
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
  item_unavailable: "errors.itemUnavailable",
} as const satisfies Record<string, MessageKey>;
function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}
/** Host AppApiError carries status and a JSON body. Never translate by matching prose. */
export function errorNotice(error: unknown): Notice {
  if (error instanceof NoticeError) return error.notice;
  let data = object(error);
  const status = data?.status;
  if (typeof data?.body === "string") {
    try {
      data = object(JSON.parse(data.body));
    } catch {
      data = undefined;
    }
  }
  if (data?.code === "events_truncated") {
    return typeof data.limit === "number" &&
      Number.isSafeInteger(data.limit) &&
      data.limit > 0
      ? notice("errors.eventsTruncated", { count: data.limit })
      : notice("errors.eventsIncomplete");
  }
  const code = typeof data?.code === "string" ? data.code : "";
  if (Object.hasOwn(errorKeys, code))
    return notice(errorKeys[code as keyof typeof errorKeys]);
  if (status === 401 || status === 403) return notice("errors.ownerRequired");
  if (status === 503) return notice("errors.storageUnavailable");
  return notice("errors.requestFailed");
}
export function collectionNotice(errors: readonly unknown[]): Notice | null {
  if (!errors.length) return null;
  return {
    messages: errors.map((error) => {
      const data = object(error);
      return typeof data?.itemId === "string"
        ? notice("errors.recordUnavailable", { id: data.itemId })
        : errorNotice(error);
    }),
  };
}
