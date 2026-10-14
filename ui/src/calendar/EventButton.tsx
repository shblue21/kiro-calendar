import type { ButtonHTMLAttributes } from "react";
import { useCallback } from "react";

export type RegisterEventButton = (
  id: string,
  button: HTMLButtonElement | null,
) => void;

type Props = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "aria-pressed" | "className"
> & {
  eventId: string;
  registerButton: RegisterEventButton;
  selected: boolean;
  className: string;
};

/** Every calendar view exposes the same selection state and interaction styling. */
export function EventButton({
  eventId,
  registerButton,
  selected,
  className,
  ...props
}: Props) {
  const register = useCallback(
    (button: HTMLButtonElement | null) => registerButton(eventId, button),
    [eventId, registerButton],
  );
  return (
    <button
      {...props}
      ref={register}
      type="button"
      className={`cc-event-button ${className}`}
      aria-pressed={selected}
    />
  );
}
