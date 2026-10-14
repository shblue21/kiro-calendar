import { en } from "./en.ts";
import { formatNumber, pluralCategory } from "./format.ts";
import { ko } from "./ko.ts";
import { locale } from "./locale.ts";
export { locale, resolveLocale } from "./locale.ts";
export type { Locale } from "./locale.ts";
type Template<V> = V extends string
  ? V
  : V extends { one: infer One; other: infer Other }
    ? One | Other
    : never;
type Slots<S> = S extends `${string}{${infer Name}}${infer Rest}`
  ? Name | Slots<Rest>
  : never;
type Values<K extends keyof typeof en> = {
  [P in Slots<Template<(typeof en)[K]>>]: P extends "count"
    ? number
    : string | number;
};
export function t<K extends keyof typeof en>(
  key: K,
  ...parameters: [keyof Values<K>] extends [never] ? [] : [Values<K>]
): string {
  const values = (parameters[0] ?? {}) as Record<string, string | number>;
  const message = (locale() === "ko" ? ko : en)[key];
  const text =
    typeof message === "string"
      ? message
      : message[
          pluralCategory(Number(values.count)) === "one" ? "one" : "other"
        ];
  return text.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, name: string) =>
    name === "count" && typeof values[name] === "number"
      ? formatNumber(values[name] as number)
      : String(values[name]),
  );
}
export type MessageKey = keyof typeof en;
export type MessageValues<K extends MessageKey> = Values<K>;
