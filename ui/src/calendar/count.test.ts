import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countMonthlyItems } from './count.ts';
import { eventItems, draftItems } from '../live/projection.ts';
import type { CalendarEvent, Draft } from '../live/types.ts';

const base = new Date(2026, 0, 1, 12);
const range = {first: -7, end: 740};
const event: CalendarEvent = {connectionId:'account',calendarId:'calendar',eventId:'event',title:'여행',
  start:'2026-10-05T00:00:00+09:00',end:'2026-10-07T00:00:00+09:00',
  allDay:true,startDate:'2026-10-05',endDate:'2026-10-07',timezone:'Asia/Seoul',
  calendarTitle:'Calendar',sourceTitle:'Account',notes:'',recurring:false};
const project = (e: CalendarEvent) => eventItems(e,base,range,'Asia/Seoul');

test('two-day event remains on both dates but counts once',()=>{
  const items=project(event);
  assert.equal(items.length,2);
  assert.equal(countMonthlyItems(items,base,2026,9),1);
});
test('identical titles do not merge different events or accounts or calendars',()=>{
  const items=[...project(event),...project({...event,eventId:'another'}),
    ...project({...event,connectionId:'another'}),...project({...event,calendarId:'another'})];
  assert.equal(countMonthlyItems(items,base,2026,9),4);
});
test('separate recurrence occurrences count separately even when each spans days',()=>{
  const items=[...project({...event,recurring:true}),...project({...event,recurring:true,
    start:'2026-10-12T00:00:00+09:00',end:'2026-10-14T00:00:00+09:00',startDate:'2026-10-12',endDate:'2026-10-14'})];
  assert.equal(items.length,4);
  assert.equal(countMonthlyItems(items,base,2026,9),2);
});
test('same occurrence with a different offset representation is not double counted',()=>{
  assert.equal(countMonthlyItems([...project(event),...project({...event,start:'2026-10-04T15:00:00Z'})],base,2026,9),1);
});
test('cross-month event counts once in each affected month; another year is excluded',()=>{
  const items=project({...event,start:'2026-10-31T00:00:00+09:00',end:'2026-11-03T00:00:00+09:00',startDate:'2026-10-31',endDate:'2026-11-03'});
  items.push(...project({...event,start:'2027-10-05T00:00:00+09:00',end:'2027-10-07T00:00:00+09:00',startDate:'2027-10-05',endDate:'2027-10-07'}));
  assert.equal(countMonthlyItems(items,base,2026,9),1);
  assert.equal(countMonthlyItems(items,base,2026,10),1);
  assert.equal(countMonthlyItems(items,base,2026,8),0);
});
test('multi-day drafts count by draft id and do not merge with external events',()=>{
  const d: Draft={id:'event',revision:1,title:'여행',start:event.start,end:event.end,
    timezone:'Asia/Seoul',reason:'',status:'proposed',source:'manual',origin:{sessionKey:'calendar:manual',identitySource:'test'}};
  const items=draftItems([d],base,range,'Asia/Seoul');
  assert.equal(items.length,2);
  assert.equal(countMonthlyItems([...items,...items,...project(event)],base,2026,9),2);
});
test('counting needs only occurrence keys, not original provider or draft metadata',()=>{
  const fragments=project(event).map(({providerEvent,draftId,storage,...item})=>item);
  assert.notEqual(fragments[0].id,fragments[1].id);
  assert.equal(fragments[0].occurrenceKey,fragments[1].occurrenceKey);
  assert.equal(countMonthlyItems(fragments,base,2026,9),1);
  assert.equal(countMonthlyItems([...fragments,{...fragments[0],id:'another-cell',occurrenceKey:'another-occurrence'}],base,2026,9),2);
});
