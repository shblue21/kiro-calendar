from __future__ import annotations
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from support import Services, load

routes = load("routes")
host = load("host")
try:
    from aiohttp import web
except ImportError:
    web = None


@unittest.skipUnless(web, "aiohttp required")
class SettingsRouteTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.ctx = SimpleNamespace(data_dir=Path(tmp.name))
        self.guard = AsyncMock(return_value=None)
        guard_module = SimpleNamespace(require_owner_dashboard_request=self.guard)
        stub = patch.dict(
            sys.modules, {"kiro_crew.dashboard.handlers._shared": guard_module}
        )
        stub.start()
        self.addCleanup(stub.stop)

    async def test_denied_settings_requests_do_not_read_or_write(self):
        with (
            patch.object(
                routes,
                "_module",
                side_effect=AssertionError("Denied requests must not access app data"),
            ) as modules,
            patch.object(routes, "_services") as services,
            patch.object(routes, "_chats") as chats,
        ):
            for status in (401, 403):
                denied = web.json_response({"error": "owner_only"}, status=status)
                self.guard.return_value = denied
                for endpoint in (routes.settings_get, routes.settings_put):
                    with self.subTest(status=status, endpoint=endpoint.__name__):
                        self.guard.reset_mock()
                        request = SimpleNamespace(json=AsyncMock())
                        result = await endpoint(request, self.ctx)
                        self.assertIs(result, denied)
                        self.guard.assert_awaited_once_with(
                            request, "crew-calendar.settings"
                        )
                        request.json.assert_not_awaited()
            modules.assert_not_called()
            services.assert_not_called()
            chats.assert_not_called()

    async def test_chat_lookup_failure_does_not_commit_settings(self):
        Services(self.ctx.data_dir).settings.update(
            {"sessionKeys": ["dashboard:chat-demo"], "suggestionsEnabled": True}
        )
        settings_file = self.ctx.data_dir / "settings.json"
        before = settings_file.read_bytes()
        with (
            patch.object(host, "connection_info", return_value={"status": "ready"}),
            patch.object(
                routes, "_chats", side_effect=AttributeError("Chat list unavailable")
            ),
        ):
            request = SimpleNamespace(
                json=AsyncMock(return_value={"suggestionsEnabled": False})
            )
            response = await routes.settings_put(request, self.ctx)
            self.assertEqual(response.status, 503)
        self.assertEqual(settings_file.read_bytes(), before)

    async def test_owner_can_save_read_and_remove_conversation_selection(self):
        rows = [{"sessionKey": "dashboard:chat-demo", "title": "Demo conversation"}]
        with (
            patch.object(host, "connection_info", return_value={"status": "ready"}),
            patch.object(routes, "_chats", return_value=rows) as chats,
        ):
            request = SimpleNamespace(
                json=AsyncMock(
                    return_value={
                        "sessionKeys": [rows[0]["sessionKey"]],
                        "suggestionsEnabled": True,
                    }
                )
            )
            chats.side_effect = [rows, AttributeError("A second lookup failed")]
            saved = await routes.settings_put(request, self.ctx)
            self.assertEqual(saved.status, 200)
            chats.side_effect = None
            snapshot = await routes.settings_get(request, self.ctx)
            self.assertEqual(snapshot.status, 200)
            self.assertEqual(json.loads(snapshot.text), json.loads(saved.text))
            body = json.loads(snapshot.text)
            self.assertTrue(body["settings"]["suggestionsEnabled"])
            self.assertEqual(body["settings"]["sessionKeys"], [rows[0]["sessionKey"]])
            self.assertEqual(body["chats"], rows)
            self.assertEqual(body["hook"]["status"], "ready")

            stored = (self.ctx.data_dir / "settings.json").read_bytes()
            request.json.return_value = {"sessionKeys": ["dashboard:chat-other"]}
            rejected = await routes.settings_put(request, self.ctx)
            self.assertEqual(rejected.status, 400)
            self.assertEqual((self.ctx.data_dir / "settings.json").read_bytes(), stored)

            chats.return_value = []  # A closed conversation remains removable.
            request.json.return_value = {"sessionKeys": [], "suggestionsEnabled": False}
            removed = await routes.settings_put(request, self.ctx)
            self.assertEqual(removed.status, 200)
            snapshot = await routes.settings_get(request, self.ctx)
            settings = json.loads(snapshot.text)["settings"]
            self.assertEqual(settings["sessionKeys"], [])
            self.assertFalse(settings["suggestionsEnabled"])
