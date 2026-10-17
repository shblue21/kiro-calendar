"""Provider-neutral calendar values. No host, file, or EventKit dependencies."""

from __future__ import annotations
from typing import Protocol
from .domain import (
    DraftCandidate,
    DraftError,
    parse_time,
    DEFAULT_EVENT_DURATION,
    MAX_EVENT_DURATION,
    MAX_QUERY_DURATION,
    NOTES_LIMIT,
)


class CalendarError(Exception):
    def __init__(self, code: str, message: str):
        self.code, self.message = code, message
        super().__init__(message)


class CalendarProvider(Protocol):
    """Delivery calls return outcomes; exceptions do not establish absence of a write."""

    def status(self) -> dict: ...
    def authorize(self) -> dict: ...
    def calendars(self) -> list[dict]: ...
    def events(self, calendar_ids: list[str], start: str, end: str) -> dict: ...
    def create(self, operation: dict) -> dict: ...
    def reconcile(self, operation: dict) -> dict: ...


def delivery_result(value: dict) -> dict:
    """Decode the delivery envelope independently of command/transport errors."""
    if (
        not isinstance(value, dict)
        or value.get("state")
        not in ("confirmed", "cancelled", "failed", "unknown", "awaiting_confirmation")
        or not isinstance(value.get("error", {}), dict)
        or any(
            not isinstance(value.get("error", {}).get(k, ""), str)
            for k in ("code", "message")
        )
        or (
            value.get("state") == "confirmed"
            and not isinstance(value.get("event"), dict)
        )
    ):
        raise CalendarError(
            "provider_contract", "캘린더 저장 결과를 확인하지 못했습니다."
        )
    return value


def delivery_failure(exc: Exception, state: str) -> dict:
    return {
        "state": state,
        "error": {
            "code": exc.code if isinstance(exc, CalendarError) else "provider_error",
            "message": exc.message
            if isinstance(exc, CalendarError)
            else "캘린더 연결 작업을 완료하지 못했습니다.",
        },
    }


def event_payload(fields: dict) -> dict:
    candidate = DraftCandidate.parse(fields)
    end = candidate.end or candidate.start + DEFAULT_EVENT_DURATION
    if end - candidate.start > MAX_EVENT_DURATION:
        raise DraftError("첫 버전에서는 7일 이내의 단일 일정을 저장할 수 있습니다.")
    if not candidate.timezone:
        raise DraftError("저장할 일정의 시간대를 선택하세요.")
    if fields.get("allDay") or fields.get("recurrence") or fields.get("attendees"):
        raise DraftError("종일·반복·참석자 초대는 아직 지원하지 않습니다.")
    notes = fields.get("notes") or ""
    if not isinstance(notes, str) or len(notes) > NOTES_LIMIT:
        raise DraftError("설명은 2,000자 이내로 입력하세요.")
    notes = notes.replace("\r\n", "\n").strip()
    return {
        "title": candidate.title,
        "start": candidate.start.isoformat(),
        "end": end.isoformat(),
        "timezone": candidate.timezone,
        "notes": notes,
    }


def interval(start: str, end: str) -> tuple[str, str]:
    first, last = parse_time(start, "start"), parse_time(end, "end")
    if last <= first or last - first > MAX_QUERY_DURATION:
        raise DraftError("조회 범위는 1년 이내여야 합니다.")
    return first.isoformat(), last.isoformat()
