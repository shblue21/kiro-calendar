import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type TriggerProps = {
  "aria-expanded": boolean;
  "aria-controls": string;
  onClick: () => void;
};

/** Toolbar popovers share light dismissal and keyboard focus return. */
export function Popover({
  label,
  align = "start",
  trigger,
  children,
}: {
  label: string;
  align?: "start" | "end";
  trigger: (props: TriggerProps) => ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = () => {
    setOpen(false);
    root.current?.querySelector("button")?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape, true);
    };
  }, [open]);
  return (
    <div ref={root} className="cc-popover">
      {trigger({
        "aria-expanded": open,
        "aria-controls": id,
        onClick: () => setOpen((value) => !value),
      })}
      {open && (
        <div
          id={id}
          role="group"
          aria-label={label}
          className={`cc-popover-panel cc-popover-${align}`}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
