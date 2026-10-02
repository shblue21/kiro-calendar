"""Run with Crew's bundled Python for the aiohttp route tests."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
import routes
try:
    import aiohttp
except ImportError:
    aiohttp = None

class Request:
    def __init__(self, body=None):
        self.body = body
        normal = dict(blocks_reads=False, _ephemeral=False, memory_mode="persistent", mode="", title="Test chat")
        self.app = {"state": SimpleNamespace(_slots={
            "chat-test": SimpleNamespace(**normal),
            "chat-private": SimpleNamespace(**{**normal, "memory_mode": "incognito"}),
        })}
    async def json(self): return self.body

@unittest.skipUnless(aiohttp, "Requires Crew's bundled aiohttp runtime")
class SettingsRoutesTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.ctx = SimpleNamespace(data_dir=Path(self.tmp.name))
        self.host = routes._module("host")
        self.patch = patch.object(self.host, "connection_info", return_value={"status": "ready"})
        self.patch.start()
    async def asyncTearDown(self):
        self.patch.stop(); self.tmp.cleanup()
    async def test_get_excludes_private_chats(self):
        response = await routes.settings_get(Request(), self.ctx)
        data = json.loads(response.text)
        self.assertEqual(data["chats"], [{"sessionKey":"dashboard:chat-test", "title":"Test chat"}])
        self.assertFalse(data["settings"]["suggestionsEnabled"])
    async def test_toggle_roundtrip_and_unconfigured_enable_refusal(self):
        scope = await routes.settings_put(Request({"sessionKeys":["dashboard:chat-test"]}), self.ctx)
        self.assertEqual(scope.status, 200)
        self.host.connection_info.return_value = {"status":"unconfigured"}
        response = await routes.settings_put(Request({"suggestionsEnabled":True}), self.ctx)
        self.assertEqual(response.status, 409)
        self.host.connection_info.return_value = {"status":"ready"}
        response = await routes.settings_put(Request({"suggestionsEnabled":True}), self.ctx)
        self.assertTrue(json.loads(response.text)["settings"]["suggestionsEnabled"])
        response = await routes.settings_put(Request({"suggestionsEnabled":False}), self.ctx)
        self.assertFalse(json.loads(response.text)["settings"]["suggestionsEnabled"])
    async def test_private_scope_rejected(self):
        response = await routes.settings_put(Request({"sessionKeys":["dashboard:chat-private"]}), self.ctx)
        self.assertEqual(response.status, 400)
    async def test_corruption_is_error_not_empty_off(self):
        (self.ctx.data_dir / "settings.json").write_text("oops")
        response = await routes.settings_get(Request(), self.ctx)
        self.assertEqual(response.status, 503)

    async def test_closed_selections_can_be_removed_or_retained_while_adding(self):
        store = routes._services(self.ctx).settings
        for keys in [["dashboard:chat-old-b"], ["dashboard:chat-old-a"],
                     ["dashboard:chat-old-a", "dashboard:chat-old-b", "dashboard:chat-test"]]:
            store.update({"sessionKeys":["dashboard:chat-old-a", "dashboard:chat-old-b"]})
            response = await routes.settings_put(Request({"sessionKeys":keys}), self.ctx)
            self.assertEqual(response.status, 200)
            self.assertEqual(json.loads(response.text)["settings"]["sessionKeys"], keys)
        response = await routes.settings_put(Request({"sessionKeys":["dashboard:chat-not-selected"]}), self.ctx)
        self.assertEqual(response.status, 400)

    async def test_null_settings_reports_unavailable_and_put_preserves_it(self):
        path = self.ctx.data_dir / "settings.json"
        path.write_text("null")
        response = await routes.settings_get(Request(), self.ctx)
        self.assertEqual(response.status, 503)
        response = await routes.settings_put(Request({"suggestionsEnabled": False}), self.ctx)
        self.assertEqual(response.status, 503)
        self.assertEqual(path.read_text(), "null")
