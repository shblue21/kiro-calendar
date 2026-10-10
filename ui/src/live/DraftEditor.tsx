import { useEffect, useRef, useState } from 'react';
import { useAppApi, useAppInfo } from '@kirocrew/app-sdk';
import { Btn } from '@kirocrew/app-sdk/ui';
import type { Draft, Connection, Operation } from './types';
import { inputISO, localInput } from './projection';
import { message } from './api';

export function DraftEditor({draft, date, connections, timezone, onClose, onChanged}: {
  timezone: string; draft: Draft | null; date: Date; connections: Connection[]; onClose:()=>void; onChanged:()=>Promise<void>;
}) {
  const api = useRef(useAppApi()), {name} = useAppInfo();
  const base = `/api/apps/${name}/calendar`;
  const dialog = useRef<HTMLDialogElement>(null);
  const zone = timezone;
  const [saved,setSaved] = useState(draft), [title,setTitle] = useState(draft?.title || '');
  const initial = new Date(inputISO(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T10:00`,zone));
  const [start,setStart] = useState(localInput(draft?.start || initial.toISOString(),zone));
  const [end,setEnd] = useState(localInput(draft?.end || new Date(+(draft ? new Date(draft.start) : initial)+3600000).toISOString(),zone));
  const [notes,setNotes] = useState(draft?.notes || '');
  const defaults = connections.filter(c=>c.state==='ready' && c.capabilities.create && c.defaultCalendarId);
  const [target,setTarget] = useState(defaults.length===1 ? JSON.stringify({connectionId:defaults[0].id,calendarId:defaults[0].defaultCalendarId}) : '');
  const selectedTarget = target ? JSON.parse(target) as {connectionId:string;calendarId:string} : null;
  const connection = connections.find(c=>c.id===selectedTarget?.connectionId);
  const writable = connections.filter(c=>c.state==='ready' && c.capabilities.create);

  const [operation,setOperation] = useState<Operation | null>(draft?.calendarOperation || null);
  const [busy,setBusy] = useState(false), [error,setError] = useState('');
  const [leave,setLeave] = useState(false);

  const preparedHere = operation?.state==='prepared' && operation.confirmation?.mode==='app';
  const locked = !!operation && (preparedHere || ['awaiting_confirmation','unknown','confirmed'].includes(operation.state));
  const dirty = title !== (saved?.title || '') || start !== localInput(saved?.start || initial.toISOString(),zone) || end !== localInput(saved?.end || new Date(+(saved ? new Date(saved.start) : initial)+3600000).toISOString(),zone) || notes !== (saved?.notes || '');
  function close(){if(dirty && !locked)setLeave(true);else onClose();}
  useEffect(()=>{const node=dialog.current;node?.showModal();return ()=>node?.close();},[]);
  useEffect(()=>{
    if(operation?.state !== 'awaiting_confirmation') return;
    let active=true;
    const timer=window.setInterval(()=>{
      void api.current.get<{operation:Operation}>(`${base}/operations/${operation.id}`).then(body=>{
        if(!active) return;
        setOperation(body.operation);
        if(body.operation.state !== 'awaiting_confirmation') void onChanged();
      }).catch(()=>{if(active)setError('저장 결과를 불러오지 못했습니다. 다시 저장하지 말고 결과 확인을 눌러주세요.');});
    },1500);
    return ()=>{active=false;window.clearInterval(timer);};
  },[operation?.id,operation?.state,base]);
  async function persist(): Promise<Draft> {
    const fields={title,start:inputISO(start,zone),end:inputISO(end,zone),timezone:zone,notes};
    if(!title.trim() || new Date(fields.end)<=new Date(fields.start)) throw new Error('제목과 시작·종료 시간을 확인하세요.');
    const result = saved
      ? await api.current.put<{draft:Draft}>(`${base}/drafts/${saved.id}`,{...fields,revision:saved.revision || 1})
      : await api.current.post<{draft:Draft}>(`${base}/drafts`,fields);
    setSaved(result.draft);return result.draft;
  }
  async function save(external: boolean) {
    setBusy(true);setError('');
    try {
      if(external && !target) throw new Error('저장할 캘린더를 선택하세요.');
      const current=await persist();await onChanged();
      if(!external){onClose();return;}
      const prepared=await api.current.post<{operation:Operation}>(`${base}/operations`,{draftId:current.id,revision:current.revision || 1,target:selectedTarget});
      setOperation(prepared.operation);
      if(prepared.operation.confirmation?.mode==='app') return;
      // The provider owns its final confirmation when an external UI is required.
      const result=await api.current.post<{operation:Operation}>(`${base}/operations/${prepared.operation.id}/execute`);
      setOperation(result.operation);await onChanged();
    } catch(error){setError(message(error));await onChanged();}
    finally{setBusy(false);}
  }
  async function confirmPrepared() {
    if(!operation || !preparedHere)return;
    setBusy(true);setError('');
    try {const result=await api.current.post<{operation:Operation}>(`${base}/operations/${operation.id}/execute`);setOperation(result.operation);await onChanged();}
    catch(e){setError(message(e));}finally{setBusy(false);}
  }
  async function reconcile() {
    if(!operation)return;setBusy(true);setError('');
    try {const body=await api.current.post<{operation:Operation}>(`${base}/operations/${operation.id}/reconcile`);setOperation(body.operation);await onChanged();}
    catch(error){setError(message(error));}finally{setBusy(false);}
  }
  return <dialog ref={dialog} className="cc-editor" aria-labelledby="cc-live-editor-title" onCancel={e=>{e.preventDefault();close();}}>
    <form onSubmit={e=>{e.preventDefault();void save(false);}}>
      <header className="cc-editor-header"><div><span className="cc-label">{operation?.state==='confirmed'?'저장 확인됨':'검토용 초안'}</span><h2 id="cc-live-editor-title">일정 검토</h2></div><Btn type="button" aria-label="작성 패널 닫기" onClick={close}>×</Btn></header>
      <div className="cc-editor-body">
        <label className="cc-field">제목<input className="cc-control" autoFocus required maxLength={120} value={title} disabled={busy||locked} onChange={e=>setTitle(e.target.value)}/></label>
        <div className="cc-field-pair"><label className="cc-field">시작<input className="cc-control" type="datetime-local" required value={start} disabled={busy||locked} onChange={e=>setStart(e.target.value)}/></label><label className="cc-field">종료<input className="cc-control" type="datetime-local" required value={end} disabled={busy||locked} onChange={e=>setEnd(e.target.value)}/></label></div>
        <p className="cc-settings-section-note">표시·입력 시간대: {zone}. 단일 일정만 저장하며 반복·초대는 추가하지 않습니다.</p>
        <label className="cc-field">설명<textarea className="cc-control" rows={3} maxLength={2000} value={notes} disabled={busy||locked} onChange={e=>setNotes(e.target.value)}/></label>
        <label className="cc-field">저장할 캘린더<select className="cc-control" value={operation && locked ? JSON.stringify(operation.target) : target} disabled={busy||locked||!writable.length} onChange={e=>setTarget(e.target.value)}>
          <option value="">캘린더 선택</option>{writable.flatMap(c=>c.calendars.filter(cal=>cal.writable).map(cal=><option key={`${c.id}:${cal.id}`} value={JSON.stringify({connectionId:c.id,calendarId:cal.id})}>{c.title} · {cal.sourceTitle} · {cal.title}</option>))}</select></label>
        {!writable.length && <p className="cc-settings-section-note">초안은 보관할 수 있습니다. 외부 저장에는 쓰기 가능한 캘린더 연결이 필요합니다.</p>}
        {leave && <div className="cc-editor-confirm" role="alert"><p>저장하지 않은 변경 내용을 버릴까요?</p><Btn type="button" onClick={()=>setLeave(false)}>계속 작성</Btn><Btn type="button" danger onClick={onClose}>버리고 닫기</Btn></div>}
        {error && <p role="alert" className="cc-form-error">{error}</p>}
        {operation && <div className="cc-operation-state" role="status">
          {operation.state==='awaiting_confirmation' && <p>{operation.confirmation?.pendingMessage || '저장 결과를 확인하고 있습니다.'}</p>}
          {preparedHere && <p>{operation.connectionTitle} · {operation.sourceTitle} · {operation.calendarTitle}에 위 내용을 저장합니다. 확인 후 저장 버튼을 누르세요.</p>}
          {operation.state==='confirmed' && <p><strong>{operation.sourceTitle} · {operation.calendarTitle}</strong>에 저장하고 다시 조회했습니다. 다른 기기까지의 동기화 여부는 별도입니다.</p>}
          {operation.state==='cancelled' && <p>저장을 취소했습니다. 초안은 보관되어 있습니다.</p>}
          {operation.state==='failed' && <p>{operation.error?.message || '저장을 완료하지 못했습니다.'}</p>}
          {operation.state==='unknown' && <p>{operation.error?.message || '저장 결과를 확인해야 합니다.'} 중복 생성을 막기 위해 새 저장은 잠겼습니다.</p>}
          {operation.verification && operation.verification.state!=='confirmed' && <p role="alert">{operation.verification.error?.message || '원본 일정이 변경되었거나 조회할 수 없습니다.'}</p>}
          {locked && !preparedHere && operation.canReconcile!==false && <Btn type="button" disabled={busy} onClick={()=>void reconcile()}>저장 결과 다시 확인</Btn>}
        </div>}
      </div>
      <footer className="cc-editor-footer"><Btn type="button" onClick={close}>닫기</Btn><div>
        {preparedHere && <><Btn type="button" disabled={busy} onClick={()=>setOperation(null)}>수정으로 돌아가기</Btn><Btn primary type="button" disabled={busy} onClick={()=>void confirmPrepared()}>이 캘린더에 저장</Btn></>}
        {!locked && <><Btn type="submit" disabled={busy}>초안 보관</Btn><Btn primary type="button" disabled={busy || !writable.length} onClick={()=>void save(true)}>{connection?.confirmation?.actionLabel || '저장 내용 확인'}</Btn></>}
      </div></footer>
    </form>
  </dialog>;
}
