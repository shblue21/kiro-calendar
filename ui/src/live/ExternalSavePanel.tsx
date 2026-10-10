import { useEffect, useRef, useState } from "react";
import { useAppApi, useAppInfo } from "@kirocrew/app-sdk";
import { Btn } from "@kirocrew/app-sdk/ui";
import type { CalendarItem, Operation } from "./types";
import { localInput } from "./projection";
import { message } from "./api";

/** Only external delivery lives here. Editing and local lifecycle have separate screens. */
export function ExternalSavePanel({
  item,
  timezone,
  startImmediately = false,
  onClose,
  onChanged,
}: {
  item: CalendarItem;
  timezone: string;
  startImmediately?: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const api = useRef(useAppApi()),
    { name } = useAppInfo(),
    base = `/api/apps/${name}/calendar`;
  const dialog = useRef<HTMLDialogElement>(null),
    started = useRef(false);
  const [operation, setOperation] = useState<Operation | null>(
      item.calendarOperation || null,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  async function execute(op: Operation) {
    const result = await api.current.post<{ operation: Operation }>(
      `${base}/operations/${op.id}/execute`,
    );
    setOperation(result.operation);
    await onChanged();
  }
  async function begin() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { operation: op } = await api.current.post<{
        operation: Operation;
      }>(`${base}/operations`, {
        draftId: item.id,
        revision: item.revision,
        target: item.destination,
      });
      setOperation(op);
      if (op.confirmation?.mode === "provider") await execute(op);
    } catch (e) {
      setError(message(e));
      await onChanged();
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (startImmediately && !started.current) {
      started.current = true;
      void begin();
    }
  }, []);
  useEffect(() => {
    if (operation?.state !== "awaiting_confirmation") return;
    let active = true;
    const timer = window.setInterval(() => {
      void api.current
        .get<{ operation: Operation }>(`${base}/operations/${operation.id}`)
        .then(async (body) => {
          if (!active) return;
          setOperation(body.operation);
          if (body.operation.state !== "awaiting_confirmation")
            await onChanged();
        })
        .catch(() => {
          if (active)
            setError(
              "저장 결과를 불러오지 못했습니다. 결과를 다시 확인하세요.",
            );
        });
    }, 1500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [operation?.id, operation?.state]);
  async function confirm() {
    if (!operation) return;
    setBusy(true);
    setError("");
    try {
      await execute(operation);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function reconcile() {
    if (!operation) return;
    setBusy(true);
    setError("");
    try {
      const body = await api.current.post<{ operation: Operation }>(
        `${base}/operations/${operation.id}/reconcile`,
      );
      setOperation(body.operation);
      await onChanged();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const state = operation?.state;
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
        <h3>{item.title}</h3>
        <p>
          {localInput(item.start, timezone)} –{" "}
          {item.end ? localInput(item.end, timezone) : ""}
        </p>
        <p>{item.notes}</p>
        <p>
          {[
            operation?.connectionTitle,
            operation?.sourceTitle,
            operation?.calendarTitle,
          ]
            .filter(Boolean)
            .join(" · ") || "선택한 외부 캘린더"}
        </p>
        <div className="cc-operation-state" role="status">
          {!state && (
            <p>
              선택한 외부 캘린더에 저장할 내용이 보관되어 있습니다. 아직 외부
              저장은 완료되지 않았습니다.
            </p>
          )}
          {state === "prepared" && (
            <p>위 내용을 확인한 뒤 외부 캘린더에 저장하세요.</p>
          )}
          {state === "awaiting_confirmation" && (
            <p>
              {operation?.confirmation?.pendingMessage ||
                "저장 결과를 확인하고 있습니다."}
            </p>
          )}
          {state === "confirmed" && (
            <p>저장 확인됨 · 외부 캘린더에서 다시 조회했습니다.</p>
          )}
          {state === "cancelled" && (
            <p>외부 저장을 취소했습니다. 검토한 내용은 보관되어 있습니다.</p>
          )}
          {state === "failed" && (
            <p>{operation?.error?.message || "외부 저장에 실패했습니다."}</p>
          )}
          {state === "unknown" && (
            <p>
              저장 결과 확인 필요 · 중복 생성을 막기 위해 결과를 먼저
              확인하세요.
            </p>
          )}
          {operation?.verification &&
            operation.verification.state !== "confirmed" && (
              <p role="alert">
                {operation.verification.error?.message ||
                  "원본 일정이 변경되었거나 조회할 수 없습니다."}
              </p>
            )}
        </div>
        {error && (
          <p role="alert" className="cc-form-error">
            {error}
          </p>
        )}
      </div>
      <footer className="cc-editor-footer">
        <Btn disabled={busy} onClick={onClose}>
          닫기
        </Btn>
        <div>
          {(!state || state === "failed" || state === "cancelled") && (
            <Btn primary disabled={busy} onClick={() => void begin()}>
              외부 저장 다시 진행
            </Btn>
          )}
          {state === "prepared" && (
            <Btn primary disabled={busy} onClick={() => void confirm()}>
              {operation?.confirmation?.actionLabel || "이 캘린더에 저장"}
            </Btn>
          )}
          {["awaiting_confirmation", "unknown", "confirmed"].includes(
            state || "",
          ) &&
            operation?.canReconcile !== false && (
              <Btn disabled={busy} onClick={() => void reconcile()}>
                저장 결과 다시 확인
              </Btn>
            )}
        </div>
      </footer>
    </dialog>
  );
}
