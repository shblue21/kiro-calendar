import { editTime, selectedOffset, timeChoices } from "../calendar/time";
import type { TimeSelection } from "../calendar/time";

export function TimeField({
  label,
  value,
  zone,
  onChange,
}: {
  label: string;
  value: TimeSelection;
  zone: string;
  onChange: (value: TimeSelection) => void;
}) {
  const choices = timeChoices(value.wall, zone);
  return (
    <div className="cc-field">
      <label>
        {label}
        <input
          className="cc-control"
          type="datetime-local"
          required
          value={value.wall}
          onChange={(e) => onChange(editTime(e.target.value, zone))}
        />
      </label>
      {choices.length > 1 && (
        <label className="cc-time-choice">
          이 시각은 두 번 발생합니다.
          <select
            className="cc-control"
            aria-label={`${label} UTC 오프셋`}
            required
            value={selectedOffset(value, zone)}
            onChange={(e) =>
              onChange({
                ...value,
                instant:
                  choices.find((choice) => choice.offset === e.target.value)
                    ?.instant || null,
              })
            }
          >
            <option value="">어느 시각인지 선택하세요</option>
            {choices.map((choice, index) => (
              <option key={choice.offset} value={choice.offset}>
                {index + 1}번째 · UTC{choice.offset}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
