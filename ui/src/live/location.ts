import { connectionName } from "../i18n/delivery.ts";
import { t } from "../i18n/index.ts";
import type {
  Calendar,
  CalendarItem,
  Connection,
  ConnectionName,
} from "./types.ts";
export function locationLabel(
  name: ConnectionName | undefined,
  calendar: Pick<Calendar, "title" | "sourceTitle">,
): string {
  return [
    name ? connectionName(name) : "",
    calendar.sourceTitle,
    calendar.title,
  ]
    .filter(Boolean)
    .join(" · ");
}
/** Destination identity is independent of the current attempt's outcome. */
export function itemLocation(
  item: CalendarItem,
  connections: readonly Connection[],
): string {
  if (item.destination.connectionId === "crew") return "Crew Calendar";
  const connection = connections.find(
    (c) => c.id === item.destination.connectionId,
  );
  const calendar = connection?.calendars.find(
    (c) => c.id === item.destination.calendarId,
  );
  const op = item.delivery?.state === "unavailable" ? undefined : item.delivery;
  const name = connection?.displayName ?? op?.connectionName;
  return locationLabel(
    name,
    calendar ?? {
      title: op?.calendarTitle || t("destination.unavailable"),
      sourceTitle: op?.sourceTitle || "",
    },
  );
}

export function calendarColor(value: string | undefined): string | undefined {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;
}
export function itemColor(
  item: CalendarItem,
  connections: readonly Connection[],
): string | undefined {
  if (item.destination.connectionId === "crew") return undefined;
  const calendar = connections
    .find((c) => c.id === item.destination.connectionId)
    ?.calendars.find((c) => c.id === item.destination.calendarId);
  const op = item.delivery?.state === "unavailable" ? undefined : item.delivery;
  return calendarColor(calendar?.color ?? op?.calendarColor);
}
