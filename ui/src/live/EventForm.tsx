import { NativeTextarea } from "../platform/kiro/NativeControls";
import { Input } from "@kirocrew/app-sdk/ui";
import type { EventTimes } from "../calendar/creation";
import { Btn, Badge } from "@kirocrew/app-sdk/ui";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { dateKey } from "../calendar/dates";
import type { CivilDate } from "../calendar/dates.ts";
import {
  editTime,
  resolveTime,
  rezoneTime,
  timeSelection,
} from "../calendar/time";
import { t } from "../i18n/index.ts";
import type { Notice } from "../i18n/notice.ts";
import { notice, NoticeError, renderNotice } from "../i18n/notice.ts";
import { errorNotice } from "./api";
import { TimeField } from "./TimeField";
import type { CalendarItem } from "./types";
export type EventFields = {
  title: string;
  start: string;
  end: string;
  timezone: string;
  notes: string;
};
type Props = {
  item?: CalendarItem;
  initialTimes?: EventTimes;
  date: CivilDate;
  timezone: string;
  refreshTimezone: () => Promise<string>;
  heading: string;
  label: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (fields: EventFields) => Promise<void>;
  children?: ReactNode;
  secondary?: {
    label: string;
    action: (fields: EventFields) => Promise<void>;
  };
  targetChanged?: boolean;
};
/** Shared fields and dialog behavior only; each workflow owns its persistence action. */
export function EventForm({
  item,
  initialTimes,
  date,
  timezone,
  refreshTimezone,
  heading,
  label,
  submitLabel,
  onClose,
  onSubmit,
  children,
  secondary,
  targetChanged = false,
}: Props) {
  const initialFields = () => ({
    title: item?.title || "",
    start: item
      ? timeSelection(item.start, timezone)
      : initialTimes
        ? timeSelection(initialTimes.start, timezone)
        : editTime(`${dateKey(date)}T10:00`, timezone),
    end: item?.end
      ? timeSelection(item.end, timezone)
      : item
        ? timeSelection(
            new Date(+new Date(item.start) + 3600000).toISOString(),
            timezone,
          )
        : initialTimes
          ? timeSelection(initialTimes.end, timezone)
          : editTime(`${dateKey(date)}T11:00`, timezone),
    notes: item?.notes || "",
  });
  const [session, setSession] = useState(() => {
    const initial = initialFields();
    return { zone: timezone, initial, values: initial };
  });
  const rezone = (fields: typeof session.values) => ({
    ...fields,
    start: rezoneTime(fields.start, timezone),
    end: rezoneTime(fields.end, timezone),
  });
  const current =
    session.zone === timezone
      ? session
      : {
          zone: timezone,
          initial: rezone(session.initial),
          values: rezone(session.values),
        };
  if (current !== session) setSession(current);
  const { initial, values } = current;
  const setValues = (update: (fields: typeof values) => typeof values) =>
    setSession((s) => ({ ...s, values: update(s.values) }));
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<Notice | null>(null),
    [leave, setLeave] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const dirty =
    targetChanged || JSON.stringify(values) !== JSON.stringify(initial);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  const close = () => {
    if (busy) return;
    if (dirty) setLeave(true);
    else onClose();
  };
  function set(field: "title" | "notes", value: string) {
    setValues((v) => ({ ...v, [field]: value }));
  }
  async function perform(action: (fields: EventFields) => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const latestZone = await refreshTimezone();
      if (latestZone !== timezone)
        throw new NoticeError(notice("editor.timezoneChanged"));
      const fields = {
        ...values,
        timezone,
        start: resolveTime(values.start, timezone),
        end: resolveTime(values.end, timezone),
      };
      if (
        !fields.title.trim() ||
        Date.parse(fields.end) <= Date.parse(fields.start)
      )
        throw new NoticeError(notice("editor.invalidFields"));
      await action(fields);
    } catch (e) {
      setError(errorNotice(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="cc-editor"
      aria-labelledby="cc-event-editor-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void perform(onSubmit);
        }}
      >
        <header className="cc-editor-header">
          <div>
            <Badge variant="muted">{label}</Badge>
            <h2 id="cc-event-editor-title">{heading}</h2>
          </div>
          <Btn
            disabled={busy}
            type="button"
            aria-label={t("common.closeEditor")}
            onClick={close}
          >
            ×
          </Btn>
        </header>
        <div className="cc-editor-body">
          <fieldset disabled={busy} className="cc-editor-fields">
            <label className="cc-field">
              {t("common.title")}
              <Input
                autoFocus
                required
                maxLength={120}
                value={values.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </label>
            <div className="cc-field-pair">
              <TimeField
                label={t("common.start")}
                value={values.start}
                zone={timezone}
                onChange={(start) => setValues((v) => ({ ...v, start }))}
              />
              <TimeField
                label={t("common.end")}
                value={values.end}
                zone={timezone}
                onChange={(end) => setValues((v) => ({ ...v, end }))}
              />
            </div>
            <p className="cc-page-section-note">
              {t("editor.timezoneHint", { zone: timezone })}
            </p>
            <label className="cc-field">
              {t("common.description")}
              <NativeTextarea
                rows={3}
                maxLength={2000}
                value={values.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </label>
            {children}
          </fieldset>
          {leave && (
            <div className="cc-editor-confirm" role="alert">
              <p>{t("common.discardYourUnsavedChanges")}</p>
              <Btn type="button" onClick={() => setLeave(false)}>
                {t("common.keepEditing")}
              </Btn>
              <Btn type="button" danger onClick={onClose}>
                {t("common.discardAndClose")}
              </Btn>
            </div>
          )}
          {error && (
            <p role="alert" className="cc-form-error">
              {renderNotice(error)}
            </p>
          )}
        </div>
        <footer className="cc-editor-footer">
          <Btn type="button" disabled={busy} onClick={close}>
            {t("common.cancel")}
          </Btn>
          <div>
            {secondary && (
              <Btn
                type="button"
                disabled={busy}
                onClick={() => void perform(secondary.action)}
              >
                {secondary.label}
              </Btn>
            )}
            <Btn primary type="submit" disabled={busy}>
              {busy ? t("common.saving") : submitLabel}
            </Btn>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
