"""Behavioral repository contract and dependency-only update regression tests."""
from __future__ import annotations
import contextlib
import copy
import shutil
import sys
import tempfile
import threading
import unittest
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from runtime import load
Services = load("composition").Services
SettingsService = load("settings").SettingsService
DraftService = load("application").DraftService
ProposalPolicy = load("proposal_policy").ProposalPolicy
ProposalDenied = load("domain").ProposalDenied
JsonRepository = load("repository").JsonRepository
DraftNotFound = load("domain").DraftNotFound
StorageUnavailable = load("domain").StorageUnavailable

NOW = datetime(2030, 1, 1, tzinfo=timezone.utc)
ORIGIN = {"sessionKey": "dashboard:chat-contract", "identitySource": "test"}
FIELDS = {"title": "Review", "start": "2030-01-02T19:00:00+09:00", "timezone": "Asia/Seoul",
          "reason": "Prepare", "deadlineDate": "2030-01-03"}


class MemoryRepository:
    """A second adapter, deliberately independent of paths and Crew packages."""
    def __init__(self):
        self.settings = None
        self.records = {}
        self.receipts = {}
        self.lock = threading.Lock()
    @contextlib.contextmanager
    def transaction(self):
        with self.lock: yield
    def load_settings(self): return copy.deepcopy(self.settings)
    def save_settings(self, value): self.settings = copy.deepcopy(value)
    def items(self, *, strict=False): return copy.deepcopy(sorted(self.records.values(), key=lambda d: (d.get("createdAt", ""), d["id"]), reverse=True))
    def session_items(self, session): return [d for d in self.items() if d["origin"]["sessionKey"] == session]
    def save_item(self, value): self.records[value["id"]] = copy.deepcopy(value)
    def get_item(self, key):
        if key not in self.records: raise DraftNotFound("unknown draft id")
        return copy.deepcopy(self.records[key])
    def was_applied(self, session): return session in self.receipts
    def record_application(self, session, value): self.receipts[session] = copy.deepcopy(value)


class ArchitectureTest(unittest.TestCase):
    def test_same_contract_for_memory_and_json_storage(self):
        with tempfile.TemporaryDirectory() as folder:
            for repository in (MemoryRepository(), JsonRepository(folder)):
                with self.subTest(adapter=type(repository).__name__):
                    settings = SettingsService(repository)
                    service = DraftService(repository, settings, clock=lambda: NOW)
                    settings.update({"sessionKeys": [ORIGIN["sessionKey"]], "suggestionsEnabled": True})
                    draft, duplicate = service.create(FIELDS, ORIGIN, proactive=True)
                    self.assertFalse(duplicate)
                    self.assertEqual(draft["createdAt"], NOW.isoformat(timespec="seconds"))
                    service.set_status(draft["id"], "dismissed")
                    repeated, duplicate = service.create(FIELDS, ORIGIN, proactive=True)
                    self.assertTrue(duplicate)
                    self.assertEqual(repeated["status"], "dismissed")
                    settings.update({"suggestionsEnabled": False})
                    with self.assertRaises(ProposalDenied): service.create(FIELDS, ORIGIN, proactive=True)
                    self.assertEqual(len(repository.items()), 1)

    def test_policy_and_clock_are_replaceable_without_host_or_storage_edits(self):
        repository = MemoryRepository()
        settings = SettingsService(repository)
        origin = {"sessionKey": "another-host:conversation-a"}
        settings.update({"sessionKeys": [origin["sessionKey"]], "suggestionsEnabled": True})
        service = DraftService(repository, settings, policy=ProposalPolicy(cooldown_seconds=0), clock=lambda: NOW)
        service.create(FIELDS, origin, proactive=True)
        service.create({**FIELDS, "title": "Another preparation"}, origin, proactive=True)
        self.assertEqual(len(repository.items()), 2)

    def test_services_cannot_accidentally_use_different_transaction_boundaries(self):
        with self.assertRaises(ValueError):
            DraftService(MemoryRepository(), SettingsService(MemoryRepository()))

    def test_standalone_packages_at_different_roots_do_not_share_helpers(self):
        import runpy
        with tempfile.TemporaryDirectory() as folder:
            loaded = []
            for name in ("first", "second"):
                root = Path(folder) / name
                root.mkdir()
                shutil.copyfile(ROOT / "backend/runtime.py", root / "runtime.py")
                (root / "dependency.py").write_text(f'VALUE = "{name}"\n')
                (root / "entry.py").write_text('from .dependency import VALUE\n')
                loaded.append(runpy.run_path(str(root / "runtime.py"))["load"]("entry"))
            self.assertEqual([entry.VALUE for entry in loaded], ["first", "second"])
            self.assertNotEqual(loaded[0].__package__, loaded[1].__package__)

    def test_item_store_reads_legacy_schema_without_rewriting(self):
        import json
        with tempfile.TemporaryDirectory() as folder:
            services = Services(folder)
            legacy = {"id": "1234567890123456", "schemaVersion": 1, "title": FIELDS["title"],
                      "start": FIELDS["start"], "end": None, "timezone": "Asia/Seoul", "reason": "",
                      "origin": ORIGIN, "status": "dismissed", "createdAt": NOW.isoformat()}
            services.repository.root.mkdir(parents=True)
            path = services.repository.root / (legacy["id"] + ".json")
            path.write_text(json.dumps(legacy))
            before = path.read_bytes()
            draft, duplicate = Services(folder).drafts.create(FIELDS, ORIGIN)
            self.assertTrue(duplicate)
            self.assertEqual(draft["id"], legacy["id"])
            self.assertEqual(path.read_bytes(), before)

    def test_null_settings_is_corruption_not_first_install_and_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "settings.json"
            service = Services(folder).settings
            self.assertFalse(service.read()["suggestionsEnabled"])
            for content in ("null", "[]", '"text"', "123"):
                path.write_text(content)
                with self.assertRaises(StorageUnavailable): service.read()
                with self.assertRaises(StorageUnavailable):
                    service.update({"sessionKeys": [ORIGIN["sessionKey"]], "suggestionsEnabled": True})
                self.assertEqual(path.read_text(), content)

    def test_adapters_share_not_found_order_and_detached_read_contract(self):
        with tempfile.TemporaryDirectory() as folder:
            for repository in (MemoryRepository(), JsonRepository(folder)):
                with self.subTest(adapter=type(repository).__name__):
                    with self.assertRaises(DraftNotFound): repository.get_item("0000000000000000")
                    service = DraftService(repository, SettingsService(repository), clock=lambda: NOW)
                    for title in ("First", "Second", "Third"):
                        service.create({**FIELDS, "title": title}, ORIGIN)
                    records = repository.items(strict=True)
                    self.assertEqual([d["id"] for d in records], sorted([d["id"] for d in records], reverse=True))
                    self.assertEqual(repository.session_items(ORIGIN["sessionKey"]), records)
                    records[0]["title"] = "mutated without save"
                    self.assertNotEqual(repository.get_item(records[0]["id"])["title"], records[0]["title"])

    def test_failed_atomic_write_raises_storage_error_and_preserves_previous_record(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as folder:
            services = Services(folder)
            services.settings.update({"sessionKeys": [ORIGIN["sessionKey"]]})
            path = Path(folder) / "settings.json"
            before = path.read_bytes()
            with patch.object(load("repository").os, "replace", side_effect=OSError("disk failure")):
                with self.assertRaises(StorageUnavailable): services.settings.update({"suggestionsEnabled": True})
            self.assertEqual(path.read_bytes(), before)
            self.assertFalse(list(Path(folder).glob(".tmp-*")))
