import { useCallback, useEffect, useRef, useState } from "react";
import { useAppApi, useAppInfo, useChatLauncher } from "@kirocrew/app-sdk";
import { Badge, Btn } from "@kirocrew/app-sdk/ui";
import { MessageSquare, RotateCcw } from "../platform/kiro/icons";

/** Stored by the app's MCP tool; real data, unlike the calendar samples. */
type Draft = {
  id: string;
  source?: "manual" | "proactive";
  title: string;
  start: string;
  end: string | null;
  timezone: string;
  reason: string;
  status: "proposed" | "dismissed";
  createdAt: string;
  origin: { sessionKey: string; sessionType: string; identitySource: string };
  returnTarget: { kind: "dashboard"; slotKey: string } | { kind: "unsupported" };
};

const IDENTITY_LABEL: Record<string, string> = {
  "gateway-meta": "게이트웨이가 전달한 호출자",
  "host-pidfile": "호출한 세션 프로세스",
};

function when(draft: Draft) {
  const options: Intl.DateTimeFormatOptions = {
    month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    timeZone: draft.timezone || undefined,
  };
  try {
    const start = new Intl.DateTimeFormat("ko-KR", options).format(new Date(draft.start));
    if (!draft.end) return start;
    const end = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: options.timeZone }).format(new Date(draft.end));
    return `${start}–${end}`;
  } catch {
    return draft.start;
  }
}

/**
 * Experimental: drafts a Crew conversation explicitly asked for, each linked to the
 * conversation that called the tool. Returning opens that chat without sending anything.
 */
export function ConversationDrafts() {
  // Held in a ref so a host that returns a fresh client per render cannot loop the loader.
  const api = useRef(useAppApi());
  const { name } = useAppInfo();
  const { openChat } = useChatLauncher();
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState("");
  const base = `/api/apps/${name}/drafts`;

  const load = useCallback(async () => {
    setState("loading");
    try {
      const body = await api.current.get<{ drafts: Draft[] }>(base);
      setDrafts(body.drafts);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [base]);
  useEffect(() => { void load(); }, [load]);

  async function dismiss(id: string) {
    setBusy(id);
    try {
      await api.current.post(`${base}/${id}/status`, { status: "dismissed" });
      await load();
    } catch {
      setState("error");
    } finally {
      setBusy("");
    }
  }

  const open = drafts.filter((d) => d.status === "proposed");
  return (
    <section className="cc-settings-section" aria-labelledby="cc-settings-drafts">
      <div className="cc-preference-row">
        <div>
          <h3 id="cc-settings-drafts">대화에서 받은 일정 초안 · 실험</h3>
          <p>직접 요청하거나 Crew가 제안한 검토용 초안이에요. 외부 캘린더에는 저장하지 않았어요.</p>
        </div>
        <Btn aria-label="초안 다시 불러오기" onClick={() => void load()} disabled={state === "loading"}>
          <RotateCcw size={14} />
          새로고침
        </Btn>
      </div>
      {state === "loading" && <p className="cc-settings-section-note" role="status">초안을 불러오고 있어요.</p>}
      {state === "error" && (
        <p className="cc-settings-section-note" role="alert">
          초안을 불러오지 못했어요. 초안이 없다는 뜻은 아니에요.
        </p>
      )}
      {state === "ready" && open.length === 0 && (
        <p className="cc-settings-section-note">받은 초안이 없어요.</p>
      )}
      {state === "ready" && open.map((draft) => (
        <div className="cc-draft-row" key={draft.id}>
          <div>
            <strong>{draft.title}</strong>
            <span>{when(draft)} · {draft.source === "proactive" ? "Crew 제안 · 추천 시간" : "직접 요청한 시간"}</span>
            {draft.reason && <span>{draft.reason}</span>}
            <small>
              출처 {draft.origin.sessionKey} · {IDENTITY_LABEL[draft.origin.identitySource] ?? draft.origin.identitySource}
            </small>
          </div>
          <div className="cc-draft-actions">
            {draft.returnTarget.kind === "dashboard" ? (
              <Btn primary onClick={() => openChat({ slotKey: (draft.returnTarget as { slotKey: string }).slotKey })}>
                <MessageSquare size={14} />
                원래 대화로 돌아가기
              </Btn>
            ) : (
              <Badge variant="muted">이 대화는 앱에서 열 수 없어요</Badge>
            )}
            <Btn onClick={() => void dismiss(draft.id)} disabled={busy === draft.id}>넘기기</Btn>
          </div>
        </div>
      ))}
    </section>
  );
}
