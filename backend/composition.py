"""The only production binding from use cases to JSON storage."""

from __future__ import annotations
from pathlib import Path
from .repository import JsonRepository
from .settings import SettingsService
from .application import DraftService
from .hook_context import SuggestionContextService


class Services:
    def __init__(self, data_dir: Path | str):
        self.repository = JsonRepository(data_dir)
        self.settings = SettingsService(self.repository)
        self.drafts = DraftService(self.repository)
        self.contexts = SuggestionContextService(self.repository, self.settings)

    def calendar(self):
        from .calendar_service import CalendarService
        from .calendar_storage import CalendarStorage
        from .apple_provider import AppleCalendarProvider
        from .calendar_connections import CalendarConnection, CalendarConnections

        root = self.repository.data_dir
        connections = CalendarConnections(
            [
                CalendarConnection(
                    "apple-local",
                    "apple",
                    "Apple Calendar",
                    AppleCalendarProvider(root.parent, root),
                    system_name="appleLocal",
                ),
            ]
        )
        return CalendarService(
            self.repository,
            CalendarStorage(root),
            connections,
        )

    def conversation_schedule(self):
        from .conversation_schedule import ConversationSchedule
        from .host import app_active_for

        return ConversationSchedule(self.calendar().items, app_active_for)
