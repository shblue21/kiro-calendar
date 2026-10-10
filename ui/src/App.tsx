import { zonedDay, zonedInput, dateRangeInstants } from './calendar/time';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppApi, useAppInfo, useChatLauncher } from '@kirocrew/app-sdk';
import { Btn } from '@kirocrew/app-sdk/ui';
import { CalendarPage } from './calendar/CalendarPage';
import { monday, dateKey, shift } from './calendar/dates';
import { dayOffset } from './calendar/dates';
import { calendarRange } from './calendar/period';
import type { CalendarView, CalendarLayout, CalendarViewItem } from './calendar/types';
import type { Draft, CalendarEvent, Connection } from './live/types';
import { draftItems, eventItems } from './live/projection';
import { DraftEditor } from './live/DraftEditor';
import { CalendarConnections } from './live/CalendarConnections';
import { DraftList } from './live/DraftList';
import { ProposalSettings } from './settings/ProposalSettings';
import { Settings2, Plus, ArrowLeft, RotateCcw } from './platform/kiro/icons';
import { message } from './live/api';
import styles from './styles.css?inline';

export default function CalendarApp() {
  const api = useRef(useAppApi()), {name} = useAppInfo();
  const [zone,setZone] = useState(''), [error,setError] = useState('');
  const load = useCallback(async()=>{
    try {const body=await api.current.get<{settings:{timezone:string}}>(`/api/apps/${name}/settings`);setZone(body.settings.timezone);setError('');}
    catch {setError('OS 시스템 시간대를 확인하지 못했습니다.');}
  },[name]);
  useEffect(()=>{void load();},[load]);
  if(!zone)return <div className="cc-calendar"><style>{styles}</style><p role="status">{error || '캘린더를 불러오고 있습니다.'}</p>{error && <Btn onClick={()=>void load()}>다시 확인</Btn>}</div>;
  return <CalendarWorkspace timezone={zone}/>;
}
function CalendarWorkspace({timezone}: {timezone:string}) {
  const api=useRef(useAppApi()), {name}=useAppInfo(), {openChat}=useChatLauncher();
  const base=`/api/apps/${name}`;
  const [clock,setClock]=useState(()=>new Date()), [weekStart]=useState(()=>monday(zonedDay(new Date(),timezone)));
  const [focusDate,setFocusDate]=useState(()=>zonedDay(new Date(),timezone)), [view,setView]=useState<CalendarView>('week'), [layout,setLayout]=useState<CalendarLayout>('calendar');
  const [page,setPage]=useState<'calendar'|'settings'>(()=>new URLSearchParams(window.location.search).get('view')==='drafts'?'settings':'calendar');
  const [drafts,setDrafts]=useState<Draft[]>([]), [events,setEvents]=useState<CalendarEvent[]>([]), [connections,setConnections]=useState<Connection[]>([]);
  const [draftError,setDraftError]=useState(''), [eventError,setEventError]=useState(''), [connectionError,setConnectionError]=useState('');
  const [loading,setLoading]=useState(true), [refreshing,setRefreshing]=useState(false);
  const [editor,setEditor]=useState<{key:string;draft:Draft|null}|null>(null);
  const [jump,setJump]=useState<{id:string;serial:number}>();
  const [feedback,setFeedback]=useState('');
  const draftSequence=useRef(0), eventSequence=useRef(0), connectionSequence=useRef(0);
  const range=calendarRange(focusDate,view,weekStart,layout);
  const first=shift(weekStart,range.first), last=shift(weekStart,range.end);
  const {start:rangeStart,end:rangeEnd}=dateRangeInstants(dateKey(first),dateKey(last),timezone);
  const selected=JSON.stringify(connections.map(c=>[c.id,c.state,c.selectedCalendarIds]));
  const loadDrafts=useCallback(async()=>{
    const seq=++draftSequence.current;
    try {const body=await api.current.get<{drafts:Draft[]}>(`${base}/drafts`);if(seq===draftSequence.current){setDrafts(body.drafts);setDraftError('');}}
    catch(error){if(seq===draftSequence.current)setDraftError(`초안을 불러오지 못했습니다. ${message(error)}`);}
    finally{if(seq===draftSequence.current)setLoading(false);}
  },[base]);
  const loadConnection=useCallback(async()=>{
    const seq=++connectionSequence.current;
    try{const body=await api.current.get<{connections:Connection[]}>(`${base}/calendar/connection`);if(seq===connectionSequence.current){setConnections(body.connections);setConnectionError('');}}
    catch(error){if(seq===connectionSequence.current){setConnectionError(message(error));setConnections([]);}}
  },[base]);
  const loadEvents=useCallback(async()=>{
    const seq=++eventSequence.current;
    if(!connections.some(c=>c.selectedCalendarIds.length)){setEvents([]);setEventError('');return;}
    try {
      const body=await api.current.get<{events:CalendarEvent[];errors:{message:string}[]}>(`${base}/calendar/events?start=${encodeURIComponent(rangeStart)}&end=${encodeURIComponent(rangeEnd)}`);
      if(seq===eventSequence.current){setEvents(body.events);setEventError(body.errors.map(e=>e.message).join(' '));}
    }catch(error){if(seq===eventSequence.current){setEvents([]);setEventError(`일정 조회 실패. ${message(error)}`);}}
  },[base,rangeStart,rangeEnd,selected]);
  useEffect(()=>{void loadDrafts();void loadConnection();},[loadDrafts,loadConnection]);
  useEffect(()=>{setEvents([]);void loadEvents();},[loadEvents]);
  useEffect(()=>{const timer=window.setInterval(()=>setClock(new Date()),60000);return ()=>window.clearInterval(timer);},[]);
  const changed=useCallback(async()=>{await Promise.all([loadDrafts(),loadEvents()]);},[loadDrafts,loadEvents]);
  async function refresh(){setRefreshing(true);await Promise.all([loadDrafts(),loadConnection(),loadEvents()]);setRefreshing(false);}
  const items=useMemo(()=>[...draftItems(drafts,weekStart,range,timezone),...events.flatMap(e=>eventItems(e,weekStart,range,timezone))], [drafts,events,weekStart,range.first,range.end,timezone]);
  const offset=Math.floor(dayOffset(dateKey(focusDate),weekStart)/7);
  const wallClock=zonedInput(clock,timezone);
  const reference={day:dayOffset(wallClock.slice(0,10),weekStart),instant:clock.toISOString()};
  function edit(draft:Draft|null){setEditor({key:crypto.randomUUID(),draft});}
  function selectDraft(draft:Draft){setFocusDate(zonedDay(draft.start,timezone));setPage('calendar');setJump({id:`draft:${draft.id}@${dayOffset(zonedInput(draft.start,timezone).slice(0,10),weekStart)}`,serial:Date.now()});edit(draft);}
  function origin(key?:string){if(key?.startsWith('dashboard:'))openChat({slotKey:key.slice('dashboard:'.length)});}
  async function dismiss(draft:Draft){try{await api.current.post(`${base}/drafts/${draft.id}/status`,{status:'dismissed'});await loadDrafts();}catch(error){setFeedback(message(error));}}
  function actions(id:string){
    const item=items.find(i=>i.id===id);if(!item)return null;
    const draft=drafts.find(d=>d.id===item.draftId);
    const session=draft?.origin.sessionKey || item.providerEvent?.origin?.sessionKey;
    return <div className="cc-inline-actions">{session?.startsWith('dashboard:') && <Btn onClick={()=>origin(session)}>원래 대화로 돌아가기</Btn>}
      {draft && <Btn onClick={()=>edit(draft)}>{draft.calendarOperation?.state==='unknown'?'저장 결과 확인':'검토·저장'}</Btn>}</div>;
  }
  const visibleDrafts=drafts.filter(d=>d.status==='proposed');
  return <div className="cc-calendar"><style>{styles}</style>
    <header className="cc-compact-header"><div className="cc-compact-title"><h1>Calendar</h1><span className="cc-label">{timezone}</span></div>
      <div className="cc-header-actions">{page!=='calendar' && <Btn onClick={()=>setPage('calendar')}><ArrowLeft size={14}/>캘린더</Btn>}
      <Btn aria-label="일정 새로고침" disabled={refreshing} onClick={()=>void refresh()}><RotateCcw size={14}/></Btn>
      <Btn onClick={()=>edit(null)}><Plus size={15}/>일정 추가</Btn><Btn aria-label="캘린더 설정" aria-pressed={page==='settings'} onClick={()=>setPage(page==='settings'?'calendar':'settings')}><Settings2 size={16}/></Btn></div></header>
    {feedback && <div className="cc-feedback" role="status">{feedback}<Btn aria-label="안내 닫기" onClick={()=>setFeedback('')}>×</Btn></div>}
    <div className="cc-route-panel" hidden={page!=='calendar'} role="region" aria-label="캘린더">
      <CalendarPage timezone={timezone} items={items} weekStart={weekStart} referenceTime={reference} view={view} layout={layout} onView={setView} onLayout={setLayout}
        focusDate={focusDate} onFocusDate={setFocusDate} offset={offset} onOffset={n=>setFocusDate(shift(weekStart,n*7))} jump={jump}
        status={loading?'loading':'ready'} onReload={()=>void refresh()} onAdd={()=>edit(null)} onEdit={(item:CalendarViewItem)=>{const d=drafts.find(d=>d.id===item.draftId);if(d)edit(d);}}
        eventActions={actions} notice={<>
          {(draftError||eventError) && <div className="cc-feedback" role="alert">{[draftError,eventError].filter(Boolean).join(' ')}<Btn onClick={()=>void refresh()}>다시 확인</Btn></div>}
          {(!connections.some(c=>c.state==='ready' && c.selectedCalendarIds.length>0)) && <div className="cc-live-notice"><span>검토용 초안을 표시합니다. 외부 일정을 보려면 연결에서 표시할 캘린더를 선택하세요.</span><Btn onClick={()=>setPage('settings')}>캘린더 연결</Btn></div>}
        </>}/>
    </div>
    <div className="cc-route-panel" hidden={page!=='settings'} role="region" aria-label="설정"><div className="cc-settings-page">
      <div className="cc-settings-heading"><h2>설정</h2></div>
      <CalendarConnections connections={connections} error={connectionError} onRefresh={loadConnection}/>
      <ProposalSettings/>
      <DraftList drafts={visibleDrafts} timezone={timezone} error={draftError}
        onRefresh={()=>void loadDrafts()} onSelect={selectDraft} onDismiss={d=>void dismiss(d)} onOrigin={origin}/>
    </div></div>
    {editor && <DraftEditor timezone={timezone} key={editor.key} draft={editor.draft} date={focusDate} connections={connections} onClose={()=>setEditor(null)} onChanged={changed}/>}
  </div>;
}
