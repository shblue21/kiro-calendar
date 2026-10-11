import type { CivilDate } from "../calendar/dates.ts";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Btn } from "@kirocrew/app-sdk/ui";
import { editTime, timeSelection, resolveTime, rezoneTime } from "../calendar/time";
import { TimeField } from "./TimeField";
import { dateKey } from "../calendar/dates";
import type { CalendarItem } from "./types";
import { message } from "./api";

export type EventFields = {
  title: string;
  start: string;
  end: string;
  timezone: string;
  notes: string;
};
type Props = {
  item?: CalendarItem;
  date: CivilDate;
  timezone: string;
  refreshTimezone: () => Promise<string>;
  heading: string;
  label: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (fields: EventFields) => Promise<void>;
  children?: ReactNode;
  secondary?: { label: string; action: (fields: EventFields) => Promise<void> };
  targetChanged?: boolean;
};

/** Shared fields and dialog behavior only; each workflow owns its persistence action. */
export function EventForm({
  item,
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
      : editTime(`${dateKey(date)}T10:00`, timezone),
    end: item?.end
      ? timeSelection(item.end, timezone)
      : item
        ? timeSelection(
            new Date(+new Date(item.start) + 3600000).toISOString(),
            timezone,
          )
        : editTime(`${dateKey(date)}T11:00`, timezone),
    notes: item?.notes || "",
  });
  const [session, setSession] = useState(() => {
    const initial = initialFields();
    return { zone: timezone, initial, values: initial };
  });
  const rezone = (fields: typeof session.values) => ({
    ...fields, start: rezoneTime(fields.start, timezone), end: rezoneTime(fields.end, timezone),
  });
  const current = session.zone === timezone ? session : {
    zone: timezone, initial: rezone(session.initial), values: rezone(session.values),
  };
  if (current !== session) setSession(current);
  const { initial, values } = current;
  const setValues = (update: (fields: typeof values) => typeof values) =>
    setSession((s) => ({ ...s, values: update(s.values) }));
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
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
    setError("");
    try {
      const latestZone = await refreshTimezone();
      if (latestZone !== timezone)
        throw new Error("시스템 시간대가 변경되어 입력 시각을 갱신했습니다. 내용을 확인한 뒤 다시 저장하세요.");
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
        throw new Error("제목과 시작·종료 시간을 확인하세요.");
      await action(fields);
    } catch (e) {
      setError(message(e));
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
            <span className="cc-label">{label}</span>
            <h2 id="cc-event-editor-title">{heading}</h2>
          </div>
          <Btn
            disabled={busy}
            type="button"
            aria-label="작성 패널 닫기"
            onClick={close}
          >
            ×
          </Btn>
        </header>
        <div className="cc-editor-body">
          <fieldset disabled={busy} className="cc-editor-fields">
            <label className="cc-field">
              제목
              <input
                className="cc-control"
                autoFocus
                required
                maxLength={120}
                value={values.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </label>
            <div className="cc-field-pair">
              <TimeField
                label="시작"
                value={values.start}
                zone={timezone}
                onChange={(start) => setValues((v) => ({ ...v, start }))}
              />
              <TimeField
                label="종료"
                value={values.end}
                zone={timezone}
                onChange={(end) => setValues((v) => ({ ...v, end }))}
              />
            </div>
            <p className="cc-settings-section-note">
              표시·입력 시간대: {timezone}. 단일 일정만 저장하며 반복·초대는
              추가하지 않습니다.
            </p>
            <label className="cc-field">
              설명
              <textarea
                className="cc-control"
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
              <p>저장하지 않은 변경 내용을 버릴까요?</p>
              <Btn type="button" onClick={() => setLeave(false)}>
                계속 작성
              </Btn>
              <Btn type="button" danger onClick={onClose}>
                버리고 닫기
              </Btn>
            </div>
          )}
          {error && (
            <p role="alert" className="cc-form-error">
              {error}
            </p>
          )}
        </div>
        <footer className="cc-editor-footer">
          <Btn type="button" disabled={busy} onClick={close}>
            취소
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
              {busy ? "저장 중…" : submitLabel}
            </Btn>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
