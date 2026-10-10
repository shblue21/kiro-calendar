import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayBounds,dayTimeline,dateRangeInstants,zonedISO,elapsedMinute} from './time.ts';

test('query date boundaries accept repeated midnight without weakening user input validation',()=>{
 const range=dateRangeInstants('2026-11-01','2026-12-01','America/Havana');
 assert.equal(range.start,'2026-11-01T04:00:00.000Z');
 assert.equal(range.end,'2026-12-01T05:00:00.000Z');
 assert.throws(()=>zonedISO('2026-11-01T00:00','America/Havana'));
});
test('missing midnight starts at the first real time and skipped dates have an empty interval',()=>{
 const gap=dayBounds('2026-03-08','America/Havana');
 assert.equal(new Date(gap.startMs).toISOString(),'2026-03-08T05:00:00.000Z');
 assert.equal(gap.durationMinutes,23*60);
 assert.throws(()=>zonedISO('2026-03-08T00:00','America/Havana'));
 const skipped=dayBounds('2011-12-30','Pacific/Apia');assert.equal(skipped.startMs,skipped.endMs);
});
test('day axes model 23, 25 and half-hour transition days',()=>{
 assert.equal(dayBounds('2026-03-08','America/New_York').durationMinutes,1380);
 assert.equal(dayBounds('2026-11-01','America/New_York').durationMinutes,1500);
 assert.equal(dayBounds('2026-04-05','Australia/Lord_Howe').durationMinutes,1470);
 assert.equal(dayBounds('2026-10-04','Australia/Lord_Howe').durationMinutes,1410);
 assert.equal(dayBounds('2026-11-01','Asia/Seoul').durationMinutes,1440);
});
test('repeated hour ticks and instants remain distinct',()=>{
 const day=dayTimeline('2026-11-01','America/New_York');
 assert.deepEqual(day.ticks.slice(1,3).map(t=>[t.minute,t.label]),[[60,'01:00 UTC-04:00'],[120,'01:00 UTC-05:00']]);
 assert.equal(elapsedMinute('2026-11-01T01:30:00-04:00',day),90);
 assert.equal(elapsedMinute('2026-11-01T01:30:00-05:00',day),150);
 const spring=dayTimeline('2026-03-08','America/New_York');
 assert.equal(spring.ticks[2].label,'03:00');
});
