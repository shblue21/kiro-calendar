"""Calendar preferences only. Delivery state lives in its owning item."""
from __future__ import annotations
import json
from pathlib import Path
from .repository import _atomic_json
from .domain import StorageUnavailable


class CalendarStorage:
    def __init__(self, root: Path | str, *, legacy_connection_id: str | None = None):
        self.root = Path(root) / 'calendar'
        self.legacy_connection_id = legacy_connection_id

    def _read(self, path: Path, default=None):
        try:
            value = json.loads(path.read_text(encoding='utf-8'))
            if not isinstance(value, dict):
                raise ValueError()
            return value
        except FileNotFoundError:
            return default
        except (ValueError, OSError) as exc:
            raise StorageUnavailable('Calendar state unavailable') from exc

    def _connections(self) -> dict:
        data = self._read(self.root / 'connections.json', {'connections': {}})
        if not isinstance(data.get('connections'), dict):
            raise StorageUnavailable('Connection settings unavailable')
        return data['connections']

    def connection(self, connection_id: str) -> dict:
        value = self._connections().get(connection_id)
        if value is None and connection_id == self.legacy_connection_id:
            value = self._read(self.root / 'connection.json')
        if value is None:
            return {'selectedCalendarIds': [], 'defaultCalendarId': ''}
        if (not isinstance(value, dict) or not isinstance(value.get('selectedCalendarIds'), list)
                or not isinstance(value.get('defaultCalendarId'), str)):
            raise StorageUnavailable('Connection settings invalid')
        return value

    def save_connection(self, connection_id: str, value: dict) -> None:
        connections = self._connections()
        connections[connection_id] = value
        _atomic_json(self.root / 'connections.json', {'schemaVersion': 1, 'connections': connections})

    def preferences(self) -> dict:
        value = self._read(self.root / 'preferences.json', {
            'defaultDestination': {'connectionId':'crew','calendarId':'default'}, 'showCrew': True})
        target = value.get('defaultDestination')
        if (not isinstance(target, dict) or not isinstance(target.get('connectionId'), str)
                or not isinstance(target.get('calendarId'), str) or type(value.get('showCrew')) is not bool):
            raise StorageUnavailable('Calendar preferences invalid')
        return value

    def save_preferences(self, value: dict) -> None:
        _atomic_json(self.root / 'preferences.json', value)
