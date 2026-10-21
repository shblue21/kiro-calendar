"""Small test fixtures: real storage, one fake provider, an explicitly selected timezone."""

from __future__ import annotations
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
from unittest.mock import patch
from backend.runtime import load

ROOT = Path(__file__).resolve().parents[1]

Services = load("composition").Services
CalendarService = load("calendar_service").CalendarService
CalendarStorage = load("calendar_storage").CalendarStorage
CalendarError = load("calendar_domain").CalendarError
TEST_TIMEZONE = "Asia/Seoul"


def use_timezone(test, zone=TEST_TIMEZONE):
    for module in (
        "settings",
        "event_service",
        "calendar_service",
        "conversation_schedule",
    ):
        context = patch.object(load(module), "system_timezone", return_value=zone)
        context.start()
        test.addCleanup(context.stop)


def local_time(value):
    """Attach the fixture's explicitly selected zone to a fixture's local wall time."""
    return (
        datetime.fromisoformat(value)
        .replace(tzinfo=ZoneInfo(TEST_TIMEZONE))
        .isoformat()
    )


FIELDS = {
    "title": "검증 일정",
    "start": local_time("2030-01-02T10:00:00"),
    "end": local_time("2030-01-02T11:00:00"),
    "timezone": TEST_TIMEZONE,
}
ORIGIN = {"sessionKey": "dashboard:chat-test", "identitySource": "test"}


def registry(provider):
    bindings = load("calendar_connections")
    return bindings.CalendarConnections(
        [
            bindings.CalendarConnection("primary", "test", "Test account", provider),
        ]
    )


class Provider:
    """Small boundary fake; storage and the save state machine remain real."""

    def __init__(self):
        self.fail = None
        self.event_override = {}
        self.verify = None
        self.created = 0

    def status(self):
        return {
            "state": "ready",
            "capabilities": {"read": True, "create": True, "reconcile": True},
            "confirmation": {"mode": "app"},
        }

    def calendars(self):
        return [{"id": "a", "title": "일정", "sourceTitle": "개인", "writable": True}]

    def create(self, op):
        self.created += 1
        if self.fail:
            raise self.fail
        return {
            "state": "confirmed",
            "event": {
                "eventId": "remote-1",
                "calendarId": op["target"]["calendarId"],
                **op["payload"],
                "allDay": False,
                "recurring": False,
                **self.event_override,
            },
        }

    def reconcile(self, op):
        return self.verify or {"state": "unknown"}


def external_calendar(root, provider=None):
    """Build services without creating events or owning the caller's temp directory."""
    provider = provider if provider is not None else Provider()
    services = Services(root)
    service = CalendarService(
        services.repository, CalendarStorage(root), registry(provider)
    )
    return services, service, provider
