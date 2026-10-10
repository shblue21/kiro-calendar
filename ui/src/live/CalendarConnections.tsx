import { useState } from 'react';
import { useAppApi, useAppInfo } from '@kirocrew/app-sdk';
import { Btn } from '@kirocrew/app-sdk/ui';
import type { Connection } from './types';
import { message } from './api';

export function CalendarConnections({connections,error,onRefresh}: {connections:Connection[];error:string;onRefresh:()=>Promise<void>}) {
  return <><div className="cc-preference-row"><h3>캘린더 연결</h3><Btn onClick={()=>void onRefresh()}>연결 다시 확인</Btn></div>
    {error && <p role="alert" className="cc-form-error">{error}</p>}
    {connections.map(connection=><ConnectionCard key={connection.id} connection={connection} onRefresh={onRefresh}/>)}
    {!connections.length && !error && <p>등록된 캘린더 연결이 없습니다. 초안은 보관할 수 있습니다.</p>}
  </>;
}
function ConnectionCard({connection:c,onRefresh}: {connection:Connection;onRefresh:()=>Promise<void>}) {
  const api=useAppApi(),{name}=useAppInfo();const base=`/api/apps/${name}/calendar`;
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function run(action:()=>Promise<unknown>){setBusy(true);setError('');try{await action();await onRefresh();}catch(e){setError(message(e));}finally{setBusy(false);}}
  function select(ids:string[],target:string){void run(()=>api.put(`${base}/connection`,{connectionId:c.id,selectedCalendarIds:ids,defaultCalendarId:target}));}
  const ready=c.state==='ready';
  return <section className="cc-settings-section" aria-label={c.title}><h4>{c.title}</h4>
    {c.message && <p className="cc-settings-section-note">{c.message}</p>}
    {error && <p role="alert" className="cc-form-error">{error}</p>}
    {['needs_authorization','denied'].includes(c.state) && <Btn disabled={busy} onClick={()=>void run(()=>api.post(`${base}/authorize`,{connectionId:c.id}))}>{busy?'접근 허용을 확인하세요…':c.authorizationLabel || '연결 권한 확인'}</Btn>}
    {ready && c.capabilities.read && <>
      <p className="cc-settings-section-note">표시할 캘린더를 선택하세요.</p>
      <div className="cc-calendar-choices">{c.calendars.map(cal=><label className="cc-checkbox" key={cal.id}>
        <input type="checkbox" disabled={busy} checked={c.selectedCalendarIds.includes(cal.id)} onChange={e=>select(e.target.checked?[...c.selectedCalendarIds,cal.id]:c.selectedCalendarIds.filter(id=>id!==cal.id),c.defaultCalendarId)}/>
        <span>{cal.sourceTitle} · {cal.title}{!cal.writable && <small> · 읽기 전용</small>}</span></label>)}</div>
      {c.capabilities.create && <label className="cc-field">기본 저장 캘린더<select className="cc-control" disabled={busy} value={c.defaultCalendarId} onChange={e=>select(c.selectedCalendarIds,e.target.value)}><option value="">저장할 때 선택</option>{c.calendars.filter(cal=>cal.writable).map(cal=><option key={cal.id} value={cal.id}>{cal.sourceTitle} · {cal.title}</option>)}</select></label>}
    </>}
  </section>;
}
