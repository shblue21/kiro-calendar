"""Thin conversation adapter. Consent is interpreted by the agent; saves are idempotent.

No pending proposals, turn tracking or separate request store. The agent obtains
one request ID after agreement and retains it, with the exact fields, for retries.
"""
from __future__ import annotations
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo
from .calendar_domain import CalendarError
from .domain import DraftError
from .entry_policy import CREW
from .timezone import system_timezone


class ConversationSchedule:
    def __init__(self, items, is_available):
        self.items = items
        self.is_available = is_available

    def _require_available(self, caller):
        if not self.is_available(caller["sessionKey"]):
            raise DraftError("Calendar registration requires an enabled app and a regular dashboard conversation")

    def context(self, caller, draft_id=None):
        self._require_available(caller)
        zone = system_timezone()
        context = {
            "requestId": uuid.uuid4().hex,
            "timezone": zone,
            "now": datetime.now(ZoneInfo(zone)).isoformat(timespec="minutes"),
            "destination": dict(CREW), "calendarName": "Crew Calendar",
        }
        if draft_id is not None:
            draft = self.items.repository.get_item(draft_id)
            if draft["origin"]["sessionKey"] != caller["sessionKey"]:
                raise CalendarError("draft_unavailable", "이 대화에 연결된 초안만 확인할 수 있습니다.")
            context["draft"] = draft
        return context

    def register(self, fields, caller):
        self._require_available(caller)
        if not isinstance(fields, dict):
            raise DraftError("Schedule arguments must be an object")
        if not fields.get("end"):
            raise DraftError("Agree on an end time before registering the event")
        if fields.get("destination", CREW) != CREW:
            raise DraftError("Conversation registration supports Crew Calendar only")
        draft_id = fields.get("draftId")
        if "draftId" in fields and (not isinstance(draft_id, str) or not draft_id):
            raise DraftError("draftId must identify the existing draft")
        if draft_id is None and "revision" in fields:
            raise DraftError("revision requires draftId")
        item, replayed = self.items.save(
            {**fields, "destination": dict(CREW)}, draft_id=draft_id, origin=caller,
        )
        return {"item": item, "replayed": replayed}
