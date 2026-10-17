import type { ReactNode } from "react";

type Props = {
  label: string;
  hidden?: boolean;
  children: ReactNode;
};

/** Full-width document page. Owns its viewport, scrolling and page gutters. */
export function WorkspacePage({ label, hidden = false, children }: Props) {
  return (
    <section className="cc-workspace-page" aria-label={label} hidden={hidden}>
      {children}
    </section>
  );
}
