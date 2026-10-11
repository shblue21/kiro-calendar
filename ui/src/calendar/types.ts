export type Kind = "event" | "trigger" | "run";
/** Week-relative display model, not a provider API or scheduling contract. */
export type CalendarViewItem = {
  id: string;
  /** Shared by all day fragments of one occurrence; independent of display IDs. */
  occurrenceKey: string;
  day: number;
  kind: Kind;
  title: string;
  /** Elapsed minutes from the actual start of this local date. */
  start: number;
  end?: number;
  /** Human-readable local times, separate from the elapsed-time axis. */
  timeLabels?: {start:string;end:string};
  status?: "running" | "success" | "failed" | "scheduled";
  source: string;
  description: string;
  flexible?: boolean;
  automatic?: boolean;
  taskId?: string;
  recurrence?: string;
  artifact?: string;
  related?: string;
  allDay?: boolean;
  storage?: "draft" | "external" | "local" | "pending";
  itemId?: string;
  providerEvent?: import("../live/types").CalendarEvent;
  editable?: boolean;
  artifactPreview?: { title: string; summary: string; bullets: string[] };
};

export type CalendarReferenceTime = { day: number; instant: string };
export type CalendarView = "week" | "month" | "year";
export type CalendarLayout = "calendar" | "list";
export type CalendarLayers = Record<Kind, boolean>;
