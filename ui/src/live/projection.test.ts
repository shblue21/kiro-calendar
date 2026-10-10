import {test} from 'node:test';
import assert from 'node:assert/strict';
import {eventItems,draftItems,inputISO,localInput} from './projection.ts';
import type {CalendarEvent,Draft} from './types.ts';
const base=new Date(2030,0,7,12);
const event:CalendarEvent={eventId:'opaque',calendarId:'one',title:'跨日',start:'2030-01-07T23:00:00+09:00',end:'2030-01-08T01:00:00+09:00',allDay:false,startDate:'2030-01-07',endDate:'2030-01-08',timezone:'Asia/Seoul',calendarTitle:'Calendar',sourceTitle:'A',notes:'',recurring:false};
test('multi-day timed intervals are clipped and keep source identity',()=>{
 const items=eventItems(event,base,{first:0,end:7},"Asia/Seoul");assert.equal(items.length,2);
 assert.deepEqual(items.map(i=>[i.day,i.start,i.end]),[[0,1380,1440],[1,0,60]]);
 assert.equal(items[0].providerEvent?.eventId,'opaque');assert.notEqual(items[0].id,items[1].id);
 assert.equal(eventItems(event,base,{first:1,end:2},"Asia/Seoul").length,1);
});
test('exclusive all-day end does not add the following day',()=>{
 const items=eventItems({...event,allDay:true,startDate:'2030-01-07',endDate:'2030-01-09',end:'2030-01-09T00:00:00+09:00'},base,{first:0,end:7},"Asia/Seoul");
 assert.deepEqual(items.map(i=>i.day),[0,1]);assert.ok(items.every(i=>i.allDay));
});
test('midnight end belongs to the previous day',()=>{
 const items=eventItems({...event,end:'2030-01-08T00:00:00+09:00'},base,{first:0,end:7},"Asia/Seoul");assert.equal(items.length,1);assert.equal(items[0].end,1440);
});
test('same event id in another calendar remains separate',()=>{
 assert.notEqual(eventItems(event,base,{first:0,end:7},"Asia/Seoul")[0].id,eventItems({...event,calendarId:'two'},base,{first:0,end:7},"Asia/Seoul")[0].id);
});
test('confirmed or dismissed drafts are not projected as unsaved entries',()=>{
 const d:Draft={id:'x',revision:1,title:'Draft',start:event.start,end:event.end,timezone:'Asia/Seoul',status:'proposed',reason:'',source:'manual',origin:{sessionKey:'calendar:manual',identitySource:'dashboard'}};
 assert.equal(draftItems([d],base,{first:0,end:7},"Asia/Seoul").length,2);
 assert.equal(draftItems([{...d,status:'dismissed'}],base,{first:0,end:7},"Asia/Seoul").length,0);
 assert.equal(draftItems([{...d,calendarOperation:{state:'confirmed'} as Draft['calendarOperation']}],base,{first:0,end:7},"Asia/Seoul").length,0);
});
test('local editor value roundtrips with an explicit offset',()=>{
 const local='2030-01-07T10:30';assert.equal(localInput(inputISO(local,"Asia/Seoul"),"Asia/Seoul"),local);assert.match(inputISO(local,"Asia/Seoul"),/[+-]\d{2}:\d{2}$/);assert.throws(()=>inputISO('2030-02-31T10:30','Asia/Seoul'));
});
test('calendar display and editing use the same supplied zone, not browser defaults',()=>{
 const source={...event,start:'2030-01-07T01:00:00Z',end:'2030-01-07T02:00:00Z'};
 const seoul=eventItems(source,base,{first:-1,end:7},'Asia/Seoul')[0];
 const ny=eventItems(source,base,{first:-1,end:7},'America/New_York')[0];
 assert.equal(seoul.start,600);assert.equal(ny.start,1200);assert.equal(ny.day,-1);
 assert.equal(localInput(source.start,'America/New_York'),'2030-01-06T20:00');
 assert.equal(Date.parse(inputISO('2030-01-06T20:00','America/New_York')),Date.parse(source.start));
});
test('DST missing or repeated input is rejected instead of silently changing the time',()=>{
 assert.throws(()=>inputISO('2026-03-08T02:30','America/New_York'));
 assert.throws(()=>inputISO('2026-11-01T01:30','America/New_York'));
 assert.equal(inputISO('2026-07-01T10:00','America/New_York'),'2026-07-01T10:00:00-04:00');
});
test('equal provider event and calendar IDs in different connections stay distinct',()=>{
 const a=eventItems({...event,connectionId:'account-a'},base,{first:0,end:7},'Asia/Seoul');
 const b=eventItems({...event,connectionId:'account-b'},base,{first:0,end:7},'Asia/Seoul');
 assert.notEqual(a[0].id,b[0].id);
});
test('opaque identifiers containing separators cannot collide',()=>{
 const a=eventItems({...event,connectionId:'a:b',calendarId:'c'},base,{first:0,end:7},'Asia/Seoul');
 const b=eventItems({...event,connectionId:'a',calendarId:'b:c'},base,{first:0,end:7},'Asia/Seoul');
 assert.notEqual(a[0].id,b[0].id);
});
test('occurrence key survives day splitting, range clipping and display timezone changes',()=>{
 const seoul=eventItems(event,base,{first:0,end:7},'Asia/Seoul');
 const clipped=eventItems(event,base,{first:1,end:2},'Asia/Seoul');
 const utc=eventItems(event,base,{first:0,end:7},'UTC');
 assert.equal(new Set(seoul.map(i=>i.occurrenceKey)).size,1);
 assert.equal(clipped[0].occurrenceKey,seoul[0].occurrenceKey);
 assert.equal(utc[0].occurrenceKey,seoul[0].occurrenceKey);
 assert.notEqual(seoul[0].id,seoul[1].id);
 const next=eventItems({...event,start:'2030-01-14T23:00:00+09:00',end:'2030-01-15T01:00:00+09:00'},base,{first:7,end:14},'Asia/Seoul');
 assert.notEqual(next[0].occurrenceKey,seoul[0].occurrenceKey);
});
test('draft identity remains independent of its edited title and recommended time',()=>{
 const d:Draft={id:'stable',revision:1,title:'Before',start:event.start,end:event.end,timezone:'Asia/Seoul',status:'proposed',reason:'',source:'manual',origin:{sessionKey:'calendar:manual',identitySource:'dashboard'}};
 const before=draftItems([d],base,{first:0,end:7},'Asia/Seoul');
 const after=draftItems([{...d,title:'After',start:'2030-01-09T10:00:00+09:00',end:'2030-01-09T11:00:00+09:00'}],base,{first:0,end:7},'Asia/Seoul');
 assert.equal(before[0].occurrenceKey,after[0].occurrenceKey);
 assert.notEqual(before[0].occurrenceKey,eventItems(event,base,{first:0,end:7},'Asia/Seoul')[0].occurrenceKey);
});
test('DST fall-back interval retains actual duration and offset-qualified display labels',()=>{
 const source={...event,start:'2026-11-01T01:30:00-04:00',end:'2026-11-01T01:15:00-05:00'};
 const [item]=eventItems(source,new Date(2026,10,1,12),{first:0,end:1},'America/New_York');
 assert.equal(item.start,90);assert.equal(item.end,135);
 assert.deepEqual(item.timeLabels,{start:'01:30 UTC-04:00',end:'01:15 UTC-05:00'});
});
test('spring-forward and 25-hour cross-day intervals preserve elapsed time without duplicated segments',()=>{
 const spring=eventItems({...event,start:'2026-03-08T01:30:00-05:00',end:'2026-03-08T03:15:00-04:00'},new Date(2026,2,8,12),{first:0,end:1},'America/New_York');
 assert.equal(spring[0].end!-spring[0].start,45);
 const source={...event,start:'2026-10-31T23:30:00-04:00',end:'2026-11-02T00:30:00-05:00'};
 const items=eventItems(source,new Date(2026,9,31,12),{first:0,end:3},'America/New_York');
 assert.deepEqual(items.map(i=>i.end!-i.start),[30,1500,30]);
 assert.equal(items.reduce((n,i)=>n+i.end!-i.start,0),(Date.parse(source.end)-Date.parse(source.start))/60000);
 assert.equal(new Set(items.map(i=>i.occurrenceKey)).size,1);
 const clipped=eventItems(source,new Date(2026,9,31,12),{first:1,end:2},'America/New_York');assert.equal(clipped[0].end,1500);
});
