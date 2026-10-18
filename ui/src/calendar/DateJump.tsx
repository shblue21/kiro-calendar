import { Popover } from "../layout/Popover";
import { ChevronDown } from "../platform/kiro/icons";
import { Input } from "@kirocrew/app-sdk/ui";
import { useEffect, useState } from "react";
import { Btn } from "@kirocrew/app-sdk/ui";
import { civilDate, dateKey } from "./dates";
import type { CivilDate } from "./dates";
import { t } from "../i18n/index";
export function DateJump({
  date,
  label,
  onChange,
}: {
  date: CivilDate;
  label: string;
  onChange: (date: CivilDate) => void;
}) {
  const [value, setValue] = useState(dateKey(date));
  useEffect(() => setValue(dateKey(date)), [date]);
  return (
    <Popover
      label={t("calendar.chooseDate")}
      trigger={(props) => (
        <button
          type="button"
          className="cc-date-trigger"
          aria-label={t("calendar.chooseDate")}
          {...props}
        >
          {label}
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      )}
    >
      {(close) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onChange(civilDate(value));
            close();
          }}
        >
          <label className="cc-field">
            {t("calendar.chooseDate")}
            <Input
              type="date"
              min="0001-01-01"
              max="9999-12-31"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <Btn type="submit">{t("calendar.goToDate")}</Btn>
        </form>
      )}
    </Popover>
  );
}
