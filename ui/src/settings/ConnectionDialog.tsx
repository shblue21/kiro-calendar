import { useEffect, useRef, useState } from "react";
import { Badge, Btn } from "@kirocrew/app-sdk/ui";
import { X, Plug, ArrowLeft, Check } from "../platform/kiro/icons";
export type PreviewConnection = {
  id: string;
  provider: string;
  calendars: string[];
};
export function ConnectionDialog({
  onClose,
  onConnect,
}: {
  onClose: () => void;
  onConnect: (connection: PreviewConnection) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState("Google Calendar");
  const [selected, setSelected] = useState(["업무 일정"]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      className="cc-editor cc-connection-dialog"
      ref={ref}
      aria-labelledby="cc-connect-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="cc-editor-header">
        <div>
          <Badge variant="muted">연결 흐름 미리보기</Badge>
          <h2 id="cc-connect-title">
            <Plug size={19} />
            캘린더 연결
          </h2>
        </div>
        <Btn aria-label="연결 화면 닫기" onClick={onClose}>
          <X size={18} />
        </Btn>
      </header>
      <div className="cc-editor-body">
        <p className="cc-policy">실제 로그인이나 계정 접근은 하지 않습니다.</p>
        <div className="cc-connect-steps">
          <span className={step === 0 ? "active" : ""}>1. 출처</span>
          <span className={step === 1 ? "active" : ""}>2. 안내</span>
          <span className={step === 2 ? "active" : ""}>3. 캘린더</span>
        </div>
        {failed ? (
          <div className="cc-state-panel">
            <h3>연결을 완료하지 못했습니다</h3>
            <p>연결 실패 상태의 예시입니다. 입력한 선택은 유지됩니다.</p>
            <Btn primary onClick={() => setFailed(false)}>
              다시 시도 · 예시
            </Btn>
          </div>
        ) : step === 0 ? (
          <>
            <h3>어떤 캘린더를 연결할까요?</h3>
            <div className="cc-provider-options">
              {["Google Calendar", "Apple Calendar", "Microsoft Outlook"].map(
                (name) => (
                  <Btn
                    key={name}
                    onClick={() => {
                      setProvider(name);
                      setStep(1);
                    }}
                  >
                    {name}
                    <span>선택</span>
                  </Btn>
                ),
              )}
            </div>
          </>
        ) : step === 1 ? (
          <>
            <h3>{provider}</h3>
            <p className="cc-policy">
              일정 제목·시간·설명을 읽어 캘린더에 표시하는 연결을 미리 봅니다.
              일정 수정이나 초대 발송은 포함하지 않습니다.
            </p>
            <div className="cc-local-notice">
              계정 인증은 아직 연결되지 않았습니다. 다음 단계도 샘플입니다.
            </div>
            <div className="cc-work-card-foot">
              <Btn onClick={() => setStep(0)}>
                <ArrowLeft size={14} />
                이전
              </Btn>
              <Btn primary onClick={() => setStep(2)}>
                샘플 연결 계속
              </Btn>
            </div>
            <Btn className="cc-back" onClick={() => setFailed(true)}>
              실패 상태 보기
            </Btn>
          </>
        ) : (
          <>
            <h3>표시할 캘린더 선택</h3>
            <p className="cc-policy">{provider} · 샘플 목록</p>
            {["업무 일정", "개인 일정", "공휴일"].map((name) => (
              <label className="cc-checkbox" key={name}>
                <input
                  type="checkbox"
                  checked={selected.includes(name)}
                  onChange={(e) =>
                    setSelected((list) =>
                      e.target.checked
                        ? [...list, name]
                        : list.filter((x) => x !== name),
                    )
                  }
                />
                {name}
              </label>
            ))}
            <div className="cc-work-card-foot">
              <Btn onClick={() => setStep(1)}>이전</Btn>
              <Btn
                primary
                disabled={!selected.length}
                onClick={() =>
                  onConnect({ id: provider, provider, calendars: selected })
                }
              >
                <Check size={14} />
                선택 완료 · 샘플
              </Btn>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
