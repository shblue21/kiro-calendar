import type { ReactNode } from "react";
import { WorkspacePage } from "../layout/WorkspacePage";

/** Settings own their reading width; WorkspacePage owns scrolling and gutters. */
export function SettingsPage({
  title,
  hidden,
  children,
}: {
  title: string;
  hidden: boolean;
  children: ReactNode;
}) {
  return (
    <WorkspacePage label={title} hidden={hidden}>
      <div className="cc-settings-content">
        <header className="cc-page-heading">
          <h2>{title}</h2>
        </header>
        {children}
      </div>
    </WorkspacePage>
  );
}

export function SettingsRow({
  children,
  action,
}: {
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
