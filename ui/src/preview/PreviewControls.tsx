import { Btn } from "@kirocrew/app-sdk/ui";
import { AlertCircle, RotateCcw } from "../platform/kiro/icons";

export type PreviewScene = "sample" | "empty" | "partial" | "loading" | "error";
export function PreviewControls({
  scene,
  onChange,
}: {
  scene: PreviewScene;
  onChange: (scene: PreviewScene) => void;
}) {
  return (
    <div className="cc-scenarios" aria-label="샘플 화면 상태">
      {(
        [
          { id: "sample", label: "일정 있는 화면" },
          { id: "empty", label: "처음 시작" },
          { id: "partial", label: "일부 연결 오류" },
          { id: "loading", label: "불러오는 중" },
          { id: "error", label: "불러오기 실패" },
        ] as const
      ).map((option) => (
        <Btn
          key={option.id}
          aria-pressed={scene === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </Btn>
      ))}
    </div>
  );
}
export function PreviewNotice({ onRecover }: { onRecover: () => void }) {
  return (
    <div className="cc-notice" role="status">
      <AlertCircle size={16} />
      <div>
        <strong>업무 캘린더를 새로고침하지 못했습니다.</strong>
        <span>
          마지막 확인 11:15 · 표시된 일정은 이전 데이터입니다. AI 예약은 계속
          확인할 수 있습니다.
        </span>
      </div>
      <Btn onClick={onRecover}>
        <RotateCcw size={13} />
        샘플 복구
      </Btn>
    </div>
  );
}
