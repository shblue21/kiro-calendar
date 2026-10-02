import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Badge, Btn } from "@kirocrew/app-sdk/ui";
import {
  ArrowUpRight,
  FileText,
  MessageSquare,
  RotateCcw,
  Sparkles,
} from "../platform/kiro/icons";
import { clock } from "../calendar/format";
import { shift } from "../calendar/dates";
import type { EventLink } from "../preview/fixtures";
import { prepStatus } from "../preview/workspace";
import type { PreviewTask } from "../preview/workspace";

/**
 * One primary action per event. Result access and conversation access are
 * independent: a result opens even when its conversation cannot.
 * Nothing here opens a real Crew session; the caller reports what would happen.
 */
export function EventActions({
  link,
  tasks,
  weekStart,
  now,
  onStart,
  onReturn,
  onRetry,
  onEditTask,
}: {
  link?: EventLink;
  tasks: readonly PreviewTask[];
  weekStart: Date;
  now: { day: number; minute: number };
  onStart: () => void;
  onReturn: (conversation: string) => void;
  onRetry: () => void;
  onEditTask: (id: string) => void;
}) {
  const result = tasks.find((task) => task.result)?.result;
  const [resultOpen, setResultOpen] = useState(false);
  useEffect(() => setResultOpen(false), [result]);
  const conversation =
    link?.state === "origin" || link?.state === "prep" ? link.conversation : undefined;

  // Conversation action: primary when there is no result, a small link beside "결과 열기" otherwise.
  const secondary = !!result;
  const action = (label: string, onClick: () => void, icon: ReactNode) =>
    secondary ? (
      <button type="button" className="cc-link-secondary" onClick={onClick}>
        {label}
      </button>
    ) : (
      <Btn primary onClick={onClick}>
        {icon}
        {label}
      </Btn>
    );
  let conversationAction;
  let conversationNote;
  if (link?.state === "checking") {
    conversationNote = "연결된 대화를 확인하고 있어요.";
  } else if (link?.state === "failed") {
    conversationNote = "연결된 대화를 확인하지 못했어요. 대화가 없다는 뜻은 아니에요.";
    conversationAction = action("다시 확인", onRetry, <RotateCcw size={14} />);
  } else if (link?.state === "missing") {
    conversationNote = "연결된 대화가 삭제됐거나 열 수 없어요.";
    conversationAction = action("새 대화로 준비하기", onStart, <Sparkles size={14} />);
  } else if (conversation) {
    const label = secondary
      ? `${conversation}로 돌아가기`
      : link?.state === "origin"
        ? "원래 대화로 돌아가기"
        : "이어가기";
    conversationAction = action(label, () => onReturn(conversation), <MessageSquare size={14} />);
  } else {
    conversationAction = action("준비하기", onStart, <Sparkles size={14} />);
  }

  const taskRows = tasks.map((task) => {
    const date = shift(weekStart, task.day);
    return (
      <div className="cc-prep-row" key={task.id}>
        <span>준비 작업</span>
        <span>
          {date.getMonth() + 1}월 {date.getDate()}일 {clock(task.minute)} {prepStatus(task, now)}
        </span>
        {task.status !== "completed" && (
          <button type="button" className="cc-link-secondary" onClick={() => onEditTask(task.id)}>
            편집
          </button>
        )}
      </div>
    );
  });

  return (
    <div className="cc-event-actions">
      {conversation && (
        <p className="cc-link-source">
          {link?.state === "origin" ? `대화에서 제안됨 · ${link.proposedOn}` : "준비 대화"}
          <strong>{conversation}</strong>
          <Badge variant="muted">연결 예시</Badge>
        </p>
      )}
      <div className="cc-event-primary">
        {conversationNote && (
          <p className="cc-link-note" role={link?.state === "checking" ? "status" : undefined}>
            {conversationNote}
          </p>
        )}
        {result && (
          <Btn primary aria-expanded={resultOpen} onClick={() => setResultOpen((open) => !open)}>
            <FileText size={14} />
            결과 열기
          </Btn>
        )}
        {conversationAction}
      </div>
      {resultOpen && result && (
        <div className="cc-result-preview">
          <Badge variant="muted">샘플 결과물 · {result.name}</Badge>
          <h4>{result.title}</h4>
          <p>{result.summary}</p>
          <ul>
            {result.bullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="cc-link-note">
            <ArrowUpRight size={12} /> 실제 결과물 링크는 아직 연결하지 않았습니다.
          </p>
        </div>
      )}
      {tasks.length === 1 && taskRows}
      {tasks.length > 1 && (
        <details className="cc-prep-more">
          <summary>준비 작업 {tasks.length}개</summary>
          {taskRows}
        </details>
      )}
    </div>
  );
}
