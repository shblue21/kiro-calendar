import type { SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/** The public SDK Input covers inputs; these retain native form semantics for
 * select/textarea and use the same verified host control tokens and focus ring. */
export function NativeSelect(
  props: Omit<SelectHTMLAttributes<HTMLSelectElement>, "className">,
) {
  return <select {...props} className="cc-native-control focus-ring" />;
}
export function NativeTextarea(
  props: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">,
) {
  return <textarea {...props} className="cc-native-control focus-ring" />;
}
