import os
import unittest
from pathlib import Path
from unittest.mock import patch
from tests.support import load

module = load("timezone")


class TimezoneTest(unittest.TestCase):
    def test_environment_cannot_override_system_zone(self):
        for zone, override in (
            ("Asia/Seoul", "UTC"),
            ("UTC", "KST-9"),
            ("America/New_York", "Korea"),
            ("Asia/Seoul", ":/some/file"),
        ):
            with (
                self.subTest(zone=zone, override=override),
                patch.dict(os.environ, {"TZ": override}),
                patch.object(module.platform, "system", return_value="Darwin"),
                patch.object(
                    module.Path,
                    "resolve",
                    return_value=Path("/usr/share/zoneinfo") / zone,
                ),
            ):
                self.assertEqual(module.system_timezone(), zone)

    def test_system_timezone_file(self):
        with (
            patch.object(module.platform, "system", return_value="Linux"),
            patch.object(module.Path, "resolve", return_value=Path("/etc/localtime")),
            patch.object(module.Path, "read_text", return_value="Europe/Berlin\n"),
        ):
            self.assertEqual(module.system_timezone(), "Europe/Berlin")

    def test_unreadable_system_zone_does_not_use_environment(self):
        with (
            patch.dict(os.environ, {"TZ": "UTC"}),
            patch.object(module.platform, "system", return_value="Darwin"),
            patch.object(module.Path, "resolve", side_effect=FileNotFoundError),
        ):
            with self.assertRaises(module.StorageUnavailable):
                module.system_timezone()
