"""Settings validation and updates, independent of JSON files and Crew runtime."""
from __future__ import annotations
import re
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from .domain import DraftError, StorageUnavailable
from .repository import Repository
# Session references are opaque to the domain. The host adapter validates
# which existing conversations can be selected through its UI/API.
_SESSION_RE = re.compile(r"^[^\s\x00-\x1f]{1,300}$")

class SettingsService:
    def __init__(self, repository: Repository):
        self.repository = repository

    def read(self) -> dict[str, Any]:
        data = self.repository.load_settings()
        if data is None:
            return {"schemaVersion": 1, "suggestionsEnabled": False, "timezone": "Asia/Seoul", "revision": 0, "sessionKeys": []}
        if (not isinstance(data, dict) or data.get("schemaVersion") != 1
                or type(data.get("suggestionsEnabled")) is not bool
                or type(data.get("revision")) is not int
                or not isinstance(data.get("sessionKeys"), list)
                or len(data["sessionKeys"]) > 100
                or any(not isinstance(k, str) or not _SESSION_RE.fullmatch(k) for k in data["sessionKeys"])):
            raise StorageUnavailable("Settings invalid; automatic proposals are disabled")
        try:
            ZoneInfo(data.get("timezone", ""))
        except (ZoneInfoNotFoundError, TypeError, ValueError) as exc:
            raise StorageUnavailable("Settings timezone invalid") from exc
        return data

    def update(self, changes: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(changes, dict) or not changes or set(changes) - {"suggestionsEnabled", "timezone", "sessionKeys"}:
            raise DraftError("Invalid settings fields")
        if "suggestionsEnabled" in changes and type(changes["suggestionsEnabled"]) is not bool:
            raise DraftError("suggestionsEnabled must be boolean")
        if "sessionKeys" in changes:
            keys = changes["sessionKeys"]
            if not isinstance(keys, list) or len(keys) > 100 or any(not isinstance(k, str) or not _SESSION_RE.fullmatch(k) for k in keys):
                raise DraftError("Invalid conversation reference")
        if "timezone" in changes:
            try:
                ZoneInfo(changes["timezone"])
            except (ZoneInfoNotFoundError, TypeError, ValueError) as exc:
                raise DraftError("Invalid timezone") from exc
        with self.repository.transaction():
            previous = self.read()
            settings = {**previous, **changes, "revision": previous["revision"] + 1}
            settings["sessionKeys"] = list(dict.fromkeys(settings["sessionKeys"]))
            if settings["suggestionsEnabled"] and not settings["sessionKeys"]:
                raise DraftError("Select a conversation before enabling suggestions")
            self.repository.save_settings(settings)
            return settings
