import type { ReactNode } from "react";

export function InlineError({ children }: { children: ReactNode }) {
  return (
    <p className="cc-inline-error" role="alert">
      {children}
    </p>
  );
}
