import { useEffect, useState } from "react";
import type { Dispatch } from "react";
import { Badge, Btn } from "@kirocrew/app-sdk/ui";
import {
  Sparkles,
  FileText,
  MessageSquare,
  Clock3,
  ArrowLeft,
} from "../platform/kiro/icons";
import type { CalendarViewItem } from "../calendar/types";
import { shift, DAYS } from "../calendar/dates";
import { clock, timeLabel } from "../calendar/format";
import type { WorkspaceState, WorkspaceAction } from "../preview/workspace";
import { TASK_LABEL } from "./AutoSchedulePage";

export function EventWorkspace({
  event,
  state,
  dispatch,
  weekStart,
  onBack,
}: {
  event: CalendarViewItem;
  state: WorkspaceState;
  dispatch: Dispatch<WorkspaceAction>;
  weekStart: Date;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"work" | "chat" | "results">("work");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const tasks = state.tasks.filter((t) => t.eventId === event.id);
  const result = tasks.find((t) => t.result)?.result;
  const date = shift(weekStart, event.day);
  useEffect(() => {
    setTab("work");
    setDraft("");
    setNotice("");
  }, [event.id]);
  function openChat() {
    setTab("chat");
    setDraft(`${event.title}에 필요한 일을 정리해줘.`);
  }
  return (
    <div className="cc-page-scroll">
      <Btn className="cc-back" onClick={onBack}>
        <ArrowLeft size={14} />
        캘린더로 돌아가기
      </Btn>
      <div className="cc-event-heading">
        <div>
          <div className="cc-scope-chips">
            <span>사람 일정</span>
            <span>{event.source} · 샘플</span>
          </div>
          <h2>{event.title}</h2>
          <p>
            {date.getMonth() + 1}월 {date.getDate()}일 {DAYS[event.day]}요일 ·{" "}
            {timeLabel(event)} · Asia/Seoul
          </p>
        </div>
        <Btn primary onClick={openChat}>
          <Sparkles size={15} />
          Crew와 작업
        </Btn>
      </div>
      <div className="cc-linked-layout">
        <div>
          <div
            className="cc-work-tabs"
            role="tablist"
            aria-label="일정에 연결된 내용"
          >
            {(
              [
                { key: "work", label: "연결된 작업" },
                { key: "chat", label: "대화" },
                { key: "results", label: "결과물" },
              ] as const
            ).map((t) => (
              <Btn
                key={t.key}
                id={`cc-work-tab-${t.key}`}
                role="tab"
                aria-selected={tab === t.key}
                aria-controls={`cc-work-panel-${t.key}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </Btn>
            ))}
          </div>
          <section
            id="cc-work-panel-work"
            role="tabpanel"
            aria-labelledby="cc-work-tab-work"
            hidden={tab !== "work"}
          >
            {tasks.map((task) => (
              <article className="cc-work-card" key={task.id}>
                <div className="cc-section-heading">
                  <h3>{task.title}</h3>
                  <Badge
                    variant={
                      task.status === "completed"
                        ? "ok"
                        : task.status === "scheduled"
                          ? "aim"
                          : "muted"
                    }
                  >
                    {TASK_LABEL[task.status]}
                  </Badge>
                </div>
                <p>{task.description}</p>
                <div className="cc-work-card-foot">
                  <span>
                    {DAYS[task.day]} {clock(task.minute)} ·{" "}
                    {task.automatic ? "자동 예약" : "내가 요청"}
                  </span>
                  {task.result ? (
                    <Btn onClick={() => setTab("results")}>
                      <FileText size={14} />
                      요약 보기
                    </Btn>
                  ) : (
                    <Btn
                      disabled={task.status === "cancelled"}
                      onClick={() => {
                        dispatch({ type: "shift", id: task.id, minutes: 30 });
                        setNotice("샘플 예약을 30분 미뤘습니다.");
                      }}
                    >
                      <Clock3 size={13} />
                      30분 미루기
                    </Btn>
                  )}
                </div>
              </article>
            ))}
            <article className="cc-work-card">
              <div className="cc-section-heading">
                <h3>
                  {tasks.length ? "발표 메모 다듬기" : "이 일정에 필요한 일"}
                </h3>
                <Badge variant="muted">아직 맡기지 않음</Badge>
              </div>
              <p>
                일정 정보를 함께 전달해 Crew와 작업하는 화면을 미리 볼 수
                있습니다.
              </p>
              <div className="cc-work-card-foot">
                <span>선택한 일정 맥락 포함</span>
                <Btn onClick={openChat}>
                  <MessageSquare size={14} />
                  대화 시작
                </Btn>
              </div>
            </article>
          </section>
          <section
            id="cc-work-panel-chat"
            role="tabpanel"
            aria-labelledby="cc-work-tab-chat"
            hidden={tab !== "chat"}
          >
            {result ? (
              <>
                <div className="cc-chat-message">
                  <span>나 · 샘플 대화</span>
                  <p>{tasks[0].quote}</p>
                </div>
                <div className="cc-chat-message">
                  <span>Crew · 샘플 응답</span>
                  <p>{result.summary}</p>
                  <Btn onClick={() => setTab("results")}>
                    <FileText size={14} />
                    {result.name}
                  </Btn>
                </div>
              </>
            ) : (
              <p className="cc-policy">
                이 일정에 연결된 샘플 대화가 없습니다.
              </p>
            )}
            <div className="cc-compose">
              <textarea
                aria-label="Crew에 맡길 일"
                placeholder="이 일정과 관련해 어떤 일을 할까요?"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="cc-work-card-foot">
                <span>{event.title} · 일정 정보 포함</span>
                <Btn
                  primary
                  onClick={() =>
                    setNotice(
                      draft.trim()
                        ? "요청을 입력한 상태의 예시입니다. 실제 Crew에는 전송하지 않았습니다."
                        : "맡길 일을 입력해 주세요.",
                    )
                  }
                >
                  보내기 · 예시
                </Btn>
              </div>
            </div>
          </section>
          <section
            id="cc-work-panel-results"
            role="tabpanel"
            aria-labelledby="cc-work-tab-results"
            hidden={tab !== "results"}
          >
            {result ? (
              <article className="cc-result-document">
                <Badge variant="ok">완료된 작업의 결과</Badge>
                <h3>{result.title}</h3>
                <p className="cc-policy">{result.name} · 샘플 결과물</p>
                <p>{result.summary}</p>
                <ul>
                  {result.bullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="cc-policy">
                  실제 저장소를 분석하거나 문서를 생성한 결과가 아닙니다.
                </p>
              </article>
            ) : (
              <div className="cc-work-card">
                <h3>연결된 결과물이 없습니다</h3>
                <p>관련 작업의 결과가 있으면 여기에서 확인합니다.</p>
              </div>
            )}
          </section>
          {notice && (
            <div className="cc-local-notice" role="status">
              {notice}
            </div>
          )}
        </div>
        <aside className="cc-event-context">
          <h3>일정 정보</h3>
          <dl>
            <dt>내용</dt>
            <dd>{event.description}</dd>
            <dt>원본 캘린더</dt>
            <dd>{event.source} · 샘플</dd>
            <dt>편집</dt>
            <dd>읽기 전용</dd>
            <dt>연결 방식</dt>
            <dd>이 일정에 명시적으로 연결된 작업</dd>
          </dl>
          <div className="cc-local-notice">
            대화와 결과를 일정에서 다시 찾는 구성입니다.
          </div>
        </aside>
      </div>
    </div>
  );
}
