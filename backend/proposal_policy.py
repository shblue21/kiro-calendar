"""Pure proposal decisions. No filesystem, host API, or model calls."""
from __future__ import annotations
import re
from datetime import datetime
from .domain import DraftCandidate, DraftError, ProposalDenied, _parse_time

COOLDOWN_SECONDS = 1800

class ProposalPolicy:
    def __init__(self, cooldown_seconds: int = COOLDOWN_SECONDS):
        self.cooldown_seconds = cooldown_seconds

    def require_enabled(self, settings: dict, session: str) -> None:
        if not settings["suggestionsEnabled"]:
            raise ProposalDenied("disabled")
        if session not in settings["sessionKeys"]:
            raise ProposalDenied("out_of_scope")

    def duplicate(self, candidate: DraftCandidate, session: str, existing: list[dict], *, proactive: bool) -> dict | None:
        for draft in existing:
            if draft.get("origin", {}).get("sessionKey") != session:
                continue
            start = _parse_time(draft["start"], "stored start")
            exact = draft["title"].casefold() == candidate.title.casefold() and start == candidate.start
            occurrence = draft.get("deadlineDate") or start.date().isoformat()
            same_action = (proactive and draft.get("source") == "proactive"
                           and re.sub(r"\W+", "", draft["title"].casefold()) == candidate.action_key
                           and occurrence == candidate.occurrence)
            if exact or same_action:
                return draft
        return None

    def require_new_proposal(self, candidate: DraftCandidate, session: str, existing: list[dict], now: datetime) -> None:
        if candidate.start <= now:
            raise DraftError("Automatic proposals must be in the future")
        for draft in existing:
            if draft.get("source") == "proactive" and draft.get("origin", {}).get("sessionKey") == session:
                if (now - _parse_time(draft["createdAt"], "createdAt")).total_seconds() < self.cooldown_seconds:
                    raise ProposalDenied("cooldown")
