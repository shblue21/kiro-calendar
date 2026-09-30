import { useState } from "react";
import type { Dispatch } from "react";
import { Badge, Btn } from "@kirocrew/app-sdk/ui";
import { MessageSquare, Pause, Play, Clock3 } from "../platform/kiro/icons";
import { clock } from "../calendar/format";
import { shift, DAYS } from "../calendar/dates";
import type { WorkspaceState, WorkspaceAction } from "../preview/workspace";

export const TASK_LABEL = {
  scheduled: "예약됨",
  paused: "일시정지",
  cancelled: "취소됨",
  completed: "완료",
};
export function AutoSchedulePage({
  state,
  dispatch,
  weekStart,
  onOpenEvent,
}: {
  state: WorkspaceState;
  dispatch: Dispatch<WorkspaceAction>;
  weekStart: Date;
  onOpenEvent: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const tasks = state.tasks.filter((t) => t.automatic);
  return (
    <div className="cc-page-scroll">
      <div className="cc-auto-banner">
        <div>
          <h2>필요한 다음 일을 알아서 예약</h2>
          <p>
            켜두면 허용한 대화에서 후속 작업을 판단해 등록하는 기능입니다.
            <br />
            현재는 샘플 모드이며, 실제 작업을 생성하거나 실행하지 않습니다.
          </p>
        </div>
        <label className="cc-auto-switch">
          <span>{state.autoOn ? "ON" : "OFF"}</span>
          <input
            type="checkbox"
            role="switch"
            aria-label="자동 예약"
            checked={state.autoOn}
            onChange={(e) =>
              dispatch({ type: "auto", value: e.target.checked })
            }
          />
        </label>
      </div>
      <p className="cc-policy">
        {state.autoOn
          ? "등록할 때마다 확인을 묻지 않는 방식입니다. 예약한 내용은 대화에 알려드립니다."
          : "새 자동 예약을 중단한 상태입니다."}{" "}
        기존 예약은 유지되며, 아래에서 따로 일시정지할 수 있습니다.
      </p>
      <div className="cc-scope-chips">
        <span>선택한 프로젝트 대화</span>
        <span>조회·확인 작업</span>
        <span>일회성 예약</span>
        <span>샘플 설정</span>
      </div>
      <div className="cc-section-heading">
        <h3>자동으로 잡힌 작업</h3>
        <Btn
          disabled={!tasks.some((t) => t.status === "scheduled")}
          onClick={() => {
            dispatch({ type: "pause-auto" });
            setMessage(
              "예정된 자동 예약을 일시정지했습니다. 직접 예약한 작업은 유지됩니다.",
            );
          }}
        >
          <Pause size={14} />
          예정된 자동 예약 일시정지
        </Btn>
      </div>
      {tasks.map((task) => {
        const date = shift(weekStart, task.day);
        return (
          <article className="cc-auto-task" key={task.id}>
            <div className="cc-task-date">
              {date.getMonth() + 1}/{date.getDate()} (
              {DAYS[((task.day % 7) + 7) % 7]})<span>{clock(task.minute)}</span>
            </div>
            <div>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <Btn
                className="cc-provenance"
                onClick={() =>
                  setExpanded(expanded === task.id ? null : task.id)
                }
                aria-expanded={expanded === task.id}
              >
                <MessageSquare size={13} />
                {task.source}
              </Btn>
              {expanded === task.id && (
                <div className="cc-quote">
                  “{task.quote}”<p>생성 이유: {task.reason}</p>
                  {task.result && (
                    <p>
                      <strong>{task.result.title}</strong>
                      <br />
                      {task.result.summary}
                    </p>
                  )}
                  {task.eventId && (
                    <Btn onClick={() => onOpenEvent(task.eventId!)}>
                      연결된 일정 보기
                    </Btn>
                  )}
                </div>
              )}
            </div>
            <div className="cc-task-actions">
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
              {task.status !== "completed" && (
                <>
                  <Btn
                    disabled={task.status === "cancelled"}
                    onClick={() => {
                      dispatch({ type: "shift", id: task.id, minutes: 30 });
                      setMessage(
                        "샘플 예약을 30분 미뤘습니다. 캘린더와 연결된 작업에도 반영됩니다.",
                      );
                    }}
                  >
                    <Clock3 size={12} />
                    30분 미루기
                  </Btn>
                  <Btn
                    onClick={() => {
                      dispatch({
                        type: "status",
                        id: task.id,
                        status:
                          task.status === "scheduled" ? "paused" : "scheduled",
                      });
                      setMessage("샘플 예약 상태를 변경했습니다.");
                    }}
                  >
                    {task.status === "scheduled" ? (
                      <Pause size={12} />
                    ) : (
                      <Play size={12} />
                    )}
                    {task.status === "scheduled" ? "일시정지" : "다시 예약"}
                  </Btn>
                  {task.status !== "cancelled" && (
                    <Btn
                      onClick={() => {
                        dispatch({
                          type: "status",
                          id: task.id,
                          status: "cancelled",
                        });
                        setMessage(
                          "샘플 예약을 취소했습니다. 다른 예약은 유지됩니다.",
                        );
                      }}
                    >
                      취소
                    </Btn>
                  )}
                </>
              )}
            </div>
          </article>
        );
      })}
      {message && (
        <div className="cc-local-notice" role="status">
          {message}
        </div>
      )}
      <p className="cc-policy">
        직접 예약한 작업은 이 목록에 포함되지 않습니다. 자동 예약 설정은 기존
        Crew의 실행 권한을 확대하지 않습니다.
      </p>
    </div>
  );
}
