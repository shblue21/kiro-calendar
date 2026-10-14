import assert from 'node:assert/strict';
import { test } from 'node:test';
import { eventItems } from '../live/projection.ts';
import type { CalendarEvent } from '../live/types.ts';
import { countMonthlyItems } from './count.ts';
import { civilDate } from "./dates.ts";

const base = civilDate("2026-01-01");
const range = {first: -7, end: 740};
const event: CalendarEvent = {connectionId:'account',calendarId:'calendar',eventId:'event',title:'여행',
  start:'2026-10-05T00:00:00+09:00',end:'2026-10-07T00:00:00+09:00',
  allDay:true,startDate:'2026-10-05',endDate:'2026-10-07',timezone:'Asia/Seoul',
  calendarTitle:'Calendar',sourceTitle:'Account',notes:'',recurring:false};
const project = (e: CalendarEvent) => eventItems(e,base,range,'Asia/Seoul');
test('cross-month event counts once in each affected month; another year is excluded',()=>{
  const items=project({...event,start:'2026-10-31T00:00:00+09:00',end:'2026-11-03T00:00:00+09:00',startDate:'2026-10-31',endDate:'2026-11-03'});
  items.push(...project({...event,start:'2027-10-05T00:00:00+09:00',end:'2027-10-07T00:00:00+09:00',startDate:'2027-10-05',endDate:'2027-10-07'}));
  assert.equal(countMonthlyItems(items,base,2026,9),1);
  assert.equal(countMonthlyItems(items,base,2026,10),1);
  assert.equal(countMonthlyItems(items,base,2026,8),0);
});
