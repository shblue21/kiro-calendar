import {
  CalendarDays,
  Diamond,
  Activity,
  Check,
  AlertCircle,
} from "../platform/kiro/icons";
import type { CalendarViewItem as Item } from "./types";

export const KIND_ICON = {
  event: CalendarDays,
  trigger: Diamond,
  run: Activity,
};

export function TypeMark({ item }: { item: Item }) {
  const Icon =
    item.kind === "run" && item.status === "success"
      ? Check
      : item.kind === "run" && item.status === "failed"
        ? AlertCircle
        : KIND_ICON[item.kind];
  return <Icon size={13} aria-hidden="true" />;
}
