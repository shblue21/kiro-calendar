"""Unified item lifecycle and durable migration, including interrupted writes/replays."""

import copy
import json
import sys
import tempfile
import unittest
import uuid
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from runtime import load
from test_calendar import FIELDS, ORIGIN, Provider, registry

Services = load("composition").Services
CalendarService = load("calendar_service").CalendarService
CalendarStorage = load("calendar_storage").CalendarStorage
CalendarError = load("calendar_domain").CalendarError
StorageUnavailable = load("domain").StorageUnavailable
CREW = {"connectionId": "crew", "calendarId": "default"}


class EventTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.services = Services(self.temp.name)
        self.service = CalendarService(
            self.services.drafts, CalendarStorage(self.temp.name), registry(Provider())
        )

    def tearDown(self):
        self.temp.cleanup()

    def fields(self, **extra):
        return {
            **FIELDS,
            "notes": "memo",
            "destination": CREW,
            "requestId": str(uuid.uuid4()),
            **extra,
        }

    def create(self):
        return self.service.items.create(self.fields())

    def test_direct_creation_is_confirmed_without_draft_or_external_operation(self):
        item = self.create()
        self.assertEqual(item["status"], "confirmed")
        self.assertEqual(item["source"], "direct")
        self.assertEqual(item["destination"], CREW)
        self.assertEqual(self.service.list_drafts(), [])
        self.assertEqual(self.service.storage.operations(), [])
        with self.assertRaises(CalendarError):
            self.service.dismiss(item["id"])
        self.assertEqual(Services(self.temp.name).repository.get_item(item["id"]), item)

    def test_same_create_request_concurrently_creates_once(self):
        fields = self.fields()
        with ThreadPoolExecutor(max_workers=6) as pool:
            results = list(
                pool.map(lambda _: self.service.items.create(fields), range(6))
            )
        self.assertEqual(len({r["id"] for r in results}), 1)
        self.assertEqual(len(self.services.repository.items()), 1)
        with self.assertRaises(CalendarError):
            self.service.items.create({**fields, "title": "different"})

    def test_creation_retry_never_overwrites_edit_or_resurrects_deleted_event(self):
        fields = self.fields()
        item = self.service.items.create(fields)
        edited = self.service.items.edit(
            item["id"], {**FIELDS, "revision": 1, "title": "Updated"}
        )
        deleted = self.service.items.set_deleted(
            item["id"], {"revision": edited["revision"]}, True
        )
        repeated = self.service.items.create(fields)
        self.assertEqual(repeated, deleted)
        self.assertEqual(repeated["title"], "Updated")
        self.assertTrue(repeated["deletedAt"])

    def test_accept_same_id_preserves_origin_and_is_replay_safe(self):
        proposed = self.services.drafts.create(FIELDS, ORIGIN)[0]
        fields = self.fields(revision=1)
        item = self.service.items.accept(proposed["id"], fields)
        self.assertEqual(item["id"], proposed["id"])
        self.assertEqual(item["origin"], ORIGIN | {"sessionType": "unknown"})
        self.assertEqual(item["status"], "confirmed")
        self.assertEqual(item["revision"], 2)
        self.assertEqual(self.service.items.accept(proposed["id"], fields), item)
        self.assertEqual(len(self.services.repository.items()), 1)
        self.assertEqual(self.service.list_drafts(), [])
        with self.assertRaises(CalendarError):
            self.service.items.accept(proposed["id"], {**fields, "title": "other"})

    def test_stale_concurrent_edit_delete_and_restore(self):
        item = self.create()
        edited = self.service.items.edit(
            item["id"], {**FIELDS, "title": "Updated", "revision": 1}
        )
        with self.assertRaises(CalendarError):
            self.service.items.edit(item["id"], {**FIELDS, "revision": 1})
        with self.assertRaises(CalendarError):
            self.service.items.set_deleted(item["id"], {"revision": 1}, True)
        deleted = self.service.items.set_deleted(
            item["id"], {"revision": edited["revision"]}, True
        )
        with self.assertRaises(CalendarError):
            self.service.items.edit(
                item["id"], {**FIELDS, "revision": deleted["revision"]}
            )
        restored = self.service.items.set_deleted(
            item["id"], {"revision": deleted["revision"]}, False
        )
        self.assertFalse(restored["deletedAt"])
        self.assertEqual(restored["title"], "Updated")
        with self.assertRaises(CalendarError):
            self.service.items.set_deleted(
                item["id"], {"revision": deleted["revision"]}, False
            )

    def test_failed_record_write_does_not_accept_proposal(self):
        proposed = self.services.drafts.create(FIELDS, ORIGIN)[0]
        with patch.object(
            self.services.repository,
            "save_item",
            side_effect=StorageUnavailable("disk full"),
        ):
            with self.assertRaises(StorageUnavailable):
                self.service.items.accept(proposed["id"], self.fields(revision=1))
        self.assertEqual(
            self.services.repository.get_item(proposed["id"])["status"], "proposed"
        )

    def test_external_destination_never_falls_back_and_has_independent_delivery(self):
        with self.assertRaises(CalendarError):
            self.service.items.create(
                self.fields(destination={"connectionId": "gone", "calendarId": "x"})
            )
        self.assertEqual(self.services.repository.items(), [])
        target = {"connectionId": "primary", "calendarId": "a"}
        item = self.service.items.create(self.fields(destination=target))
        op = self.service.prepare(
            {"draftId": item["id"], "revision": 1, "target": target}
        )
        self.service.claim(op["id"])
        result = self.service.execute_claimed(op["id"])
        self.assertEqual(result["state"], "confirmed")
        self.assertEqual(
            self.services.repository.get_item(item["id"])["destination"], target
        )
        with self.assertRaises(CalendarError):
            self.service.items.edit(item["id"], {**FIELDS, "revision": 1})
        with self.assertRaises(CalendarError):
            self.service.items.set_deleted(item["id"], {"revision": 1}, True)

    def test_existing_uncertain_operation_blocks_proposal_acceptance(self):
        proposed = self.services.drafts.create(FIELDS, ORIGIN)[0]
        op = self.service.prepare(
            {
                "draftId": proposed["id"],
                "revision": 1,
                "target": {"connectionId": "primary", "calendarId": "a"},
            }
        )
        self.service.claim(op["id"])
        with self.assertRaises(CalendarError):
            self.service.items.accept(proposed["id"], self.fields(revision=1))

    def test_preferences_do_not_couple_display_and_destination(self):
        self.assertEqual(
            self.service.storage.preferences(),
            {"defaultDestination": CREW, "showCrew": True},
        )
        self.service.preferences({"showCrew": False})
        self.assertEqual(self.service.storage.preferences()["defaultDestination"], CREW)
        self.service.preferences(
            {"defaultDestination": {"connectionId": "primary", "calendarId": "a"}}
        )
        self.assertFalse(self.service.storage.preferences()["showCrew"])
        with self.assertRaises(CalendarError):
            self.service.preferences(
                {"defaultDestination": {"connectionId": "gone", "calendarId": "a"}}
            )
        self.assertEqual(
            self.service.storage.preferences()["defaultDestination"]["connectionId"],
            "primary",
        )


class MigrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / "drafts").mkdir()
        (self.root / "calendar/operations").mkdir(parents=True)
        self.old = {
            "id": "1" * 16,
            "title": "Old",
            "start": FIELDS["start"],
            "end": FIELDS["end"],
            "timezone": "Asia/Seoul",
            "origin": ORIGIN,
            "source": "manual",
            "status": "proposed",
            "createdAt": "2026-01-01T00:00:00Z",
        }

    def tearDown(self):
        self.temp.cleanup()

    def write(self, item):
        p = self.root / "drafts" / f"{item['id']}.json"
        p.write_text(json.dumps(item))
        return p

    def test_manual_legacy_draft_stays_proposed_and_original_is_backed_up(self):
        p = self.write(self.old)
        original = p.read_bytes()
        services = Services(self.root)
        item = services.repository.get_item(self.old["id"])
        self.assertEqual(item["status"], "proposed")
        self.assertEqual(item["destination"], CREW)
        self.assertEqual(p.read_bytes(), original)
        self.assertEqual(
            (self.root / "calendar/migration-v2-backup/drafts" / p.name).read_bytes(),
            original,
        )
        services.calendar().items.accept(
            item["id"],
            {
                **FIELDS,
                "revision": 1,
                "requestId": str(uuid.uuid4()),
                "destination": CREW,
            },
        )
        self.assertEqual(
            Services(self.root).repository.get_item(item["id"])["status"], "confirmed"
        )

    def test_external_history_and_uncertainty_survive_migration(self):
        for index, state in enumerate(
            ["confirmed", "unknown", "awaiting_confirmation", "failed", "prepared"]
        ):
            key = f"{index+1:016x}"
            self.write({**self.old, "id": key})
            op = {
                "id": f"{index+1:032x}",
                "draftId": key,
                "createdAt": "2026-01-01T00:00:00Z",
                "state": state,
                "target": {"connectionId": "apple-local", "calendarId": "a"},
            }
            (self.root / "calendar/operations" / f"{op['id']}.json").write_text(
                json.dumps(op)
            )
        service = Services(self.root).calendar()
        self.assertTrue(
            all(
                i["status"] == "confirmed"
                and i["destination"]["connectionId"] == "apple-local"
                for i in service.list_items()
            )
        )
        self.assertEqual(
            {i["calendarOperation"]["state"] for i in service.list_items()},
            {"confirmed", "unknown", "awaiting_confirmation", "failed", "prepared"},
        )

    def test_failed_migration_never_publishes_partial_items_and_can_retry(self):
        self.write(self.old)
        corrupt = self.root / "drafts" / ("2" * 16 + ".json")
        corrupt.write_text("broken")
        with self.assertRaises(StorageUnavailable):
            Services(self.root)
        self.assertFalse((self.root / "calendar/items").exists())
        corrupt.write_text(json.dumps({**self.old, "id": "2" * 16}))
        self.assertEqual(len(Services(self.root).repository.items()), 2)
