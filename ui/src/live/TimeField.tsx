import type { TimeSelection } from "../calendar/time";
import { editTime, selectedOffset, timeChoices } from "../calendar/time";
import { t } from "../i18n/index.ts";
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
          {t("common.thisTimeOccursTwice")}
          <select
            className="cc-control"
            aria-label={t("time.offsetLabel", { field: label })}
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
            <option value="">{t("common.chooseWhichOccurrence")}</option>
            {choices.map((choice, index) => (
              <option key={choice.offset} value={choice.offset}>
                {t("time.occurrenceOffset", {
                  occurrence: index + 1,
                  offset: choice.offset,
                })}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
