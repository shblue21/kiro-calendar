"""Per-message context use case; transport and host eligibility are adapters."""
from __future__ import annotations
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from .domain import DraftError
from .repository import Repository
from .settings import SettingsService

OFF = (
    "Calendar automatic suggestions: OFF for this conversation. This replaces earlier calendar suggestion guidance. "
    "Do not proactively suggest events. Explicit user requests may still use the calendar MCP tools."
)


class SuggestionContextService:
    def __init__(self, repository: Repository, settings: SettingsService):
        if settings.repository is not repository:
            raise ValueError("Context and settings must share one repository")
        self.repository = repository
        self.settings = settings

    def for_session(self, session: str, *, active: bool, now: datetime | None = None) -> str:
        with self.repository.transaction():
            previously_enabled = self.repository.was_enabled(session)
            try:
                settings = self.settings.read()
            except DraftError:
                settings = None
            enabled = bool(settings is not None and active
                           and settings["suggestionsEnabled"]
                           and session in settings["sessionKeys"])
            # No ON guidance to cancel, or OFF was already returned for this chat.
            if not enabled and not previously_enabled:
                return ""
            stamp = now or datetime.now(timezone.utc)
            output = render_on(settings, stamp) if enabled else OFF
            self.repository.record_application(session, {
                **({"revision": settings["revision"]} if settings is not None else {}),
                "seenAt": stamp.isoformat(), "enabled": enabled,
            })
            return output


def render_on(settings: dict, stamp: datetime) -> str:
    local = stamp.astimezone(ZoneInfo(settings["timezone"]))
    return (
        f"Calendar automatic suggestions: ON. Current local time: {local.isoformat(timespec='minutes')} "
        f"({settings['timezone']}). This replaces earlier calendar suggestion guidance. "
        "Keep the user's actual request first. Only when reserving time would help a concrete future action, "
        "briefly offer a Crew Calendar slot with [OPTIONS: ...] in the user's language. "
        "Use the clock above to resolve dates; show the exact date, start/end and calendar. "
        "Ask if unclear; do not invent availability. Respect rejection or a change of subject. "
        "Save nothing before agreement or an explicit request. Then use get_schedule_context and "
        "register_schedule, following their tool descriptions."
    )
