import { Btn } from '@kirocrew/app-sdk/ui';
import type { Draft } from './types';

/** Presentational list. Requests, navigation and refresh coordination stay in App. */
export function DraftList({drafts,timezone,error,onRefresh,onSelect,onDismiss,onOrigin}: {
  drafts: readonly Draft[]; timezone:string; error:string;
  onRefresh:()=>void; onSelect:(draft:Draft)=>void; onDismiss:(draft:Draft)=>void; onOrigin:(key:string)=>void;
}) {
  return <section className="cc-settings-section" aria-labelledby="cc-live-drafts">
    <div className="cc-preference-row"><div><h3 id="cc-live-drafts">일정 초안</h3><p>날짜와 저장 위치를 검토한 뒤 선택한 캘린더에 저장하세요.</p></div><Btn onClick={onRefresh}>초안 다시 불러오기</Btn></div>
    {error && <p role="alert">{error}</p>}
    {!drafts.length && <p>보관 중인 초안이 없습니다.</p>}
    {drafts.map(d=><div className="cc-draft-row" key={d.id}>
      <div><strong>{d.title}</strong><span>{new Date(d.start).toLocaleString('ko-KR',{timeZone:timezone})} · {d.calendarOperation?.state==='confirmed'?'저장 확인됨':d.calendarOperation?.state==='awaiting_confirmation'?'저장 확인 대기':d.calendarOperation?.state==='unknown'?'저장 결과 확인 필요':'검토용 초안'}</span>{d.reason && <small>{d.reason}</small>}</div>
      <div className="cc-inline-actions"><Btn primary onClick={()=>onSelect(d)}>{d.calendarOperation?.state==='confirmed'?'저장 정보':'검토·수정'}</Btn>
        {d.origin.sessionKey.startsWith('dashboard:') && <Btn onClick={()=>onOrigin(d.origin.sessionKey)}>원래 대화</Btn>}
        {!['awaiting_confirmation','unknown','confirmed'].includes(d.calendarOperation?.state || '') && <Btn onClick={()=>onDismiss(d)}>넘기기</Btn>}
      </div>
    </div>)}
  </section>;
}
