import { InlineError } from "../layout/InlineError";
import { itemLocation } from "./location.ts";
import { useAppApi, useAppInfo } from "@kirocrew/app-sdk";
import { Btn, Badge } from "@kirocrew/app-sdk/ui";
import { useEffect, useRef, useState } from "react";
import { selectedOffset, timeSelection, zonedInput } from "../calendar/time";
import { confirmationAction, confirmationPending } from "../i18n/delivery";
import { t } from "../i18n/index.ts";
import { renderNotice } from "../i18n/notice.ts";
import { errorNotice } from "./api.ts";
import { DeliverySession, deliveryState } from "./delivery";
import type { CalendarItem, DeliveryResponse } from "./types";
import { can } from "./types";
export function ExternalSavePanel({
  item,
  timezone,
  connections,
  refreshTimezone,
  startImmediately = false,
  onClose,
  onChanged,
  onEdit,
  onDelete,
}: {
  item: CalendarItem;
  timezone: string;
  connections: import("./types").Connection[];
  refreshTimezone: () => Promise<string>;
  startImmediately?: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onEdit: (item: CalendarItem) => void;
  onDelete: (item: CalendarItem) => Promise<void>;
}) {
  const api = useRef(useAppApi()),
    { name } = useAppInfo();
  const base = `/api/apps/${name}/calendar/items/${item.id}/delivery`;
  const dialog = useRef<HTMLDialogElement>(null),
    started = useRef(false);
  const [{ item: current, busy, checking, error }, setSnapshot] = useState(() =>
    deliveryState(item),
  );
  const [session] = useState(
    () =>
      new DeliverySession(
        item,
        {
          read: async () =>
            (
              await api.current.get<{
                item: CalendarItem;
              }>(`/api/apps/${name}/calendar/items/${item.id}`)
            ).item,
          prepare: async (revision) => {
            await refreshTimezone();
            return api.current.post<DeliveryResponse>(base, { revision });
          },
          execute: (id) => api.current.post<DeliveryResponse>(`${base}/${id}/execute`),
          reconcile: (id) =>
            api.current.post<DeliveryResponse>(`${base}/${id}/reconcile`),
        },
        setSnapshot,
      ),
  );
  const op = current.delivery?.state === "unavailable" ? null : current.delivery;
  const state = current.delivery?.state;
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  async function perform(action: () => Promise<unknown>) {
    const before = session.state.item;
    await action();
    if (JSON.stringify(before) !== JSON.stringify(session.state.item))
      await onChanged();
  }
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      void perform(() => (startImmediately ? session.save() : session.refresh()));
    }
  }, []);
  useEffect(() => {
    if (!checking && state !== "awaiting_confirmation" && state !== "unknown") return;
    const timer = window.setInterval(() => {
      if (!session.state.busy) void perform(() => session.refresh());
    }, 1500);
    return () => window.clearInterval(timer);
  }, [checking, state, session]);
  const label = (instant: string) =>
    `${zonedInput(instant, timezone)} UTC${selectedOffset(timeSelection(instant, timezone), timezone)}`;
  return (
    <dialog
      ref={dialog}
      className="cc-editor"
      aria-labelledby="cc-external-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header className="cc-editor-header">
        <div>
          <Badge variant="muted">{t("common.externalCalendar")}</Badge>
          <h2 id="cc-external-title">{t("common.saveStatus")}</h2>
        </div>
        <Btn disabled={busy} aria-label={t("common.closeSaveStatus")} onClick={onClose}>
          ×
        </Btn>
      </header>
      <div className="cc-editor-body">
        <h3>{current.title}</h3>
        <p>
          {label(current.start)} – {current.end ? label(current.end) : ""}
        </p>
        {current.notes && <p>{current.notes}</p>}
        <p>{itemLocation(current, connections)}</p>
        <div className="cc-operation-state" role="status">
          {!state && <p>{t("delivery.notSubmitted")}</p>}
          {state === "prepared" && <p>{t("delivery.reviewHint")}</p>}
          {state === "awaiting_confirmation" && (
            <p>{confirmationPending(op?.confirmation)}</p>
          )}
          {state === "confirmed" && <p>{t("delivery.confirmed")}</p>}
          {state === "cancelled" && <p>{t("delivery.cancelled")}</p>}
          {state === "failed" && (
            <InlineError>
              {op?.error ? renderNotice(errorNotice(op.error)) : t("delivery.failed")}
            </InlineError>
          )}
          {state === "unknown" && <p>{t("delivery.unknown")}</p>}
          {current.delivery?.state === "unavailable" && (
            <InlineError>
              {renderNotice(errorNotice(current.delivery.error))}
            </InlineError>
          )}
          {op?.verification && op.verification.state !== "confirmed" && (
            <InlineError>
              {op.verification.error
                ? renderNotice(errorNotice(op.verification.error))
                : t("delivery.eventChanged")}
            </InlineError>
          )}
        </div>
        {checking && <p role="status">{t("delivery.checking")}</p>}
        {error && <InlineError>{renderNotice(error)}</InlineError>}
        {!checking && (can(current, "edit") || can(current, "delete")) && (
          <div className="cc-inline-actions">
            {can(current, "edit") && (
              <Btn disabled={busy} onClick={() => onEdit(current)}>
                {t("common.editDetails")}
              </Btn>
            )}
            {can(current, "delete") && (
              <Btn
                danger
                disabled={busy}
                onClick={() => void perform(() => session.run(() => onDelete(current)))}
              >
                {t("common.deleteRequest")}
              </Btn>
            )}
          </div>
        )}
      </div>
      <footer className="cc-editor-footer">
        <Btn disabled={busy} onClick={onClose}>
          {t("common.close")}
        </Btn>
        <div>
          {!checking && can(current, "submit") && (
            <Btn
              primary
              disabled={busy}
              onClick={() => void perform(() => session.save())}
            >
              {op?.state === "prepared"
                ? confirmationAction(op.confirmation, op.provider)
                : t("common.continueExternalSave")}
            </Btn>
          )}
          {(checking || can(current, "reconcile")) && (
            <Btn
              disabled={busy}
              onClick={() =>
                void perform(() => (checking ? session.refresh() : session.reconcile()))
              }
            >
              {checking
                ? t("common.checkCurrentSaveStatus")
                : t("common.verifySaveResult")}
            </Btn>
          )}
        </div>
      </footer>
    </dialog>
  );
}
