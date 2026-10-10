export type Draft = {
  id: string; revision: number; title: string; start: string; end?: string | null;
  timezone: string; reason: string; notes?: string; status: 'proposed' | 'dismissed';
  source: 'manual' | 'proactive'; origin: { sessionKey: string; identitySource: string };
  returnTarget?: { kind: string; slotKey?: string }; calendarOperation?: Operation | null;
};
export type Calendar = { id: string; title: string; sourceId: string; sourceTitle: string; writable: boolean };
export type Confirmation = {mode:'provider'|'app'; actionLabel:string; pendingMessage:string};
export type Connection = {
  id: string; provider: string; title: string;
  state: 'ready'|'needs_authorization'|'denied'|'unsupported'|'unavailable';
  capabilities: {read:boolean;create:boolean;reconcile:boolean};
  message?:string; authorizationLabel?:string; confirmation?:Confirmation;
  calendars: Calendar[]; selectedCalendarIds: string[]; defaultCalendarId: string;
};
export type CalendarEvent = {
  connectionId?:string; connectionTitle?:string; provider?:string;
  eventId: string; calendarId: string; title: string; start: string; end: string;
  allDay: boolean; startDate: string; endDate: string; timezone: string;
  calendarTitle: string; sourceTitle: string; notes: string; recurring: boolean;
  draftId?: string; origin?: { sessionKey: string };
};
export type Operation = {
  id: string; draftId: string; draftRevision: number;
  state: 'prepared' | 'awaiting_confirmation' | 'confirmed' | 'cancelled' | 'failed' | 'unknown';
  canReconcile?:boolean; confirmation?:Confirmation; connectionTitle?:string; provider?:string;
  target: { connectionId: string; calendarId: string }; calendarTitle: string; sourceTitle: string;
  payload: { title: string; start: string; end: string; timezone: string; notes: string };
  event?: CalendarEvent; error?: { code: string; message: string };
  verification?: { state: string; error?: { message: string } };
};
