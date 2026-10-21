"""Owner-only settings endpoints and calendar route registration."""

from __future__ import annotations
import asyncio
from typing import Any
from . import domain, host, calendar_routes
from .composition import Services


def _chats(request: Any) -> list[dict]:
    return host.eligible_chats(request)


def _services(ctx: Any):
    return Services(ctx.data_dir)


async def settings_get(request: Any, ctx: Any) -> Any:
    from aiohttp import web
    from kiro_crew.dashboard.handlers._shared import require_owner_dashboard_request

    denied = await require_owner_dashboard_request(request, "crew-calendar.settings")
    if denied is not None:
        return denied

    try:
        settings = await asyncio.to_thread(_services(ctx).settings.read)
        hook = await asyncio.to_thread(host.connection_info)
        chats = _chats(request)
    except (domain.DraftError, OSError, AttributeError, KeyError):
        return web.json_response({"error": "Settings unavailable"}, status=503)
    return web.json_response({"settings": settings, "hook": hook, "chats": chats})


async def settings_put(request: Any, ctx: Any) -> Any:
    from aiohttp import web
    from kiro_crew.dashboard.handlers._shared import require_owner_dashboard_request

    denied = await require_owner_dashboard_request(request, "crew-calendar.settings")
    if denied is not None:
        return denied

    try:
        body = await request.json()
        if not isinstance(body, dict):
            raise domain.DraftError("Invalid settings")
        chats = _chats(request)
        keys = body.get("sessionKeys")
        if keys is not None:
            allowed = {row["sessionKey"] for row in chats}
            previous = await asyncio.to_thread(_services(ctx).settings.read)
            retained = set(previous["sessionKeys"])
            # Closed/private former selections must remain removable. Only NEW
            # entries must still be eligible; persistence guards recheck privacy.
            if not isinstance(keys, list) or any(
                not isinstance(k, str) or k not in allowed | retained for k in keys
            ):
                raise domain.DraftError("Choose an open regular conversation")
        hook = await asyncio.to_thread(host.connection_info)
        if body.get("suggestionsEnabled") is True and hook["status"] != "ready":
            return web.json_response(
                {"error": "Connect the Calendar hook before enabling"}, status=409
            )
        settings = await asyncio.to_thread(_services(ctx).settings.update, body)
    except (domain.StorageUnavailable, OSError):
        return web.json_response({"error": "Settings were not saved"}, status=503)
    except (domain.DraftError, ValueError) as exc:
        return web.json_response({"error": str(exc)}, status=400)
    except (AttributeError, KeyError):
        return web.json_response({"error": "Settings were not saved"}, status=503)
    return web.json_response({"settings": settings, "hook": hook, "chats": chats})


def register_routes(ctx: Any) -> list[Any]:
    from kiro_crew.apps.route_registry import AppRoute

    return [
        AppRoute("GET", "/settings", settings_get),
        AppRoute("PUT", "/settings", settings_put),
    ] + calendar_routes.routes()
