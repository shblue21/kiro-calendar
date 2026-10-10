import { useCallback, useEffect, useRef, useState } from "react";
import { useAppApi, useAppInfo } from "@kirocrew/app-sdk";
import { hookExecutionNotice } from "./proposalStatus";
import { Btn } from "@kirocrew/app-sdk/ui";

type Settings = { suggestionsEnabled: boolean; timezone: string; revision: number; sessionKeys: string[] };
type Payload = {
  settings: Settings;
  hook: { status: "ready" | "unconfigured" | "blocked" | "unknown"; command?: string; lastStatus?: string; executionStatus?: string };
  chats: { sessionKey: string; title: string }[];
};
export function ProposalSettings() {
  const client = useAppApi();
  const api = useRef(client);
  api.current = client;
  const { name } = useAppInfo();
  const [data, setData] = useState<Payload>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [chosen, setChosen] = useState("");
  const [example, setExample] = useState(false);
  const mounted = useRef(true);
  const path = `/api/apps/${name}/settings`;
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const next = await api.current.get<Payload>(path);
      if (mounted.current) setData(next);
    } catch {
      if (mounted.current) setError("설정을 확인하지 못했어요. 다시 시도해 주세요.");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [path]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => { mounted.current = false; };
  }, [load]);
  async function save(changes: Partial<Settings>) {
    setBusy(true);
    setError("");
    try {
      const next = await api.current.put<Payload>(path, changes);
      if (mounted.current) { setData(next); setChosen(""); }
    } catch {
      if (mounted.current) setError("변경을 저장하지 못했어요. 이전 설정을 유지합니다.");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  const enabled = data?.settings.suggestionsEnabled;
  const connected = data?.hook.status === "ready";
  const keys = data?.settings.sessionKeys ?? [];
  const canEnable = connected && keys.length > 0;
  const executionNotice = hookExecutionNotice(data?.hook.executionStatus);
  return <section className="cc-settings-section" aria-labelledby="cc-settings-proposals">
    <div className="cc-preference-row">
      <div>
        <h3 id="cc-settings-proposals">대화 중 일정 제안</h3>
        <p>대화에서 챙길 일을 발견하면 검토용 초안을 제안해요.<br />초안만 제안하며, 외부 캘린더 저장은 직접 검토한 뒤 진행해요.</p>
      </div>
      <label className="cc-auto-switch">
        <span>{!data ? "확인 중" : busy ? "저장 중" : enabled ? "ON" : "OFF"}</span>
        <input type="checkbox" role="switch" aria-label="대화 중 일정 제안" checked={enabled ?? false}
          disabled={busy || !data || (!enabled && !canEnable)}
          onChange={(e) => void save({ suggestionsEnabled: e.target.checked })} />
      </label>
    </div>
    <p className="cc-settings-section-note">선택한 대화의 다음 메시지부터 적용해요. 추가 토큰이 사용될 수 있어요.</p>
    {error && <p role="alert" className="cc-settings-section-note">{error}</p>}
    <Btn className="cc-proposal-example-button" disabled={busy} onClick={() => void load()}>설정 다시 확인</Btn>
    {data && !connected && <p role="status" className="cc-settings-section-note">
      {data.hook.status === "blocked" ? "Crew 정책에서 연결 실행을 허용하지 않았어요." : "제안 기능을 처음 한 번 연결해야 해요."}
    </p>}
    {connected && executionNotice && <p className="cc-settings-section-note" role={executionNotice.failure ? "alert" : "status"}>{executionNotice.text}</p>}
    <details className="cc-settings-fold">
      <summary>적용 대화 {keys.length}개</summary>
      <p className="cc-settings-section-note">초기 버전은 선택한 일반 대화에서만 동작해요. 비공개·임시 대화와 서브에이전트는 제외합니다.</p>
      {keys.map((key) => <div className="cc-preference-row" key={key}>
        <span>{data?.chats.find((c) => c.sessionKey === key)?.title ?? "닫힌 대화"}</span>
        <Btn disabled={busy} onClick={() => void save({ sessionKeys: keys.filter((k) => k !== key),
          ...(keys.length === 1 ? { suggestionsEnabled: false } : {}) })}>제외</Btn>
      </div>)}
      <div className="cc-proposal-actions">
        <select className="cc-view-select" aria-label="제안을 적용할 대화" value={chosen} disabled={busy || !data} onChange={(e) => setChosen(e.target.value)}>
          <option value="">대화 선택</option>
          {data?.chats.filter((c) => !keys.includes(c.sessionKey)).map((c) => <option key={c.sessionKey} value={c.sessionKey}>{c.title}</option>)}
        </select>
        <Btn disabled={busy || !chosen} onClick={() => void save({ sessionKeys: [...keys, chosen] })}>추가</Btn>
      </div>
    </details>
    {data?.hook.command && !connected && <details className="cc-settings-fold">
      <summary>처음 한 번 연결하기</summary>
      <p className="cc-settings-section-note">Crew의 에이전트 기능 → 훅에서 아래 명령을 UserPromptSubmit 이벤트로 등록해 주세요. 이름은 Crew Calendar · schedule suggestions, 조건은 비워두고 활성화합니다. 등록 후 설정 다시 확인을 누르세요.</p>
      <pre className="cc-hook-command">{data.hook.command}</pre>
    </details>}
    <Btn aria-expanded={example} onClick={() => setExample((open) => !open)}>대화 예시 {example ? "닫기" : "보기"}</Btn>
    {example && <div className="cc-proposal-example"><blockquote>나 · “금요일 마감인데 지원서 아직 못 썼네.”<br />Crew · “목요일 저녁에 마무리할 시간을 잡아보면 어때요? 검토용 초안을 남겼어요.”</blockquote></div>}
  </section>;
}
