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
        from .calendar_migration import migrate
        migrate(self.repository)
        self.settings = SettingsService(self.repository)
        self.drafts = DraftService(self.repository, self.settings)
        self.contexts = SuggestionContextService(self.repository, self.settings)

    def calendar(self):
        from .calendar_service import CalendarService
        from .calendar_storage import CalendarStorage
        from .apple_provider import AppleCalendarProvider
        from .calendar_connections import CalendarConnection, CalendarConnections
        root = self.repository.data_dir
        connections = CalendarConnections([
            CalendarConnection('apple-local', 'apple', 'Apple Calendar · 이 Mac', AppleCalendarProvider(root.parent, root)),
        ])
        return CalendarService(self.drafts, CalendarStorage(root, legacy_connection_id='apple-local'), connections)
