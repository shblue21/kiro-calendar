"""Core local calendar flows with real file storage."""

import json
import tempfile
import unittest
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch
from support import use_timezone
from support import Services, CalendarError, FIELDS, ORIGIN, load

CREW = {"connectionId": "crew", "calendarId": "default"}
StorageUnavailable = load("domain").StorageUnavailable


class EventTests(unittest.TestCase):
    def setUp(self):
        use_timezone(self)
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.services = Services(self.root)
        self.service = self.services.calendar()

    def fields(self):
        return {
            **FIELDS,
            "notes": "첫 줄\n둘째 줄",
            "destination": CREW,
            "requestId": str(uuid.uuid4()),
        }

    def test_create_edit_delete_restore_and_restart(self):
        fields = self.fields()
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(
                pool.map(lambda _: self.service.items.create(fields), range(4))
            )
        self.assertEqual(len({r["id"] for r in results}), 1)
        item = results[0]
        self.assertEqual(item["status"], "confirmed")
        self.assertEqual(item["notes"], fields["notes"])
        edited = self.service.items.edit(
            item["id"], {**FIELDS, "title": "수정", "revision": 1}
        )
        with self.assertRaises(CalendarError):
            self.service.items.edit(item["id"], {**FIELDS, "revision": 1})
        deleted = self.service.items.set_deleted(
            item["id"], {"revision": edited["revision"]}, True
        )
        self.assertTrue(deleted["deletedAt"])
        self.assertEqual(
            self.service.items.create(fields), deleted
        )  # Replay cannot resurrect.
        restored = self.service.items.set_deleted(
            item["id"], {"revision": deleted["revision"]}, False
        )
        self.assertFalse(restored["deletedAt"])
        self.assertEqual(restored["title"], "수정")
        self.assertEqual(Services(self.root).repository.get_item(item["id"]), restored)

    def test_delivery_faults_do_not_hide_healthy_local_items(self):
        local = self.service.items.create(self.fields())
        legacy = self.root / "calendar/operations"
        legacy.mkdir()
        (legacy / ("a" * 32 + ".json")).write_text("{broken")
        self.assertEqual(len(self.service.list_items()["items"]), 1)
        external = self.services.drafts.create(
            {**FIELDS, "title": "Broken external"}, ORIGIN
        )[0]
        external.update(
            status="confirmed",
            destination={"connectionId": "apple-local", "calendarId": "a"},
            delivery={"state": ["broken"]},
        )
        self.services.repository.save_item(external)
        rows = self.service.list_items()
        broken = next(i for i in rows["items"] if i["id"] == external["id"])
        self.assertEqual(broken["delivery"]["state"], "unavailable")
        self.assertEqual(broken["actions"], [])
        for invalid in [None, [], 42, "invalid timestamp"]:
            with self.subTest(createdAt=invalid):
                self.services.repository.save_item({**external, "createdAt": invalid})
                rows = self.service.list_items()
                self.assertEqual([i["id"] for i in rows["items"]], [local["id"]])
                self.assertEqual(len(rows["errors"]), 1)
                with self.assertRaises(StorageUnavailable):
                    self.services.repository.items(strict=True)
        self.services.repository.item_path(external["id"]).write_text("{broken")
        rows = self.service.list_items()
        self.assertEqual([i["id"] for i in rows["items"]], [local["id"]])
        self.assertEqual(len(rows["errors"]), 1)

    def test_accept_proposal_once_without_changing_identity(self):
        proposal = self.services.drafts.create(FIELDS, ORIGIN)[0]
        fields = {**self.fields(), "revision": 1}
        accepted = self.service.items.accept(proposal["id"], fields)
        self.assertEqual(accepted["id"], proposal["id"])
        self.assertEqual(accepted["origin"], proposal["origin"])
        self.assertEqual(accepted["status"], "confirmed")
        self.assertEqual(self.service.items.accept(proposal["id"], fields), accepted)
        self.assertTrue(
            all(i["status"] != "proposed" for i in self.service.list_items()["items"])
        )
        self.assertEqual(len(self.services.repository.items()), 1)

    def test_disk_failure_preserves_unaccepted_proposal(self):
        proposal = self.services.drafts.create(FIELDS, ORIGIN)[0]
        with patch.object(
            load("repository").os, "replace", side_effect=OSError("disk full")
        ):
            with self.assertRaises(StorageUnavailable):
                self.service.items.accept(
                    proposal["id"], {**self.fields(), "revision": 1}
                )
        self.assertEqual(self.services.repository.get_item(proposal["id"]), proposal)
        self.assertFalse(list(self.services.repository.root.glob(".tmp-*")))

    def test_initial_schema_round_trip_and_version_boundary(self):
        draft = self.services.drafts.create(FIELDS, ORIGIN)[0]
        event = self.service.items.create(self.fields())
        restarted = Services(self.root)
        for item in (draft, event):
            self.assertEqual(item["schemaVersion"], 1)
            self.assertEqual(restarted.repository.get_item(item["id"]), item)
        path = self.services.repository.item_path(event["id"])
        path.write_text(json.dumps({**event, "schemaVersion": 2}))
        with self.assertRaises(StorageUnavailable):
            restarted.repository.get_item(event["id"])
