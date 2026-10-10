"""Per-message context use case; transport and host eligibility are adapters."""
from __future__ import annotations
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from .domain import DraftError
from .repository import Repository
from .settings import SettingsService

OFF = ("Calendar automatic suggestions: OFF. This current state overrides earlier ON instructions. "
       "Do not proactively suggest calendar entries or call propose_schedule_draft. "
       "Only an explicit user request may use create_schedule_draft. Neither tool writes to an external calendar or sends reminders.")


class SuggestionContextService:
    def __init__(self, repository: Repository, settings: SettingsService):
        if settings.repository is not repository:
            raise ValueError("Context and settings must share one repository")
        self.repository = repository
        self.settings = settings

    def for_session(self, session: str, *, active: bool, now: datetime | None = None) -> str:
        with self.repository.transaction():
            try:
                settings = self.settings.read()
            except DraftError:
                return OFF if self.repository.was_applied(session) else ""
            if session not in settings["sessionKeys"]:
                return OFF if self.repository.was_applied(session) else ""
            if not active:
                return OFF
            stamp = now or datetime.now(timezone.utc)
            self.repository.record_application(session, {"revision": settings["revision"],
                "seenAt": stamp.isoformat(), "enabled": settings["suggestionsEnabled"]})
            if not settings["suggestionsEnabled"]:
                return OFF
        return render_on(settings, stamp)


def render_on(settings: dict, stamp: datetime) -> str:
    local = stamp.astimezone(ZoneInfo(settings["timezone"]))
    return (
        f"Calendar automatic suggestions: ON for this conversation. Current local time: {local.isoformat(timespec='minutes')} "
        f"({settings['timezone']}). This state overrides earlier OFF instructions. "
        "Answer the user's actual request first. Only if the conversation reveals a concrete FUTURE deadline, preparation need, "
        "or follow-up that benefits from a calendar slot, call propose_schedule_draft for ONE useful review draft, "
        "without requiring a calendar request. Use a short action title, explicit ISO offset, timezone and one-sentence reason. "
        "Include deadlineDate (YYYY-MM-DD) when the deadline is known; do not invent one. "
        "Pick a reasonable recommended time before the deadline when enough context is given; never claim you checked availability. "
        "If the date is ambiguous ask one short question instead of inventing it. Do not propose for casual talk, past events, "
        "completed work, or previously dismissed/duplicate ideas. The tool checks the live toggle and limits frequency. "
        "After created, append only one short sentence suggesting the time and a link to /apps/crew-calendar?view=drafts . "
        "After disabled/cooldown/duplicate/dismissed, do not repeat a calendar suggestion. "
        "These are local review drafts ONLY. External writes require separate user review and separate confirmation in Calendar; never claim these tools registered an event or reminder. "
        "An explicit request to save a draft uses create_schedule_draft, never relabel an unsolicited suggestion as explicit."
    )
