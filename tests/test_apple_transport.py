"""Request transport lifetime is independent of the durable save journal."""

import json
import platform
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from support import load

apple = load("apple_provider")


@unittest.skipUnless(platform.system() == "Darwin", "native transport is macOS-only")
class AppleTransportTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.provider = apple.AppleCalendarProvider(
            self.root / "app", self.root / "data"
        )
        executable = self.provider.bundle / "Contents/MacOS/CrewCalendarBridge"
        executable.parent.mkdir(parents=True)
        executable.touch()

    def folders(self):
        return list((self.root / "data/native-requests").iterdir())

    def invoke(self, launch):
        with patch.object(apple.subprocess, "run", side_effect=launch) as run:
            try:
                return self.provider.create(
                    {"payload": {"title": "Private", "notes": "Details"}}
                )
            finally:
                self.assertEqual(run.call_count, 1)

    def test_response_survives_until_reader_consumes_it_then_folder_is_removed(self):
        def launch(args, **kwargs):
            import fcntl

            request = Path(args[-1])
            self.assertEqual(
                json.loads(request.read_text())["operation"]["payload"]["title"],
                "Private",
            )
            with (request.parent / ".waiter.lock").open("rb") as second:
                with self.assertRaises(BlockingIOError):
                    fcntl.flock(second, fcntl.LOCK_EX | fcntl.LOCK_NB)
            request.with_name("response.json").write_text('{"state":"cancelled"}')

        self.assertEqual(self.invoke(launch), {"state": "cancelled"})
        self.assertEqual(self.folders(), [])

    def test_launch_failure_removes_payload_without_claiming_no_write(self):
        with self.assertRaises(apple.CalendarError) as error:
            self.invoke(lambda *a, **kw: subprocess.CompletedProcess(a, 1))
        self.assertEqual(error.exception.code, "outcome_unknown")
        self.assertEqual(self.folders(), [])

    def test_timeout_removes_payload_but_leaves_late_response_destination(self):
        def launch(*args, **kwargs):
            raise subprocess.TimeoutExpired("open", 150)

        with self.assertRaises(apple.CalendarError) as error:
            self.invoke(launch)
        self.assertEqual(error.exception.code, "outcome_unknown")
        (folder,) = self.folders()
        self.assertEqual([p.name for p in folder.iterdir()], [".waiter.lock"])
        import fcntl

        with (folder / ".waiter.lock").open("rb") as waiter:
            fcntl.flock(waiter, fcntl.LOCK_EX | fcntl.LOCK_NB)

    def test_response_at_timeout_is_cleaned_without_retry(self):
        def launch(args, **kwargs):
            Path(args[-1]).with_name("response.json").write_text(
                '{"state":"cancelled"}'
            )
            raise subprocess.TimeoutExpired("open", 150)

        with self.assertRaises(apple.CalendarError):
            self.invoke(launch)
        self.assertEqual(self.folders(), [])
