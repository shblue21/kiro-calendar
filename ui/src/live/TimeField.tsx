import { NativeSelect } from "../platform/kiro/NativeControls";
import { Input } from "@kirocrew/app-sdk/ui";
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
    <div className="cc-time-field">
      <label className="cc-field">
        {label}
        <Input
          type="datetime-local"
          required
          value={value.wall}
          onChange={(e) => onChange(editTime(e.target.value, zone))}
        />
      </label>
      {choices.length > 1 && (
        <label className="cc-time-choice">
          {t("common.thisTimeOccursTwice")}
          <NativeSelect
            aria-label={t("time.offsetLabel", { field: label })}
            required
            value={selectedOffset(value, zone)}
            onChange={(e) =>
              onChange({
                ...value,
                instant:
                  choices.find((choice) => choice.offset === e.target.value)?.instant ||
                  null,
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
          </NativeSelect>
        </label>
      )}
    </div>
  );
}
