"""Provider-neutral calendar values. No host, file, or EventKit dependencies."""
from __future__ import annotations
from datetime import timedelta
from typing import Protocol
from .domain import DraftCandidate, DraftError, _parse_time, _text


class CalendarError(Exception):
    def __init__(self, code: str, message: str):
        self.code, self.message = code, message
        super().__init__(message)


class CalendarProvider(Protocol):
    def status(self) -> dict: ...
    def authorize(self) -> dict: ...
    def calendars(self) -> list[dict]: ...
    def events(self, calendar_ids: list[str], start: str, end: str) -> dict: ...
    def create(self, operation: dict) -> dict: ...
    def reconcile(self, operation: dict) -> dict: ...


def event_payload(fields: dict) -> dict:
    candidate = DraftCandidate.parse(fields, proactive=False)
    end = candidate.end or candidate.start + timedelta(hours=1)
    if end - candidate.start > timedelta(days=7):
        raise DraftError('첫 버전에서는 7일 이내의 단일 일정을 저장할 수 있습니다.')
    if not candidate.timezone:
        raise DraftError('저장할 일정의 시간대를 선택하세요.')
    if fields.get('allDay') or fields.get('recurrence') or fields.get('attendees'):
        raise DraftError('종일·반복·참석자 초대는 아직 지원하지 않습니다.')
    notes = fields.get('notes') or ''
    if not isinstance(notes, str) or len(notes) > 2000:
        raise DraftError('설명은 2,000자 이내로 입력하세요.')
    notes = notes.replace('\r\n', '\n').strip()
    return {'title': candidate.title, 'start': candidate.start.isoformat(), 'end': end.isoformat(),
            'timezone': candidate.timezone, 'notes': notes}


def interval(start: str, end: str) -> tuple[str, str]:
    first, last = _parse_time(start, 'start'), _parse_time(end, 'end')
    if last <= first or last - first > timedelta(days=370):
        raise DraftError('조회 범위는 1년 이내여야 합니다.')
    return first.isoformat(), last.isoformat()
