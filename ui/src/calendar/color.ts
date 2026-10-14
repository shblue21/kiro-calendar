import type { CSSProperties } from "react";
export function calendarStyle(color?: string): CSSProperties {
  return {
    "--cc-calendar-color": color ?? "var(--accent)",
  } as CSSProperties;
}
