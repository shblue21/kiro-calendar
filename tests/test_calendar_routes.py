from __future__ import annotations
import asyncio
import json
import tempfile
import unittest
import uuid
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from tests.support import use_timezone, FIELDS, external_calendar, load

routes = load("calendar_routes")
try:
    from aiohttp import web
except ImportError:
    web = None


class Request:
    def __init__(self, body=None, **params):
        self.body = body
        self.match_info = params
        self.query = {}

    async def json(self):
        return self.body


@unittest.skipUnless(web, "aiohttp required")
class CalendarRouteTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        use_timezone(self)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.ctx = SimpleNamespace(data_dir=Path(self.tmp.name))

    async def test_nonowner_cannot_request_access_or_start_native_write(self):
        denied = web.json_response({"error": "owner_only"}, status=403)
        with (
            patch.object(routes, "_owner", AsyncMock(return_value=denied)),
            patch.object(routes, "Services") as services,
        ):
            for endpoint in [
                routes.item_get,
                routes.authorize,
                routes.prepare,
                routes.execute,
                routes.item_create,
                routes.item_edit,
                routes.item_accept,
                routes.item_dismiss,
                routes.item_delete,
                routes.item_restore,
                routes.preferences_put,
            ]:
                result = await endpoint(Request({}, operation_id="a" * 32), self.ctx)
                self.assertEqual(result.status, 403)
            services.assert_not_called()

    async def test_direct_create_route_commits_a_local_event_and_replays(self):
        body = {
            **FIELDS,
            "title": "Direct",
            "destination": {"connectionId": "crew", "calendarId": "default"},
            "requestId": str(uuid.uuid4()),
        }
        with (
            patch.object(routes, "_owner", AsyncMock(return_value=None)),
            patch.object(
                load("apple_provider").AppleCalendarProvider,
                "_request",
                side_effect=AssertionError("No external call"),
            ),
        ):
            first = await routes.item_create(Request(body), self.ctx)
            second = await routes.item_create(Request(body), self.ctx)
            self.assertEqual(first.status, 200)
            self.assertEqual(second.status, 200)
            item = json.loads(first.text)["item"]
            self.assertEqual(item["status"], "confirmed")
            snapshot = await routes.item_get(Request(item_id=item["id"]), self.ctx)
            self.assertEqual(json.loads(snapshot.text)["item"], item)
            self.assertEqual(json.loads(second.text)["item"]["id"], item["id"])
            result = await routes.item_edit(
                Request({**body, "title": "Edited", "revision": 1}, item_id=item["id"]),
                self.ctx,
            )
            self.assertEqual(json.loads(result.text)["item"]["title"], "Edited")
            stale = await routes.item_edit(
                Request({**body, "revision": 1}, item_id=item["id"]), self.ctx
            )
            self.assertEqual(stale.status, 409)

    async def test_lost_execute_response_is_recovered_without_second_provider_write(
        self,
    ):
        _, service, provider = external_calendar(self.tmp.name)
        item = service.items.create(
            {
                **FIELDS,
                "destination": {"connectionId": "primary", "calendarId": "a"},
                "requestId": str(uuid.uuid4()),
            }
        )
        key = item["id"]
        op = service.prepare(key, item["revision"])
        with (
            patch.object(routes, "_owner", AsyncMock(return_value=None)),
            patch.object(
                routes,
                "Services",
                return_value=SimpleNamespace(calendar=lambda: service),
            ),
        ):
            try:
                # Discard the execute response and recover the result through GET.
                await routes.execute(
                    Request(item_id=key, operation_id=op["id"]), self.ctx
                )
                snapshot = await routes.item_get(Request(item_id=key), self.ctx)
                self.assertIn(
                    json.loads(snapshot.text)["item"]["delivery"]["state"],
                    ["awaiting_confirmation", "confirmed"],
                )
                await routes.execute(
                    Request(item_id=key, operation_id=op["id"]), self.ctx
                )
            finally:
                await asyncio.gather(*list(routes._tasks))
            snapshot = await routes.item_get(Request(item_id=key), self.ctx)
            self.assertEqual(
                json.loads(snapshot.text)["item"]["delivery"]["state"], "confirmed"
            )
            self.assertEqual(provider.created, 1)
