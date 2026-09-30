import { useEffect, useState } from "react";
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
import type { PreviewTask } from "../preview/workspace";

const TASK_STATE = {
  scheduled: "예약됨",
  paused: "일시정지",
  cancelled: "취소됨",
  // Sample completed tasks carry a matching run record, so this is run evidence, not "material ready".
  completed: "실행 성공",
};

/**
 * One primary action per event, chosen from the (sample) conversation link.
 * Nothing here opens a real Crew session; the caller reports what would happen.
 */
export function EventActions({
  link,
  tasks,
  weekStart,
  onStart,
  onReturn,
  onRetry,
  onEditTask,
}: {
  link?: EventLink;
  tasks: readonly PreviewTask[];
  weekStart: Date;
  onStart: () => void;
  onReturn: (conversation: string) => void;
  onRetry: () => void;
  onEditTask: (id: string) => void;
}) {
  const result = tasks.find((task) => task.result)?.result;
  const [resultOpen, setResultOpen] = useState(false);
  useEffect(() => setResultOpen(false), [link, result]);
  const conversation =
    link?.state === "origin" || link?.state === "prep" ? link.conversation : undefined;

  let primary;
  if (link?.state === "checking") {
    primary = <p className="cc-link-note" role="status">연결된 대화를 확인하고 있어요.</p>;
  } else if (link?.state === "failed") {
    primary = (
      <>
        <p className="cc-link-note">연결된 대화를 확인하지 못했어요. 대화가 없다는 뜻은 아니에요.</p>
        <Btn primary onClick={onRetry}>
          <RotateCcw size={14} />
          다시 확인
        </Btn>
      </>
    );
  } else if (link?.state === "missing") {
    primary = (
      <>
        <p className="cc-link-note">연결된 대화가 삭제됐거나 열 수 없어요.</p>
        <Btn primary onClick={onStart}>
          <Sparkles size={14} />
          새 대화로 준비하기
        </Btn>
      </>
    );
  } else if (result && conversation) {
    primary = (
      <>
        <Btn primary aria-expanded={resultOpen} onClick={() => setResultOpen((open) => !open)}>
          <FileText size={14} />
          결과 열기
        </Btn>
        <button type="button" className="cc-link-secondary" onClick={() => onReturn(conversation)}>
          {conversation}로 돌아가기
        </button>
      </>
    );
  } else if (link?.state === "origin") {
    primary = (
      <Btn primary onClick={() => onReturn(link.conversation)}>
        <MessageSquare size={14} />
        원래 대화로 돌아가기
      </Btn>
    );
  } else if (link?.state === "prep") {
    primary = (
      <Btn primary onClick={() => onReturn(link.conversation)}>
        <MessageSquare size={14} />
        이어가기
      </Btn>
    );
  } else {
    primary = (
      <Btn primary onClick={onStart}>
        <Sparkles size={14} />
        준비하기
      </Btn>
    );
  }

  const taskRows = tasks.map((task) => {
    const date = shift(weekStart, task.day);
    return (
      <div className="cc-prep-row" key={task.id}>
        <span>준비 작업</span>
        <span>
          {date.getMonth() + 1}월 {date.getDate()}일 {clock(task.minute)} {TASK_STATE[task.status]}
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
      <div className="cc-event-primary">{primary}</div>
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
