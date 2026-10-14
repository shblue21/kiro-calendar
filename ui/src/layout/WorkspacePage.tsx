import type { ReactNode } from "react";

type Props = {
  label: string;
  title?: string;
  hidden?: boolean;
  children: ReactNode;
};

/** Full-width document page. Owns its viewport, scrolling and page gutters. */
export function WorkspacePage({
  label,
  title,
  hidden = false,
  children,
}: Props) {
  return (
    <section className="cc-workspace-page" aria-label={label} hidden={hidden}>
      {title && (
        <header className="cc-page-heading">
          <h2>{title}</h2>
        </header>
      )}
      {children}
    </section>
  );
}
