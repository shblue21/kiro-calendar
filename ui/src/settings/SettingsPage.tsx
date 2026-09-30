import { useState } from "react";
import { Btn } from "@kirocrew/app-sdk/ui";
import { ArrowLeft, ChevronRight } from "../platform/kiro/icons";
import type { PreviewConnection } from "./ConnectionDialog";
import { PreviewControls } from "../preview/PreviewControls";
import type { PreviewScene } from "../preview/PreviewControls";

type Props = {
  scene: PreviewScene;
  onScene: (scene: PreviewScene) => void;
  proposalOn: boolean;
  onProposalToggle: (enabled: boolean) => void;
  proposalStatus: "pending" | "registered" | "dismissed";
  onProposalAction: (action: "register" | "edit" | "dismiss") => void;
  autoOn: boolean;
  onOpenAuto: () => void;
  onBack: () => void;
  connections: PreviewConnection[];
  onConnect: () => void;
  onDisconnect: (id: string) => void;
};

export function SettingsPage({
  scene,
  onScene,
  proposalOn,
  onProposalToggle,
  proposalStatus,
  onProposalAction,
  autoOn,
  onOpenAuto,
  onBack,
  connections,
  onConnect,
  onDisconnect,
}: Props) {
  const [exampleOpen, setExampleOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  return (
    <div className="cc-page-scroll cc-settings-page">
      <Btn className="cc-back" onClick={onBack}>
        <ArrowLeft size={14} />
        캘린더로 돌아가기
      </Btn>
      <div className="cc-settings-heading">
        <h2>설정</h2>
      </div>
      <section className="cc-settings-section" aria-labelledby="cc-settings-proposals">
        <div className="cc-preference-row">
          <div>
            <h3 id="cc-settings-proposals">대화 중 일정 제안</h3>
            <p>대화에서 챙길 일을 발견하면 일정을 제안해요.<br />등록은 확인 후에만 해요.</p>
          </div>
          <label className="cc-auto-switch">
            <span>{proposalOn ? "ON" : "OFF"}</span>
            <input type="checkbox" role="switch" aria-label="대화 중 일정 제안"
              checked={proposalOn} onChange={(e) => onProposalToggle(e.target.checked)} />
          </label>
        </div>
        <p className="cc-settings-section-note">
          추가 토큰이 사용될 수 있어요. 현재는 AI 호출 없는 샘플입니다.
        </p>
        <Btn className="cc-proposal-example-button" aria-expanded={exampleOpen}
          onClick={() => setExampleOpen((open) => !open)}>
          {exampleOpen ? "대화 예시 닫기" : "대화 예시 보기"}
        </Btn>
        {exampleOpen && (
          <div className="cc-proposal-example">
            <blockquote>
              나 · “지원서 아직 못 썼는데 금요일 마감이야.”
              <br />
              Crew · “목요일 저녁에 마무리할 시간을 잡아둘까요?”
            </blockquote>
            <p className="cc-settings-section-note">
              등록·수정·넘기기 중에서 고르며, 등록한 일정에서 이 대화로 돌아올 수 있어요.
            </p>
          </div>
        )}
      </section>
      <section className="cc-settings-section" aria-labelledby="cc-settings-connections">
        <div className="cc-preference-row">
          <div>
            <h3 id="cc-settings-connections">캘린더 연결</h3>
            <p>
              {connections.length
                ? `${connections.map((c) => `${c.provider} · ${c.calendars.join(", ")}`).join(" / ")} · 샘플 연결`
                : "선택한 캘린더 출처가 없습니다."}
              <br />
              표시 시간대 Asia/Seoul · 샘플 고정
            </p>
          </div>
          <Btn aria-expanded={manageOpen} onClick={() => setManageOpen((open) => !open)}>
            연결 관리
          </Btn>
        </div>
        {manageOpen && (
          <div className="cc-settings-disclosure">
            {connections.map((connection) => (
              <div className="cc-preference-row" key={connection.id}>
                <div>
                  <h4>{connection.provider}</h4>
                  <p>{connection.calendars.join(" · ")}</p>
                </div>
                <Btn onClick={() => onDisconnect(connection.id)}>해제 · 샘플</Btn>
              </div>
            ))}
            <Btn onClick={onConnect}>캘린더 연결 · 샘플</Btn>
          </div>
        )}
      </section>
      <details className="cc-settings-fold">
        <summary>추가 기능</summary>
        <div className="cc-preference-row">
          <div>
            <h4>AI 작업 자동 예약 · {autoOn ? "ON" : "OFF"}</h4>
            <p>Crew가 수행할 미래 작업을 개별 확인 없이 예약합니다. 사람 일정 제안과는 별도입니다.</p>
          </div>
          <Btn onClick={onOpenAuto}>
            관리
            <ChevronRight size={14} />
          </Btn>
        </div>
      </details>
      <details className="cc-settings-fold">
        <summary>샘플 화면 체험</summary>
        <p className="cc-settings-section-note">
          변경 내용은 새로고침하면 초기화됩니다. 실제 캘린더와 Crew에는 저장하지 않습니다.
        </p>
        <h4>대화 제안 등록</h4>
        {!proposalOn ? (
          <p className="cc-settings-section-note">대화 중 일정 제안을 켜면 체험할 수 있어요.</p>
        ) : proposalStatus === "pending" ? (
          <div className="cc-proposal-card">
            <p>목요일 저녁에 마무리할 시간을 잡아둘까요?</p>
            <strong>지원서 마무리</strong>
            <span>10월 1일 (목) 19:00–20:00 · 추천 시간 · 저장할 캘린더: 개인 일정</span>
            <small>빈 시간을 조회한 추천은 아닙니다.</small>
            <div className="cc-proposal-actions">
              <Btn primary onClick={() => onProposalAction("register")}>등록 · 샘플</Btn>
              <Btn onClick={() => onProposalAction("edit")}>수정</Btn>
              <Btn onClick={() => onProposalAction("dismiss")}>넘기기</Btn>
            </div>
          </div>
        ) : (
          <p role="status" className="cc-settings-section-note">
            {proposalStatus === "registered"
              ? "샘플 캘린더에 등록했어요. 실제 캘린더에는 저장하지 않았습니다."
              : "이 제안은 넘겼어요. 다시 제안하지 않습니다."}
          </p>
        )}
        <h4>화면 상태</h4>
        <PreviewControls scene={scene} onChange={onScene} />
      </details>
    </div>
  );
}
