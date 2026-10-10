import type { Connection, Destination } from "./types";
export const CREW_DESTINATION: Destination = {
  connectionId: "crew",
  calendarId: "default",
};
export const destinationKey = (target: Destination) =>
  JSON.stringify([target.connectionId, target.calendarId]);

export function DestinationSelect({
  connections,
  value,
  onChange,
  disabled = false,
  label = "저장할 캘린더",
}: {
  connections: Connection[];
  value: Destination;
  onChange: (target: Destination) => void;
  disabled?: boolean;
  label?: string;
}) {
  const choices = [
    { target: CREW_DESTINATION, label: "Crew Calendar" },
    ...connections
      .filter((c) => c.state === "ready" && c.capabilities.create)
      .flatMap((c) =>
        c.calendars
          .filter((cal) => cal.writable)
          .map((cal) => ({
            target: { connectionId: c.id, calendarId: cal.id },
            label: `${c.title} · ${cal.sourceTitle} · ${cal.title}`,
          })),
      ),
  ];
  const available = choices.some(
    (c) => destinationKey(c.target) === destinationKey(value),
  );
  return (
    <label className="cc-field">
      {label}
      <select
        className="cc-control"
        disabled={disabled}
        value={destinationKey(value)}
        onChange={(e) => {
          const [connectionId, calendarId] = JSON.parse(e.target.value);
          onChange({ connectionId, calendarId });
        }}
      >
        {!available && (
          <option value={destinationKey(value)} disabled>
            기존 저장 위치에 접근할 수 없습니다. 다른 캘린더를 선택하세요.
          </option>
        )}
        {choices.map((c) => (
          <option
            key={destinationKey(c.target)}
            value={destinationKey(c.target)}
          >
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}
