"""Calendar draft values and validation. No Crew or persistence imports."""
from __future__ import annotations
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
import hashlib
import re

SCHEMA_VERSION = 2
class DraftError(ValueError):
    pass


class DraftNotFound(DraftError):
    """A well-formed draft identifier does not exist."""


class StorageUnavailable(DraftError):
    """Persistent data could not be read or written, or is corrupt."""


class ProposalDenied(DraftError):
    def __init__(self, code: str):
        self.code = code
        super().__init__(code)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _parse_time(value: Any, field: str) -> datetime:
    if not isinstance(value, str) or not value.strip():
        raise DraftError(f"{field} is required (ISO 8601 with UTC offset)")
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError as exc:
        raise DraftError(f"{field} is not ISO 8601") from exc
    if parsed.tzinfo is None:
        raise DraftError(f"{field} needs a UTC offset")
    return parsed


def _text(value: Any, field: str, limit: int, required: bool = False) -> str:
    if value is None:
        value = ""
    if not isinstance(value, str):
        raise DraftError(f"{field} must be a string")
    text = " ".join(value.split())
    if required and not text:
        raise DraftError(f"{field} is required")
    if len(text) > limit:
        raise DraftError(f"{field} must be at most {limit} characters")
    return text



@dataclass(frozen=True)
class DraftCandidate:
    title: str
    start: datetime
    end: datetime | None
    timezone: str
    reason: str
    deadline_date: str | None

    @classmethod
    def parse(cls, fields: dict[str, Any], *, proactive: bool) -> "DraftCandidate":
        if not isinstance(fields, dict):
            raise DraftError("Draft arguments must be an object")
        title = _text(fields.get("title"), "title", 120, required=True)
        start = _parse_time(fields.get("start"), "start")
        end = _parse_time(fields.get("end"), "end") if fields.get("end") else None
        if end is not None and end <= start:
            raise DraftError("end must be after start")
        tz_name = _text(fields.get("timezone"), "timezone", 64, required=proactive)
        if tz_name:
            try:
                zone = ZoneInfo(tz_name)
            except (ZoneInfoNotFoundError, ValueError) as exc:
                raise DraftError("timezone must be a valid IANA zone") from exc
            if any(t.utcoffset() != t.astimezone(zone).utcoffset() for t in [start, end] if t is not None):
                raise DraftError("UTC offset does not match timezone")
        reason = _text(fields.get("reason"), "reason", 300, required=proactive)
        deadline = _text(fields.get("deadlineDate"), "deadlineDate", 10)
        if deadline:
            try:
                if date.fromisoformat(deadline).isoformat() != deadline:
                    raise ValueError()
            except ValueError as exc:
                raise DraftError("deadlineDate must be YYYY-MM-DD") from exc
        return cls(title, start, end, tz_name, reason, deadline or None)

    @property
    def occurrence(self) -> str:
        return self.deadline_date or self.start.date().isoformat()

    @property
    def action_key(self) -> str:
        return re.sub(r"\W+", "", self.title.casefold())

    def to_record(self, origin: dict[str, str], *, proactive: bool, now: datetime) -> dict[str, Any]:
        session = origin["sessionKey"]
        normalized = self.start.astimezone(timezone.utc).isoformat()
        draft_id = hashlib.sha256("\0".join([session, self.title.casefold(), normalized]).encode()).hexdigest()[:16]
        decision = hashlib.sha256(f"{session}\0{self.action_key}\0{self.occurrence}".encode()).hexdigest()
        created = now.isoformat(timespec="seconds")
        return {"schemaVersion": SCHEMA_VERSION, "revision": 1, "id": draft_id, "title": self.title,
                "start": self.start.isoformat(), "end": self.end.isoformat() if self.end else None,
                "timezone": self.timezone, "reason": self.reason, "status": "proposed",
                "source": "proactive" if proactive else "manual", "destination": {"connectionId": "crew", "calendarId": "default"}, "decisionKey": decision,
                "deadlineDate": self.deadline_date,
                "origin": {"sessionKey": session, "sessionType": origin.get("sessionType", "unknown"),
                           "identitySource": origin.get("identitySource", "unknown")},
                "createdAt": created, "updatedAt": created}
