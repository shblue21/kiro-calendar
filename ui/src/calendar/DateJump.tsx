import { Input } from "@kirocrew/app-sdk/ui";
import { useEffect, useRef, useState } from "react";
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
  const ref = useRef<HTMLDetailsElement>(null);
  const [value, setValue] = useState(dateKey(date));
  useEffect(() => setValue(dateKey(date)), [date]);
  return (
    <details
      className="cc-date-jump"
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          ref.current?.removeAttribute("open");
          ref.current?.querySelector("summary")?.focus();
          e.stopPropagation();
        }
      }}
    >
      <summary aria-label={t("calendar.chooseDate")}>{label}</summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onChange(civilDate(value));
          ref.current?.removeAttribute("open");
          ref.current?.querySelector("summary")?.focus();
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
    </details>
  );
}
