/** Week-relative display model, not a provider API or scheduling contract. */
export type CalendarViewItem = {
  id: string;
  /** Shared by all day fragments of one occurrence; independent of display IDs. */
  occurrenceKey: string;
  day: number;
  title: string;
  /** Elapsed minutes from the actual start of this local date. */
  start: number;
  end?: number;
  /** Human-readable local times, separate from the elapsed-time axis. */
  timeLabels?: { start: string; end: string };
  /** Whole occurrence for details, independent of the visible day fragment. */
  interval: {
    startDate: string;
    endDate: string;
    timeLabels?: { start: string; end: string };
  };
  /** Origin label only. Never a delivery status. */
  source: string;
  calendarLocation?: string;
  calendarColor?: string;
  deliveryState?:
    | import("../live/types").Operation["state"]
    | "unavailable"
    | "unsubmitted";
  description: string;
  allDay?: boolean;
  storage: "draft" | "external" | "local" | "pending";
  itemId?: string;
  providerEvent?: import("../live/types").CalendarEvent;
};

export type CalendarReferenceTime = { day: number; instant: string };
export type CalendarView = "day" | "week" | "month" | "year";
export type CalendarLayout = "calendar" | "list";
