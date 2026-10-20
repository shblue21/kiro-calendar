"""External save flows with real persistence and a fake calendar boundary."""

from __future__ import annotations
import json
import tempfile
import unittest
import uuid
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from threading import Event
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from unittest.mock import patch
from support import use_timezone
from support import (
    Services,
    CalendarService,
    CalendarStorage,
    CalendarError,
    FIELDS,
    registry,
    external_calendar,
    load,
    local_time,
)


class CalendarTest(unittest.TestCase):
    def setUp(self):
        use_timezone(self)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.services, self.service, self.provider = external_calendar(self.tmp.name)
        self.item = self.service.items.create(
            {
                **FIELDS,
                "destination": {"connectionId": "primary", "calendarId": "a"},
                "requestId": str(uuid.uuid4()),
            }
        )

    def prepare(self):
        return self.service.prepare(self.item["id"], self.item["revision"])

    def test_connection_selection_persistence_and_schema_boundary(self):
        self.assertEqual(
            self.service.storage.connection("primary"), {"selectedCalendarIds": []}
        )
        target = {"connectionId": "primary", "calendarId": "a"}
        self.service.preferences({"defaultDestination": target})
        self.service.select({"connectionId": "primary", "selectedCalendarIds": ["a"]})
        storage = CalendarStorage(self.tmp.name)
        self.assertEqual(storage.connection("primary"), {"selectedCalendarIds": ["a"]})
        self.assertEqual(storage.preferences()["defaultDestination"], target)
        path = Path(self.tmp.name) / "calendar/connections.json"
        expected = {
            "schemaVersion": 1,
            "connections": {"primary": {"selectedCalendarIds": ["a"]}},
        }
        self.assertEqual(json.loads(path.read_text()), expected)
        for version in [None, 2, True, "1"]:
            with self.subTest(version=version):
                value = {**expected, "schemaVersion": version}
                if version is None:
                    del value["schemaVersion"]
                original = json.dumps(value)
                path.write_text(original)
                with self.assertRaises(load("domain").StorageUnavailable):
                    storage.connection("primary")
                with self.assertRaises(load("domain").StorageUnavailable):
                    storage.save_connection("primary", {"selectedCalendarIds": []})
                self.assertEqual(path.read_text(), original)

    def test_prepare_resolves_provider_once_and_execute_rechecks_permission(self):
        with (
            patch.object(self.provider, "status", wraps=self.provider.status) as status,
            patch.object(
                self.provider, "calendars", wraps=self.provider.calendars
            ) as calendars,
        ):
            op = self.prepare()
            self.assertEqual(status.call_count, 1)
            self.assertEqual(calendars.call_count, 1)
        self.service.claim(self.item["id"], op["id"])
        denied = {**self.provider.status(), "state": "denied"}
        with patch.object(self.provider, "status", return_value=denied) as status:
            result = self.service.execute_claimed(self.item["id"], op["id"])
            self.assertEqual(status.call_count, 1)
        self.assertEqual(result["state"], "failed")
        self.assertEqual(self.provider.created, 0)

    def test_confirmation_copy_is_not_part_of_execution_identity(self):
        op = self.prepare()
        self.assertEqual(op["confirmation"], {"mode": "app"})
        # Existing stored requests can contain display fields; only mode is semantic.
        item = self.service.repository.get_item(self.item["id"])
        item["delivery"]["confirmation"].update(
            actionLabel="Old label", pendingMessage="Old copy"
        )
        self.service.repository.save_item(item)
        state = self.provider.status()
        state["confirmation"].update(actionLabel="New label", pendingMessage="New copy")
        with patch.object(self.provider, "status", return_value=state):
            self.assertEqual(self.prepare()["id"], op["id"])
            self.service.claim(self.item["id"], op["id"])
            self.assertEqual(
                self.service.execute_claimed(self.item["id"], op["id"])["state"],
                "confirmed",
            )
        self.assertEqual(self.provider.created, 1)

    def test_confirmation_mode_change_still_blocks_execution(self):
        op = self.prepare()
        self.service.claim(self.item["id"], op["id"])
        state = self.provider.status()
        state["confirmation"] = {"mode": "provider"}
        with patch.object(self.provider, "status", return_value=state):
            result = self.service.execute_claimed(self.item["id"], op["id"])
        self.assertEqual(result["state"], "failed")
        self.assertEqual(result["error"]["code"], "connection_changed")
        self.assertEqual(self.provider.created, 0)

    def test_text_limits_count_code_points(self):
        domain = load("calendar_domain")
        for title in ["a" * 120, "😀" * 120, "e\u0301" * 60]:
            with self.subTest(title=title):
                value = domain.event_payload(
                    {**FIELDS, "title": title, "notes": "😀" * 2000}
                )
                self.assertEqual(value["title"], title)
                with self.assertRaises(ValueError):
                    domain.event_payload({**FIELDS, "title": title + "a"})
        with self.assertRaises(ValueError):
            domain.event_payload({**FIELDS, "notes": "😀" * 2001})

    def test_concurrent_claims_only_one_executes(self):
        op = self.prepare()
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(
                pool.map(
                    lambda _: self.service.claim(self.item["id"], op["id"]), range(4)
                )
            )
        self.assertEqual(sum(claimed for _, claimed in results), 1)
        result = self.service.execute_claimed(self.item["id"], op["id"])
        self.assertEqual(result["state"], "confirmed")
        with self.assertRaises(CalendarError):
            self.prepare()
        with self.assertRaises(CalendarError):
            self.service.items.dismiss(
                self.item["id"], {"revision": self.item["revision"]}
            )
        self.assertFalse(self.service.claim(self.item["id"], op["id"])[1])
        self.assertEqual(self.provider.created, 1)

    def test_interrupted_claim_recovers_only_after_provider_seals_old_operation(self):
        op = self.prepare()
        self.assertTrue(self.service.claim(self.item["id"], op["id"])[1])
        # Restart after claim, before dispatch. The frozen intent remains immutable.
        self.service = CalendarService(
            Services(self.tmp.name).repository,
            CalendarStorage(self.tmp.name),
            registry(self.provider),
        )
        self.assertFalse(self.service.claim(self.item["id"], op["id"])[1])
        with self.assertRaises(CalendarError):
            self.prepare()
        self.provider.verify = {"state": "cancelled"}
        result = self.service.reconcile(self.item["id"], op["id"])
        self.assertEqual(result["state"], "cancelled")
        # A delayed worker does not dispatch an already cancelled operation.
        self.assertEqual(
            self.service.execute_claimed(self.item["id"], op["id"])["state"],
            "cancelled",
        )
        self.assertEqual(self.provider.created, 0)
        fresh = self.prepare()
        self.assertNotEqual(fresh["id"], op["id"])
        self.assertTrue(self.service.claim(self.item["id"], fresh["id"])[1])
        self.assertEqual(
            self.service.execute_claimed(self.item["id"], fresh["id"])["state"],
            "confirmed",
        )
        self.assertEqual(self.provider.created, 1)

    def test_external_event_projection_preserves_origin_and_partial_warnings(self):
        op = self.prepare()
        self.service.claim(self.item["id"], op["id"])
        result = self.service.execute_claimed(self.item["id"], op["id"])
        self.service.select({"connectionId": "primary", "selectedCalendarIds": ["a"]})
        self.provider.events = lambda *_: {
            "events": [
                {
                    **result["event"],
                    "start": local_time("2030-01-02T12:00:00"),
                    "end": local_time("2030-01-02T13:00:00"),
                }
            ]
        }
        linked = self.service.events("2030-01-01T00:00:00Z", "2030-01-04T00:00:00Z")[
            "events"
        ][0]
        self.assertEqual(linked["itemId"], self.item["id"])
        self.assertEqual(linked["origin"], self.item["origin"])
        self.assertEqual(
            linked["connectionName"], {"kind": "custom", "text": "Test account"}
        )
        warnings = [
            {"calendarId": "a", "code": "events_truncated", "limit": 5000},
            {"calendarId": "b", "code": "calendar_missing"},
        ]
        self.provider.events = lambda *_: {
            "events": [result["event"]],
            "errors": warnings,
            "truncated": True,
        }
        partial = self.service.events("2030-01-01T00:00:00Z", "2030-01-04T00:00:00Z")
        self.assertEqual(len(partial["events"]), 1)
        self.assertEqual(
            partial["errors"], [{**w, "connectionId": "primary"} for w in warnings]
        )
        self.assertEqual(
            self.services.calendar().connections.get("apple-local").display_name(),
            {"kind": "system", "key": "appleLocal"},
        )

    def test_stale_reconcile_cannot_undo_terminal_cancellation_or_failure(self):
        # A read started before completion cannot undo terminal cancellation/failure.
        for terminal in ["cancelled", "failed"]:
            with self.subTest(terminal=terminal):
                self.item = self.service.items.create(
                    {
                        **FIELDS,
                        "destination": {"connectionId": "primary", "calendarId": "a"},
                        "requestId": str(uuid.uuid4()),
                    }
                )
                op = self.prepare()
                self.service.claim(self.item["id"], op["id"])
                entered, release = Event(), Event()

                def stale_read(_):
                    entered.set()
                    release.wait(5)
                    return {"state": "unknown"}

                self.provider.reconcile = stale_read
                self.provider.create = lambda _: {"state": terminal}
                with ThreadPoolExecutor() as pool:
                    future = pool.submit(
                        self.service.reconcile, self.item["id"], op["id"]
                    )
                    try:
                        self.assertTrue(entered.wait(5))
                        self.assertEqual(
                            self.service.execute_claimed(self.item["id"], op["id"])[
                                "state"
                            ],
                            terminal,
                        )
                    finally:
                        release.set()
                    self.assertEqual(future.result()["state"], terminal)
                self.assertIn(
                    "submit",
                    load("entry_policy").actions(
                        self.service.repository.get_item(self.item["id"])
                    ),
                )

    def test_timezone_change_supersedes_prepared_operation(self):
        old = self.prepare()
        target_zone = "UTC" if FIELDS["timezone"] != "UTC" else "America/New_York"
        with patch.object(
            load("calendar_service"), "system_timezone", return_value=target_zone
        ):
            fresh = self.prepare()
            self.assertNotEqual(old["id"], fresh["id"])
            expected_start = (
                datetime.fromisoformat(FIELDS["start"])
                .astimezone(ZoneInfo(target_zone))
                .isoformat()
            )
            self.assertEqual(fresh["payload"]["start"], expected_start)
            self.assertEqual(fresh["payload"]["timezone"], target_zone)
            with self.assertRaises(CalendarError):
                self.service.claim(self.item["id"], old["id"])
            self.assertTrue(self.service.claim(self.item["id"], fresh["id"])[1])

    def test_unknown_outcome_blocks_new_write_and_can_reconcile(self):
        op = self.prepare()
        self.service.claim(self.item["id"], op["id"])
        self.provider.fail = CalendarError(
            "unexpected_provider_error", "failure after dispatch"
        )
        self.assertEqual(
            self.service.execute_claimed(self.item["id"], op["id"])["state"], "unknown"
        )
        self.service = CalendarService(
            Services(self.tmp.name).repository,
            CalendarStorage(self.tmp.name),
            registry(self.provider),
        )
        with self.assertRaises(CalendarError):
            self.service.items.edit(self.item["id"], {**FIELDS, "revision": 1})
        with self.assertRaises(CalendarError):
            self.service.items.dismiss(
                self.item["id"], {"revision": self.item["revision"]}
            )
        with self.assertRaises(CalendarError):
            self.prepare()
        self.assertFalse(self.service.claim(self.item["id"], op["id"])[1])
        self.provider.fail = None
        self.provider.verify = {"state": "cancelled"}
        self.assertEqual(
            self.service.reconcile(self.item["id"], op["id"])["state"], "cancelled"
        )
        removed = self.service.items.set_deleted(
            self.item["id"], {"revision": self.item["revision"]}, True
        )
        self.item = self.service.items.set_deleted(
            self.item["id"], {"revision": removed["revision"]}, False
        )
        corrected = self.service.items.edit(
            self.item["id"],
            {**FIELDS, "revision": self.item["revision"], "title": "Corrected"},
        )
        with self.assertRaises(CalendarError):
            self.service.claim(self.item["id"], op["id"])
        new = self.service.prepare(corrected["id"], corrected["revision"])
        local = self.service.items.edit(
            corrected["id"],
            {
                **FIELDS,
                "revision": corrected["revision"],
                "destination": {"connectionId": "crew", "calendarId": "default"},
            },
        )
        with self.assertRaises(CalendarError):
            self.service.claim(local["id"], new["id"])
        removed = self.service.items.set_deleted(
            local["id"], {"revision": local["revision"]}, True
        )
        self.assertTrue(removed["deletedAt"])

    def test_mismatched_readback_never_reports_confirmed(self):
        for override in [
            {"calendarId": "b"},
            {"start": local_time("2030-01-02T12:00:00")},
            {"notes": "changed"},
            {"recurring": True},
        ]:
            with self.subTest(override=override):
                self.provider.event_override = override
                op = self.prepare()
                self.service.claim(self.item["id"], op["id"])
                result = self.service.execute_claimed(self.item["id"], op["id"])
                self.assertEqual(result["state"], "unknown")
                # Separate event for the next subcase; do not reset an unknown operation.
                self.item = self.service.items.create(
                    {
                        **FIELDS,
                        "title": str(override),
                        "destination": {"connectionId": "primary", "calendarId": "a"},
                        "requestId": str(uuid.uuid4()),
                    }
                )

    def test_readback_compares_instants_at_whole_second_precision(self):
        self.item = self.service.items.create(
            {
                **FIELDS,
                "start": local_time("2030-01-02T10:00:00.123456"),
                "end": local_time("2030-01-02T11:00:00.654321"),
                "destination": {"connectionId": "primary", "calendarId": "a"},
                "requestId": str(uuid.uuid4()),
            }
        )
        self.assertEqual(self.item["start"], local_time("2030-01-02T10:00:00"))
        self.provider.event_override = {
            name: datetime.fromisoformat(self.item[name])
            .astimezone(timezone.utc)
            .isoformat()
            .replace("+00:00", "Z")
            for name in ("start", "end")
        }
        op = self.prepare()
        self.service.claim(self.item["id"], op["id"])
        self.assertEqual(
            self.service.execute_claimed(self.item["id"], op["id"])["state"],
            "confirmed",
        )
        with self.assertRaises(load("domain").DraftError):
            load("calendar_domain").event_payload(
                {
                    **FIELDS,
                    "start": local_time("2030-01-02T10:00:00.100000"),
                    "end": local_time("2030-01-02T10:00:00.900000"),
                }
            )

    def test_external_success_local_record_failure_keeps_write_locked(self):
        op = self.prepare()
        self.service.claim(self.item["id"], op["id"])
        failure = load("domain").StorageUnavailable("disk full")
        with patch.object(self.service.repository, "save_item", side_effect=failure):
            with self.assertRaises(type(failure)):
                self.service.execute_claimed(self.item["id"], op["id"])
        self.assertEqual(
            self.service.get_operation(self.item["id"], op["id"])["state"],
            "awaiting_confirmation",
        )
        self.assertFalse(self.service.claim(self.item["id"], op["id"])[1])
        with self.assertRaises(CalendarError):
            self.prepare()

    def test_native_delivery_envelope_preserves_outcome_and_diagnostics(self):
        import json

        apple = load("apple_provider").AppleCalendarProvider(
            Path(self.tmp.name), Path(self.tmp.name)
        )
        response = {}

        def respond(args, **kwargs):
            Path(args[-1]).with_name("response.json").write_text(json.dumps(response))

        with (
            patch("platform.system", return_value="Darwin"),
            patch("pathlib.Path.is_file", return_value=True),
            patch("subprocess.run", side_effect=respond),
            patch.object(self.provider, "create", side_effect=apple.create),
        ):
            for response, expected in [
                (
                    {
                        "state": "unknown",
                        "error": {
                            "code": "event_changed",
                            "message": "Saved event changed",
                        },
                    },
                    "unknown",
                ),
                (
                    {
                        "state": "failed",
                        "error": {"code": "read_only", "message": "No write occurred"},
                    },
                    "failed",
                ),
                ({"state": "cancelled"}, "cancelled"),
                (
                    {
                        "error": {
                            "code": "unexpected_failure",
                            "message": "No outcome supplied",
                        }
                    },
                    "unknown",
                ),
            ]:
                with self.subTest(response=response):
                    self.item = self.service.items.create(
                        {
                            **FIELDS,
                            "destination": {
                                "connectionId": "primary",
                                "calendarId": "a",
                            },
                            "requestId": str(uuid.uuid4()),
                        }
                    )
                    op = self.prepare()
                    self.service.claim(self.item["id"], op["id"])
                    result = self.service.execute_claimed(self.item["id"], op["id"])
                    self.assertEqual(result["state"], expected)
                    actions = load("entry_policy").actions(
                        self.service.repository.get_item(self.item["id"])
                    )
                    self.assertEqual(
                        "submit" in actions, expected in {"failed", "cancelled"}
                    )
                    if expected == "unknown":
                        with self.assertRaises(CalendarError):
                            self.prepare()
            # A confirmed receipt remains confirmed; changed-event diagnostics are retained.
            response = {
                "state": "confirmed",
                "event": {
                    "eventId": "remote-1",
                    "calendarId": "a",
                    **op["payload"],
                    "allDay": False,
                    "recurring": False,
                },
            }
            with patch.object(self.provider, "reconcile", side_effect=apple.reconcile):
                self.service.reconcile(self.item["id"], op["id"])
                response = {
                    "state": "unknown",
                    "error": {
                        "code": "event_changed",
                        "message": "Changed after saving",
                    },
                }
                result = self.service.reconcile(self.item["id"], op["id"])
                self.assertEqual(result["state"], "confirmed")
                self.assertEqual(result["verification"], response)
