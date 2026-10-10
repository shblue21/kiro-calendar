import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayTimeline,dateRangeInstants,zonedISO,elapsedMinute} from './time.ts';

test('query date boundaries accept repeated midnight without weakening user input validation',()=>{
 const range=dateRangeInstants('2026-11-01','2026-12-01','America/Havana');
 assert.equal(range.start,'2026-11-01T04:00:00.000Z');
 assert.equal(range.end,'2026-12-01T05:00:00.000Z');
 assert.throws(()=>zonedISO('2026-11-01T00:00','America/Havana'));
 assert.throws(()=>zonedISO('2030-02-31T10:30','Asia/Seoul'));
 assert.equal(zonedISO('2030-01-07T10:30','Asia/Seoul'),'2030-01-07T10:30:00+09:00');
});
test('repeated hour ticks and instants remain distinct',()=>{
 const day=dayTimeline('2026-11-01','America/New_York');
 assert.deepEqual(day.ticks.slice(1,3).map(t=>[t.minute,t.label]),[[60,'01:00 UTC-04:00'],[120,'01:00 UTC-05:00']]);
 assert.equal(elapsedMinute('2026-11-01T01:30:00-04:00',day),90);
 assert.equal(elapsedMinute('2026-11-01T01:30:00-05:00',day),150);
 const spring=dayTimeline('2026-03-08','America/New_York');
 assert.equal(spring.ticks[2].label,'03:00');
 assert.equal(day.durationMinutes,1500);assert.equal(spring.durationMinutes,1380);
});
