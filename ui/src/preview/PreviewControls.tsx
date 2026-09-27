import { useState } from "react";
import { Btn } from "@kirocrew/app-sdk/ui";
import { AlertCircle, FlaskConical, RotateCcw } from "../platform/kiro/icons";

export type PreviewScene = "sample" | "empty" | "partial";
export function PreviewControls({
  scene,
  onChange,
}: {
  scene: PreviewScene;
  onChange: (scene: PreviewScene) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="cc-preview-control">
      <Btn
        className="cc-sample-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <FlaskConical size={13} />
        샘플 데이터 · 연결 없음
      </Btn>
      {open && (
        <div className="cc-scenarios" aria-label="샘플 화면 상태">
          <span>화면 상태 미리보기</span>
          {(
            [
              { id: "sample", label: "일정 있는 화면" },
              { id: "empty", label: "처음 시작" },
              { id: "partial", label: "일부 연결 오류" },
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
      )}
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
