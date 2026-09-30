export type Kind = "event" | "trigger" | "run";
/** Week-relative display model, not a provider API or scheduling contract. */
export type CalendarViewItem = {
  id: string;
  day: number;
  kind: Kind;
  title: string;
  start: number;
  end?: number;
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
  artifactPreview?: { title: string; summary: string; bullets: string[] };
};

export type CalendarReferenceTime = { day: number; minute: number };
export type CalendarView = "week" | "month" | "year";
export type CalendarLayout = "calendar" | "list";
export type CalendarLayers = Record<Kind, boolean>;
