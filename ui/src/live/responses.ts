import { Temporal } from "@js-temporal/polyfill";
import { notice, NoticeError } from "../i18n/notice.ts";
import type {
  CalendarEvent,
  CalendarItem,
  CalendarPreferences,
  Connection,
  DeliveryResponse,
} from "./types.ts";

export type SettingsResponse = {
  settings: {
    suggestionsEnabled: boolean;
    timezone: string;
    sessionKeys: string[];
  };
  hook: {
    status: "ready" | "unconfigured" | "blocked" | "unknown";
    command?: string;
    executionStatus?: string;
  };
  chats: { sessionKey: string; title: string }[];
};

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string";
const optionalText = (value: unknown) => value == null || text(value);
const strings = (value: Record<string, unknown>, ...keys: string[]) =>
  keys.every((key) => text(value[key]));
const array = (value: unknown, entry: (value: unknown) => boolean) =>
  Array.isArray(value) && value.every(entry);
const oneOf = (value: unknown, values: readonly string[]) =>
  typeof value === "string" && values.includes(value);
const revision = (value: unknown) =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

function instant(value: unknown) {
  if (!text(value)) return false;
  try {
    Temporal.Instant.from(value);
    return true;
  } catch {
    return false;
  }
}
function date(value: unknown) {
  if (!text(value)) return false;
  try {
    Temporal.PlainDate.from(value);
    return true;
  } catch {
    return false;
  }
}
function timezone(value: unknown) {
  if (!text(value)) return false;
  try {
    Temporal.Instant.fromEpochMilliseconds(0).toZonedDateTimeISO(value);
    return true;
  } catch {
    return false;
  }
}
const destination = (value: unknown) =>
  object(value) && strings(value, "connectionId", "calendarId");
const connectionName = (value: unknown) =>
  object(value) &&
  ((value.kind === "system" && text(value.key)) ||
    (value.kind === "custom" && text(value.text)));
const confirmation = (value: unknown) =>
  value == null || (object(value) && oneOf(value.mode, ["app", "provider"]));

// Check fields the UI reads or uses to choose an action. Provider metadata stays opaque.
function operation(value: unknown) {
  return (
    object(value) &&
    text(value.id) &&
    oneOf(value.state, [
      "prepared",
      "awaiting_confirmation",
      "confirmed",
      "cancelled",
      "failed",
      "unknown",
    ]) &&
    confirmation(value.confirmation) &&
    (value.connectionName == null || connectionName(value.connectionName)) &&
    optionalText(value.calendarTitle) &&
    optionalText(value.sourceTitle) &&
    optionalText(value.calendarColor) &&
    optionalText(value.provider) &&
    (value.verification == null ||
      (object(value.verification) && text(value.verification.state)))
  );
}
function item(value: unknown) {
  return (
    object(value) &&
    strings(value, "id", "title", "reason") &&
    revision(value.revision) &&
    instant(value.start) &&
    (value.end == null || instant(value.end)) &&
    optionalText(value.notes) &&
    optionalText(value.deletedAt) &&
    oneOf(value.status, ["proposed", "confirmed", "dismissed"]) &&
    oneOf(value.source, ["manual", "proactive", "direct"]) &&
    destination(value.destination) &&
    array(value.actions, text) &&
    object(value.origin) &&
    text(value.origin.sessionKey) &&
    (value.externalRef == null ||
      (destination(value.externalRef) &&
        object(value.externalRef) &&
        text(value.externalRef.eventId))) &&
    (value.delivery == null ||
      operation(value.delivery) ||
      (object(value.delivery) && value.delivery.state === "unavailable"))
  );
}
function event(value: unknown) {
  return (
    object(value) &&
    strings(
      value,
      "eventId",
      "calendarId",
      "title",
      "calendarTitle",
      "sourceTitle",
      "notes",
    ) &&
    instant(value.start) &&
    instant(value.end) &&
    typeof value.allDay === "boolean" &&
    (!value.allDay || (date(value.startDate) && date(value.endDate))) &&
    optionalText(value.itemId) &&
    (value.origin == null || (object(value.origin) && text(value.origin.sessionKey))) &&
    optionalText(value.connectionId) &&
    optionalText(value.calendarColor) &&
    (value.connectionName == null || connectionName(value.connectionName))
  );
}
function connection(value: unknown) {
  return (
    object(value) &&
    strings(value, "id", "provider") &&
    connectionName(value.displayName) &&
    oneOf(value.state, [
      "ready",
      "needs_authorization",
      "denied",
      "unsupported",
      "unavailable",
    ]) &&
    object(value.capabilities) &&
    typeof value.capabilities.read === "boolean" &&
    typeof value.capabilities.create === "boolean" &&
    confirmation(value.confirmation) &&
    array(value.selectedCalendarIds, text) &&
    array(
      value.calendars,
      (cal) =>
        object(cal) &&
        strings(cal, "id", "title", "sourceTitle") &&
        typeof cal.writable === "boolean" &&
        optionalText(cal.color),
    )
  );
}
function checked<T>(value: unknown, valid: boolean): T {
  if (!valid) throw new NoticeError(notice("errors.invalidResponse"));
  return value as T;
}

export function parseSettingsResponse(value: unknown): SettingsResponse {
  return checked(
    value,
    object(value) &&
      object(value.settings) &&
      typeof value.settings.suggestionsEnabled === "boolean" &&
      timezone(value.settings.timezone) &&
      array(value.settings.sessionKeys, text) &&
      object(value.hook) &&
      oneOf(value.hook.status, ["ready", "unconfigured", "blocked", "unknown"]) &&
      optionalText(value.hook.command) &&
      optionalText(value.hook.executionStatus) &&
      array(
        value.chats,
        (chat) => object(chat) && strings(chat, "sessionKey", "title"),
      ),
  );
}
export function parseItemsResponse(value: unknown): {
  items: CalendarItem[];
  errors: unknown[];
} {
  return checked(
    value,
    object(value) && array(value.items, item) && Array.isArray(value.errors),
  );
}
export function parseEventsResponse(value: unknown): {
  events: CalendarEvent[];
  errors: unknown[];
} {
  return checked(
    value,
    object(value) && array(value.events, event) && Array.isArray(value.errors),
  );
}
export function parseConnectionsResponse(value: unknown): {
  connections: Connection[];
} {
  return checked(value, object(value) && array(value.connections, connection));
}
export function parsePreferencesResponse(value: unknown): {
  preferences: CalendarPreferences;
} {
  return checked(
    value,
    object(value) &&
      object(value.preferences) &&
      typeof value.preferences.showCrew === "boolean" &&
      destination(value.preferences.defaultDestination),
  );
}
export function parseItemResponse(value: unknown): { item: CalendarItem } {
  return checked(value, object(value) && item(value.item));
}
export function parseDeliveryResponse(value: unknown): DeliveryResponse {
  return checked(
    value,
    object(value) && item(value.item) && operation(value.operation),
  );
}
