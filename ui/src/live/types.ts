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
  id: string;
  title: string;
  sourceId: string;
  sourceTitle: string;
  writable: boolean;
};
export type Confirmation = {
  mode: "provider" | "app";
  actionLabel: string;
  pendingMessage: string;
};
export type Connection = {
  id: string;
  provider: string;
  title: string;
  state:
    | "ready"
    | "needs_authorization"
    | "denied"
    | "unsupported"
    | "unavailable";
  capabilities: { read: boolean; create: boolean; reconcile: boolean };
  message?: string;
  authorizationLabel?: string;
  confirmation?: Confirmation;
  calendars: Calendar[];
  selectedCalendarIds: string[];
  defaultCalendarId: string;
};
export type CalendarEvent = {
  connectionId?: string;
  connectionTitle?: string;
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
  connectionTitle?: string;
  provider?: string;
  target: { connectionId: string; calendarId: string };
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
  verification?: { state: string; error?: { message: string } };
};

export type Delivery =
  | Operation
  | { state: "unavailable"; error: { code: string; message: string } };
export type DeliveryResponse = { operation: Operation; item: CalendarItem };
export const can = (item: CalendarItem, action: ItemAction) =>
  item.actions.includes(action);
