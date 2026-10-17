import type { ReactElement, ReactNode } from "react";

/** Outer control geometry is shared; SDK controls own their visual styling. */
export function ControlCell({ children }: { children: ReactElement }) {
  return <div className="cc-control-cell">{children}</div>;
}

/** A flexible field and its action stay on the same row without competing for width. */
export function ControlRow({
  field,
  action,
  meta,
  fieldMaxWidth,
}: {
  field: ReactElement;
  action: ReactElement;
  meta?: ReactNode;
  fieldMaxWidth?: number;
}) {
  return (
    <div className="cc-control-row">
      <div
        className="cc-control-field"
        style={{ maxInlineSize: fieldMaxWidth }}
      >
        <ControlCell>{field}</ControlCell>
      </div>
      {meta != null && <span className="cc-control-meta">{meta}</span>}
      <ControlCell>{action}</ControlCell>
    </div>
  );
}
