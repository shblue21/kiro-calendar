import {test} from 'node:test';
import assert from 'node:assert/strict';
import {eventItems} from './projection.ts';
import type {CalendarEvent,Draft} from './types.ts';
const base=new Date(2030,0,7,12);
const event:CalendarEvent={eventId:'opaque',calendarId:'one',title:'跨日',start:'2030-01-07T23:00:00+09:00',end:'2030-01-08T01:00:00+09:00',allDay:false,startDate:'2030-01-07',endDate:'2030-01-08',timezone:'Asia/Seoul',calendarTitle:'Calendar',sourceTitle:'A',notes:'',recurring:false};
test('exclusive all-day end does not add the following day',()=>{
 const items=eventItems({...event,allDay:true,startDate:'2030-01-07',endDate:'2030-01-09',end:'2030-01-09T00:00:00+09:00'},base,{first:0,end:7},"Asia/Seoul");
 assert.deepEqual(items.map(i=>i.day),[0,1]);assert.ok(items.every(i=>i.allDay));
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

test('proposal acceptance keeps display identity, local visibility never changes status',async()=>{
 const {calendarItems}=await import('./projection.ts');
 const d:Draft={id:'stable',revision:1,title:'Local',start:event.start,end:event.end,timezone:'Asia/Seoul',status:'proposed',reason:'',source:'proactive',origin:{sessionKey:'dashboard:test',identitySource:'test'}};
 const proposed=calendarItems([d],base,{first:0,end:7},'Asia/Seoul',true);
 const accepted={...d,status:'confirmed' as const,destination:{connectionId:'crew',calendarId:'default'}};
 const local=calendarItems([accepted],base,{first:0,end:7},'Asia/Seoul',true);
 assert.deepEqual(local.map(i=>i.id),proposed.map(i=>i.id));assert.deepEqual(local.map(i=>i.occurrenceKey),proposed.map(i=>i.occurrenceKey));
 assert.ok(local.every(i=>i.storage==='local'));assert.equal(calendarItems([accepted],base,{first:0,end:7},'Asia/Seoul',false).length,0);
 assert.equal(calendarItems([{...accepted,deletedAt:'now'}],base,{first:0,end:7},'Asia/Seoul',true).length,0);
 assert.equal(calendarItems([d],base,{first:0,end:7},'Asia/Seoul',false).length,2);
 assert.equal(calendarItems([{...d,status:'dismissed'}],base,{first:0,end:7},'Asia/Seoul',true).length,0);
});
test('external delivery placeholders are not local events and disappear after provider confirmation',async()=>{
 const {calendarItems}=await import('./projection.ts');
 const d:Draft={id:'pending',revision:1,title:'External',start:event.start,end:event.end,timezone:'Asia/Seoul',status:'confirmed',reason:'',source:'direct',origin:{sessionKey:'calendar:manual',identitySource:'dashboard'},destination:{connectionId:'apple-local',calendarId:'one'}};
 assert.ok(calendarItems([d],base,{first:0,end:7},'Asia/Seoul',true).every(i=>i.storage==='pending'));
 const confirmed={...d,calendarOperation:{state:'confirmed'} as Draft['calendarOperation']};
 assert.equal(calendarItems([confirmed],base,{first:0,end:7},'Asia/Seoul',true).length,0);
 const remote=eventItems({...event,draftId:d.id},base,{first:0,end:7},'Asia/Seoul');
 assert.ok(remote.every(i=>i.draftId===d.id));
});
