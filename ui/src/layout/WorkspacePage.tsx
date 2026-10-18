import { useId, type ReactNode } from "react";

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

/** Section spacing is shared by settings, saved drafts and history. */
export function Section({
  title,
  actions,
  description,
  children,
}: {
  title: string;
  actions?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className="cc-section" aria-labelledby={id}>
      <header className="cc-section-header">
        <h3 id={id}>{title}</h3>
        {actions && <div className="cc-section-actions">{actions}</div>}
      </header>
      <div className="cc-section-body">
        {description && <p className="cc-page-section-note">{description}</p>}
        {children}
      </div>
    </section>
  );
}

export function Disclosure({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="cc-disclosure">
      <summary>{title}</summary>
      <div className="cc-disclosure-body">{children}</div>
    </details>
  );
}
