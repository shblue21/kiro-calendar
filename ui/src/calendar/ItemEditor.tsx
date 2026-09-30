import { useEffect, useRef, useState } from "react";
import { Badge, Btn } from "@kirocrew/app-sdk/ui";
import { X, CalendarDays, Sparkles, Trash2 } from "../platform/kiro/icons";
import { validateDraft } from "./editor";
import type { EditorDraft } from "./editor";
import type { CalendarViewItem } from "./types";

export type EditorSession = {
  key: string;
  kind: "event" | "task";
  id?: string;
  draft: EditorDraft;
};
export function ItemEditor({
  session,
  weekStart,
  events,
  onSave,
  onClose,
  onDelete,
}: {
  session: EditorSession;
  weekStart: Date;
  events: CalendarViewItem[];
  onSave: (draft: EditorDraft) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(session.draft);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<"leave" | "delete" | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(session.draft);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  function close() {
    if (dirty) setConfirm("leave");
    else onClose();
  }
  function field<K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }
  return (
    <dialog
      className="cc-editor"
      ref={dialog}
      aria-labelledby="cc-editor-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const message = validateDraft(draft, session.kind, weekStart);
          if (message) {
            setError(message);
            return;
          }
          onSave(draft);
        }}
      >
        <header className="cc-editor-header">
          <div>
            <Badge variant="muted">샘플 · 실제 저장/실행 없음</Badge>
            <h2 id="cc-editor-title">
              {session.kind === "event" ? (
                <CalendarDays size={19} />
              ) : (
                <Sparkles size={19} />
              )}{" "}
              {session.kind === "event" ? "내 일정" : "Crew 작업 예약"}{" "}
              {session.id ? "편집" : "추가"}
            </h2>
          </div>
          <Btn type="button" aria-label="작성 패널 닫기" onClick={close}>
            <X size={18} />
          </Btn>
        </header>
        <div className="cc-editor-body">
          <label className="cc-field">
            {session.kind === "event" ? "일정 제목" : "작업 이름"}
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => field("title", e.target.value)}
              maxLength={160}
              placeholder={
                session.kind === "event"
                  ? "예: 고객 미팅"
                  : "예: 서비스 오류 로그 확인"
              }
            />
          </label>
          <label className="cc-field">
            날짜
            <input
              type="date"
                onInput={e=>field("date",e.currentTarget.value)}
              value={draft.date}
              onChange={(e) => field("date", e.target.value)}
            />
          </label>
          {session.kind === "event" && (
            <label className="cc-checkbox">
              <input
                type="checkbox"
                checked={draft.allDay}
                onChange={(e) => field("allDay", e.target.checked)}
              />
              종일 일정
            </label>
          )}
          {(!draft.allDay || session.kind === "task") && (
            <div className="cc-field-pair">
              <label className="cc-field">
                {session.kind === "task" ? "실행 시각" : "시작"}
                <input
                  type="time"
                  onInput={e=>field("start",e.currentTarget.value)}
                  value={draft.start}
                  onChange={(e) => field("start", e.target.value)}
                />
              </label>
              {session.kind === "event" && (
                <label className="cc-field">
                  종료
                  <input
                    type="time"
                    onInput={e=>field("end",e.currentTarget.value)}
                  value={draft.end}
                    onChange={(e) => field("end", e.target.value)}
                  />
                </label>
              )}
            </div>
          )}
          {session.kind === "event" ? (
            <label className="cc-field">
              캘린더
              <select
                value={draft.source}
                onChange={(e) => field("source", e.target.value)}
              >
                <option>개인 일정</option>
                <option>Google · 업무 일정</option>
                <option>업무 캘린더</option>
              </select>
              <small>
                출처 선택도 샘플입니다. 외부 캘린더에는 기록하지 않습니다.
              </small>
            </label>
          ) : (
            <>
              <label className="cc-field">
                반복
                <select
                  value={draft.repeat}
                  onChange={(e) =>
                    field("repeat", e.target.value as EditorDraft["repeat"])
                  }
                >
                  <option value="none">반복 안 함</option>
                  <option value="daily">매일</option>
                  <option value="weekly">매주 같은 요일</option>
                </select>
                <small>반복 편집은 예약 전체에 적용됩니다.</small>
              </label>
              <label className="cc-field">
                관련 일정
                <select
                  value={draft.eventId}
                  onChange={(e) => field("eventId", e.target.value)}
                >
                  <option value="">연결하지 않음</option>
                  {events.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="cc-field">
            {session.kind === "task" ? "수행할 일" : "설명"}
            <textarea
              rows={4}
              value={draft.description}
              onChange={(e) => field("description", e.target.value)}
              placeholder={
                session.kind === "task"
                  ? "무엇을 확인하거나 만들어야 하나요?"
                  : "일정에 필요한 내용을 적어주세요."
              }
            />
          </label>
          {error && (
            <p className="cc-form-error" role="alert">
              {error}
            </p>
          )}
          {confirm && (
            <div className="cc-editor-confirm" role="alert">
              <strong>
                {confirm === "delete"
                  ? "샘플 항목을 삭제할까요?"
                  : "입력한 내용을 버리고 닫을까요?"}
              </strong>
              <p>
                {confirm === "delete"
                  ? "연결된 다른 작업은 삭제하지 않습니다. 삭제 후 되돌릴 수 있습니다."
                  : "계속 작성하면 입력 내용이 유지됩니다."}
              </p>
              <div className="cc-work-card-foot">
                <Btn type="button" onClick={() => setConfirm(null)}>
                  계속 작성
                </Btn>
                <Btn
                  type="button"
                  danger
                  onClick={() =>
                    confirm === "delete" ? onDelete?.() : onClose()
                  }
                >
                  {confirm === "delete" ? "삭제" : "버리고 닫기"}
                </Btn>
              </div>
            </div>
          )}
        </div>
        <footer className="cc-editor-footer">
          {onDelete ? (
            <Btn type="button" danger onClick={() => setConfirm("delete")}>
              <Trash2 size={14} />
              삭제
            </Btn>
          ) : (
            <span />
          )}
          <div>
            <Btn type="button" onClick={close}>
              취소
            </Btn>
            <Btn primary type="submit">
              {session.id ? "변경 저장" : "추가"} · 샘플
            </Btn>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
