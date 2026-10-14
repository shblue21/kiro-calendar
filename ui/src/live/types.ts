export type ConnectionName =
  { kind: "system"; key: string } | { kind: "custom"; text: string };
export type Destination = { connectionId: string; calendarId: string };
export type CalendarPreferences = {
  defaultDestination: Destination;
  showCrew: boolean;
};
export type ItemAction =
  | "edit"
  | "delete"
  | "restore"
  | "accept"
  | "dismiss"
  | "retarget"
  | "submit"
  | "reconcile";
export type CalendarItem = {
  id: string;
  revision: number;
  title: string;
  start: string;
  end?: string | null;
  timezone: string;
  reason: string;
  notes?: string;
  status: "proposed" | "confirmed" | "dismissed";
  destination: Destination;
  deletedAt?: string | null;
  actions: ItemAction[];
  externalRef?: Destination & { eventId: string };
  source: "manual" | "proactive" | "direct";
  origin: { sessionKey: string; identitySource: string };
  returnTarget?: { kind: string; slotKey?: string };
  delivery?: Delivery | null;
};
export type Draft = CalendarItem;
export type Calendar = {
  color?: string;
  id: string;
  title: string;
  sourceId: string;
  sourceTitle: string;
  writable: boolean;
};
export type Confirmation = {
  mode: "provider" | "app";
};
export type Connection = {
  id: string;
  provider: string;
  displayName: ConnectionName;
  state:
    "ready" | "needs_authorization" | "denied" | "unsupported" | "unavailable";
  capabilities: { read: boolean; create: boolean; reconcile: boolean };
  message?: string;
  confirmation?: Confirmation;
  calendars: Calendar[];
  selectedCalendarIds: string[];
  defaultCalendarId: string;
};
export type CalendarEvent = {
  connectionId?: string;
  connectionName?: ConnectionName;
  provider?: string;
  eventId: string;
  calendarId: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  startDate: string;
  endDate: string;
  timezone: string;
  calendarColor?: string;
  calendarTitle: string;
  sourceTitle: string;
  notes: string;
  recurring: boolean;
  itemId?: string;
  origin?: { sessionKey: string };
};
export type Operation = {
  id: string;
  itemId: string;
  itemRevision: number;
  state:
    | "prepared"
    | "awaiting_confirmation"
    | "confirmed"
    | "cancelled"
    | "failed"
    | "unknown";
  canReconcile?: boolean;
  confirmation?: Confirmation;
  connectionName?: ConnectionName;
  provider?: string;
  target: { connectionId: string; calendarId: string };
  calendarColor?: string;
  calendarTitle: string;
  sourceTitle: string;
  payload: {
    title: string;
    start: string;
    end: string;
    timezone: string;
    notes: string;
  };
  event?: CalendarEvent;
  error?: { code: string; message: string };
  verification?: { state: string; error?: { code?: string; message: string } };
};

export type Delivery =
  | Operation
  | { state: "unavailable"; error: { code: string; message: string } };
export type DeliveryResponse = { operation: Operation; item: CalendarItem };
export const can = (item: CalendarItem, action: ItemAction) =>
  item.actions.includes(action);
