import { DeliverySession, deliveryState } from "./delivery";
import { useEffect, useRef, useState } from "react";
import { useAppApi, useAppInfo } from "@kirocrew/app-sdk";
import { Btn } from "@kirocrew/app-sdk/ui";
import { can } from "./types";
import type { CalendarItem, DeliveryResponse } from "./types";
import { timeSelection, selectedOffset, zonedInput } from "../calendar/time";

export function ExternalSavePanel({
  item,
  timezone,
  refreshTimezone,
  startImmediately = false,
  onClose,
  onChanged,
  onEdit,
  onDelete,
}: {
  item: CalendarItem;
  timezone: string;
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
  const [{item:current,busy,checking,error},setSnapshot] = useState(() => deliveryState(item));
  const [session] = useState(() => new DeliverySession(item, {
    read: async () => (await api.current.get<{item:CalendarItem}>(`/api/apps/${name}/calendar/items/${item.id}`)).item,
    prepare: async (revision) => {
      await refreshTimezone();
      return api.current.post<DeliveryResponse>(base,{revision});
    },
    execute: (id) => api.current.post<DeliveryResponse>(`${base}/${id}/execute`),
    reconcile: (id) => api.current.post<DeliveryResponse>(`${base}/${id}/reconcile`),
  },setSnapshot));
  const op = current.delivery?.state === "unavailable" ? null : current.delivery;
  const state = current.delivery?.state;
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  async function perform(action:()=>Promise<unknown>) {
    const before=session.state.item;
    await action();
    if(JSON.stringify(before)!==JSON.stringify(session.state.item))await onChanged();
  }
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      void perform(() => startImmediately ? session.save() : session.refresh());
    }
  }, []);
  useEffect(() => {
    if (!checking && state !== "awaiting_confirmation" && state !== "unknown") return;
    const timer=window.setInterval(()=>{
      if(!session.state.busy)void perform(()=>session.refresh());
    },1500);
    return ()=>window.clearInterval(timer);
  },[checking,state,session]);
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
          <span className="cc-label">외부 캘린더</span>
          <h2 id="cc-external-title">저장 상태</h2>
        </div>
        <Btn disabled={busy} aria-label="저장 상태 닫기" onClick={onClose}>
          ×
        </Btn>
      </header>
      <div className="cc-editor-body">
        <h3>{current.title}</h3>
        <p>
          {label(current.start)} – {current.end ? label(current.end) : ""}
        </p>
        <p>{current.notes}</p>
        <p>
          {[op?.connectionTitle, op?.sourceTitle, op?.calendarTitle]
            .filter(Boolean)
            .join(" · ") || "선택한 외부 캘린더"}
        </p>
        <div className="cc-operation-state" role="status">
          {!state && (
            <p>
              아직 외부에 저장되지 않았습니다. 내용을 수정하거나 저장 요청을
              삭제할 수 있습니다.
            </p>
          )}
          {state === "prepared" && (
            <p>
              위 내용을 확인한 뒤 저장하세요. 수정하거나 요청을 삭제할 수도
              있습니다.
            </p>
          )}
          {state === "awaiting_confirmation" && (
            <p>
              {op?.confirmation?.pendingMessage ||
                "저장 결과를 확인하고 있습니다."}
            </p>
          )}
          {state === "confirmed" && (
            <p>저장 확인됨 · 외부 캘린더에서 다시 조회했습니다.</p>
          )}
          {state === "cancelled" && (
            <p>
              외부 저장을 취소했습니다. 내용을 수정하거나 요청을 삭제할 수
              있습니다.
            </p>
          )}
          {state === "failed" && (
            <p>
              {op?.error?.message ||
                "외부에 저장하지 못했습니다. 내용을 수정하거나 요청을 삭제할 수 있습니다."}
            </p>
          )}
          {state === "unknown" && (
            <p>
              저장 결과 확인 필요 · 중복 생성을 막기 위해 결과를 먼저
              확인하세요.
            </p>
          )}
          {current.delivery?.state === "unavailable" && (
            <p role="alert">{current.delivery.error.message}</p>
          )}
          {op?.verification && op.verification.state !== "confirmed" && (
            <p role="alert">
              {op.verification.error?.message ||
                "원본 일정이 변경되었거나 조회할 수 없습니다."}
            </p>
          )}
        </div>
        {checking && <p role="status">기존 저장 요청의 현재 상태를 확인하고 있습니다.</p>}
        {error && (
          <p role="alert" className="cc-form-error">
            {error}
          </p>
        )}
        <div className="cc-inline-actions">
          {!checking && can(current, "edit") && (
            <Btn disabled={busy} onClick={() => onEdit(current)}>
              내용 수정
            </Btn>
          )}
          {!checking && can(current, "delete") && (
            <Btn
              danger
              disabled={busy}
              onClick={() => void perform(() => session.run(() => onDelete(current)))}
            >
              요청 삭제
            </Btn>
          )}
        </div>
      </div>
      <footer className="cc-editor-footer">
        <Btn disabled={busy} onClick={onClose}>
          닫기
        </Btn>
        <div>
          {!checking && can(current, "submit") && (
            <Btn primary disabled={busy} onClick={() => void perform(()=>session.save())}>
              {op?.state === "prepared" ? op.confirmation?.actionLabel || "이 캘린더에 저장" : "외부 저장 진행"}
            </Btn>
          )}
          {(checking || can(current, "reconcile")) && (
            <Btn disabled={busy} onClick={()=>void perform(()=>checking ? session.refresh() : session.reconcile())}>
              {checking ? "현재 저장 상태 확인" : "저장 결과 다시 확인"}
            </Btn>
          )}
        </div>
      </footer>
    </dialog>
  );
}
