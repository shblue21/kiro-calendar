import type { CalendarViewItem } from "../../calendar/types";

export type PreviewTask = {
  id: string;
  title: string;
  description: string;
  day: number;
  minute: number;
  status: "scheduled" | "paused" | "cancelled" | "completed";
  automatic: boolean;
  eventId?: string;
  source: string;
  quote: string;
  reason: string;
  repeat?: "none" | "daily" | "weekly";
  /** Run evidence, kept apart from the reservation status. Absent = no record found. */
  run?: "success" | "failed" | "unknown";
  result?: { name: string; title: string; summary: string; bullets: string[] };
};
export type WorkspaceState = { autoOn: boolean; tasks: PreviewTask[] };
export type WorkspaceAction =
  | { type: "save"; task: PreviewTask }
  | { type: "auto"; value: boolean }
  | { type: "pause-auto" }
  | { type: "status"; id: string; status: "scheduled" | "paused" | "cancelled" }
  | { type: "shift"; id: string; minutes: number };

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  if (action.type === "auto") return { ...state, autoOn: action.value };
  if (action.type === "save")
    return {
      ...state,
      tasks: state.tasks.some((t) => t.id === action.task.id)
        ? state.tasks.map((t) => (t.id === action.task.id ? action.task : t))
        : [...state.tasks, action.task],
    };
  return {
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.status === "completed") return task;
      if (action.type === "pause-auto")
        return task.automatic && task.status === "scheduled"
          ? { ...task, status: "paused" }
          : task;
      if (task.id !== action.id) return task;
      if (action.type === "status") return { ...task, status: action.status };
      if (task.status === "cancelled") return task;
      const absolute = task.day * 1440 + task.minute + action.minutes;
      if (!Number.isFinite(absolute)) return task;
      return {
        ...task,
        day: Math.floor(absolute / 1440),
        minute: absolute % 1440,
      };
    }),
  };
}

/**
 * Prep-task line for the event detail. A past reservation or a finished task
 * without run evidence is "not confirmed", never assumed to have succeeded.
 */
export function prepStatus(task: PreviewTask, now: { day: number; minute: number }) {
  if (task.run === "success") return "실행 성공";
  if (task.run === "failed") return "실행 실패";
  if (task.run === "unknown") return "실행 확인 안 됨";
  if (task.status === "paused") return "일시정지";
  if (task.status === "cancelled") return "취소됨";
  const past = task.day * 1440 + task.minute <= now.day * 1440 + now.minute;
  return task.status === "completed" || past ? "실행 확인 안 됨" : "예약됨";
}

export function calendarTasks(
  tasks: readonly PreviewTask[],
  weekOffset = 0,
  range?: { first: number; end: number },
): CalendarViewItem[] {
  return tasks
    .filter((task) => task.status === "scheduled")
    .flatMap((task) => {
      const first = range?.first ?? weekOffset * 7;
      const days =
        task.repeat && task.repeat !== "none"
          ? Array.from({ length: (range?.end ?? first + 7) - first }, (_, i) => first + i).filter(
              (day) =>
                day >= task.day &&
                (task.repeat === "daily" || (day - task.day) % 7 === 0),
            )
          : [task.day];
      return days.map((day) => ({
        id:
          task.repeat && task.repeat !== "none" ? `${task.id}@${day}` : task.id,
        occurrenceKey: JSON.stringify(["preview-task", task.id, task.repeat && task.repeat !== "none" ? day : null]),
        taskId: task.id,
        recurrence:
          task.repeat === "daily"
            ? "매일"
            : task.repeat === "weekly"
              ? "매주 같은 요일"
              : "일회성 예약",
        day,
        kind: "trigger" as const,
        title: task.title,
        start: task.minute,
        status: "scheduled" as const,
        automatic: task.automatic,
        source: task.automatic ? "Crew · 자동 예약" : "Crew · 직접 예약",
        description: task.description,
        related: task.eventId,
      }));
    });
}

export const PREVIEW_TASKS: PreviewTask[] = [
  {
    id: "prep",
    title: "변경 사항 정리",
    description: "이번 릴리스의 주요 변경과 검토할 항목",
    day: 2,
    minute: 600,
    status: "completed",
    automatic: false,
    eventId: "review",
    run: "success",
    source: "출시 리뷰 준비 대화",
    quote: "목요일 출시 리뷰에 필요한 변경 사항을 정리해줘.",
    reason: "사용자가 직접 요청",
    result: {
      name: "release-brief.md",
      title: "출시 리뷰 브리핑",
      summary: "이번 리뷰에서 볼 변경 사항과 확인할 항목을 정리했습니다.",
      bullets: [
        "일정과 Crew 작업을 연결하는 기본 흐름",
        "예약 시각과 실제 실행을 구분하는 표시",
        "출시 전 확인할 키보드 탐색과 작은 화면",
      ],
    },
  },
  {
    id: "ci",
    title: "최신 CI 상태 확인",
    description: "리뷰 시작 전에 최신 테스트 결과를 확인합니다.",
    day: 3,
    minute: 780,
    status: "scheduled",
    automatic: true,
    eventId: "review",
    source: "출시 리뷰 준비 대화",
    quote: "목요일 리뷰 때는 최신 테스트 결과가 필요하겠네.",
    reason: "리뷰 전 최신 상태를 확인하도록 일회성 예약",
  },
  {
    id: "health",
    title: "서비스 재발 여부 확인",
    description: "오늘 확인한 서비스의 오류 로그를 다시 살펴봅니다.",
    day: 3,
    minute: 540,
    status: "scheduled",
    automatic: true,
    source: "오류 원인 확인 대화",
    quote: "오늘은 복구했고, 최근 아침마다 같은 오류가 났어.",
    reason: "다음 날 한 번 재발 여부 확인",
  },
  {
    id: "update",
    title: "외부 자료 업데이트 확인",
    description: "변경 없음 · 원래 대화에 결과를 남겼습니다.",
    day: 2,
    minute: 608,
    status: "completed",
    automatic: true,
    run: "success",
    source: "시장 조사 대화",
    quote: "내일 새 자료가 올라오는지 확인해줘.",
    reason: "새 자료 확인",
    result: {
      name: "update-check.md",
      title: "자료 확인 결과",
      summary: "새로 공개된 자료가 없습니다.",
      bullets: ["샘플 결과이며 실제 웹사이트를 확인하지 않았습니다."],
    },
  },
  {
    id: "agenda",
    title: "워크숍 안건 초안",
    description: "워크숍에서 다룰 안건을 정리합니다.",
    day: 2,
    minute: 480,
    status: "completed",
    automatic: false,
    eventId: "offsite",
    run: "success",
    source: "워크숍 준비 대화",
    quote: "금요일 워크숍 안건 초안을 만들어줘.",
    reason: "사용자가 직접 요청",
    result: {
      name: "workshop-agenda.md",
      title: "워크숍 안건 초안",
      summary: "워크숍에서 다룰 안건 세 가지를 정리했습니다.",
      bullets: ["샘플 결과이며 실제 문서를 생성하지 않았습니다."],
    },
  },
  {
    id: "last-week",
    title: "지난주 진행 정리",
    description: "지난주 완료·지연 항목을 모읍니다.",
    day: 0,
    minute: 540,
    status: "completed",
    automatic: false,
    eventId: "planning",
    run: "failed",
    source: "주간 계획 준비 대화",
    quote: "월요일 계획 전에 지난주 진행을 정리해줘.",
    reason: "사용자가 직접 요청",
  },
  {
    id: "documents",
    title: "제출 서류 목록 확인",
    description: "필요한 서류가 모두 있는지 확인합니다.",
    day: 1,
    minute: 1140,
    status: "scheduled",
    automatic: false,
    eventId: "paperwork",
    source: "세금 신고 대화",
    quote: "화요일 저녁 전에 서류 목록을 확인해줘.",
    reason: "사용자가 직접 요청",
  },
];
