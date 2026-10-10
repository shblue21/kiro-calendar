import { zonedInput, zonedISO, dayBounds, intervalLabels } from '../calendar/time.ts';
import type { CalendarViewItem } from '../calendar/types.ts';
import { dateKey, shift } from '../calendar/dates.ts';
import { dayOffset } from '../calendar/dates.ts';
import type { CalendarEvent, Draft } from './types.ts';

/** Split source intervals into day cells; provider identifiers never become relative dates. */
export function eventItems(event: CalendarEvent, base: Date, range: {first: number; end: number}, zone: string): CalendarViewItem[] {
  const start = new Date(event.start), end = new Date(event.end);
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || end <= start) return [];
  const startWall = zonedInput(start,zone);
  const first = event.allDay ? dayOffset(event.startDate, base) : dayOffset(startWall.slice(0,10), base);
  const last = event.allDay ? dayOffset(event.endDate, base) - 1 : dayOffset(zonedInput(new Date(+end - 1),zone).slice(0,10), base);
  const occurrenceKey = JSON.stringify(["event", event.connectionId ?? null, event.calendarId, event.eventId, start.getTime()]);
  const rows: CalendarViewItem[] = [];
  for (let day = Math.max(first, range.first); day <= Math.min(last, range.end - 1); day++) {
    const bounds = dayBounds(dateKey(shift(base,day)),zone);
    if (bounds.durationMinutes === 0) continue;
    const segmentStart = Math.max(+start,bounds.startMs), segmentEnd = Math.min(+end,bounds.endMs);
    if (!event.allDay && segmentEnd <= segmentStart) continue;
    rows.push({id: `event:${JSON.stringify([event.connectionId ?? null,event.calendarId,event.eventId,event.start,day])}`, kind:'event', occurrenceKey, day,
      title:event.title, start:event.allDay ? 0 : (segmentStart-bounds.startMs)/60_000,
      end:event.allDay ? undefined : (segmentEnd-bounds.startMs)/60_000,
      timeLabels:event.allDay ? undefined : intervalLabels(segmentStart,segmentEnd,bounds),
      allDay:event.allDay, source:`${event.connectionTitle ? event.connectionTitle + " · " : ""}${event.sourceTitle} · ${event.calendarTitle}`, description:event.notes,
      storage:'external', providerEvent:event, editable:false});
  }
  return rows;
}
export function draftItems(drafts: Draft[], base: Date, range: {first: number; end: number}, zone: string): CalendarViewItem[] {
  return drafts.filter(d => d.status === 'proposed' && d.calendarOperation?.state !== 'confirmed').flatMap(d => {
    if (!Number.isFinite(+new Date(d.start))) return [];
    const occurrenceKey = JSON.stringify(["draft", d.id]);
    const end = d.end || new Date(+new Date(d.start)+3600000).toISOString();
    return eventItems({eventId:d.id, calendarId:'drafts', title:d.title, start:d.start, end,
      allDay:false,startDate:'',endDate:'',timezone:d.timezone,calendarTitle:'초안',sourceTitle:'Crew',notes:d.notes || d.reason,recurring:false},base,range,zone)
      .map(item=>({...item,occurrenceKey,id:`draft:${d.id}@${item.day}`,source:d.source==='proactive'?'Crew 제안 · 검토용 초안':'검토용 초안',
        storage:'draft' as const, draftId:d.id, providerEvent:undefined,editable:!['awaiting_confirmation','unknown'].includes(d.calendarOperation?.state || '')}));
  });
}
export function localInput(value: string, zone: string) { return zonedInput(value,zone); }
export function inputISO(value: string, zone: string): string { return zonedISO(value,zone); }
