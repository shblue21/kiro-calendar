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
        self.drafts = DraftService(self.repository, self.settings)
        self.contexts = SuggestionContextService(self.repository, self.settings)
