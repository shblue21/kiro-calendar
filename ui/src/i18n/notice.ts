import type { MessageKey, MessageValues } from "./index.ts";
import { t } from "./index.ts";
export type Notice =
  | { key: MessageKey; values: Record<string, string | number | Notice> }
  | { messages: Notice[] };
type Values<K extends MessageKey> = {
  [P in keyof MessageValues<K>]: P extends "count"
    ? number
    : MessageValues<K>[P] | Notice;
};
export function notice<K extends MessageKey>(
  key: K,
  ...parameters: [keyof Values<K>] extends [never] ? [] : [Values<K>]
): Notice {
  return {
    key,
    values: (parameters[0] ?? {}) as Record<string, string | number | Notice>,
  };
}
export function renderNotice(value: Notice | null): string {
  if (!value) return "";
  if ("messages" in value) return value.messages.map(renderNotice).join(" ");
  const args = Object.fromEntries(
    Object.entries(value.values).map(([key, value]) => [
      key,
      typeof value === "object" ? renderNotice(value) : value,
    ]),
  );
  return (
    t as (key: MessageKey, args: Record<string, string | number>) => string
  )(value.key, args);
}
export class NoticeError extends Error {
  readonly notice: Notice;
  constructor(value: Notice) {
    super("Calendar operation failed");
    this.notice = value;
  }
}
