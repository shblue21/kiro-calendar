import { useId, type ReactNode } from "react";
import { WorkspacePage } from "../layout/WorkspacePage";

/** Settings own their reading width; WorkspacePage owns scrolling and gutters. */
export function SettingsPage({ title, hidden, children }: {
  title: string;
  hidden: boolean;
  children: ReactNode;
}) {
  return (
    <WorkspacePage label={title} hidden={hidden}>
      <div className="cc-settings-content">
        <header className="cc-page-heading"><h2>{title}</h2></header>
        {children}
      </div>
    </WorkspacePage>
  );
}

/** One heading/action pattern for every top-level settings section. */
export function SettingsSection({ title, actions, description, children }: {
  title: string;
  actions?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className="cc-settings-section" aria-labelledby={id}>
      <header className="cc-settings-section-header">
        <h3 id={id}>{title}</h3>
        {actions && <div className="cc-settings-section-actions">{actions}</div>}
      </header>
      {description && <p className="cc-page-section-note">{description}</p>}
      <div className="cc-settings-section-body">{children}</div>
    </section>
  );
}

export function SettingsRow({ children, action }: {
  children: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="cc-settings-row">
      <div className="cc-settings-row-content">{children}</div>
      <div className="cc-settings-row-action">{action}</div>
    </div>
  );
}
