"""App-owned draft/settings endpoints. Hook registration remains a host owner action."""
from __future__ import annotations
import asyncio
import importlib
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any


def _module(name: str) -> Any:
    if __package__:
        # Crew owns this namespace and unloads siblings on app update.
        return importlib.import_module(f"{__package__}.{name}")
    bootstrap = Path(__file__).with_name("runtime.py")
    spec = importlib.util.spec_from_file_location("crew_calendar_bootstrap", bootstrap)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.load(name)


def _view(draft: dict) -> dict:
    origin = draft.get("origin") or {}
    return {**draft, "source": draft.get("source", "manual"),
            "returnTarget": _module("host").return_target(str(origin.get("sessionKey", "")))}


def _chats(request: Any) -> list[dict]:
    return _module("host").eligible_chats(request)


def _services(ctx: Any):
    return _module("composition").Services(ctx.data_dir)


async def list_drafts(request: Any, ctx: Any) -> Any:
    from aiohttp import web
    domain = _module("domain")
    try:
        items = await asyncio.to_thread(lambda: _services(ctx).drafts.list(strict=True))
    except (domain.DraftError, OSError):
        return web.json_response({"error": "Drafts unavailable"}, status=503)
    return web.json_response({"drafts": [_view(d) for d in items]})


async def update_status(request: Any, ctx: Any) -> Any:
    from aiohttp import web
    domain = _module("domain")
    try:
        body = await request.json()
        draft = await asyncio.to_thread(lambda: _services(ctx).drafts.set_status(
            request.match_info.get("draft_id", ""), body.get("status") if isinstance(body, dict) else ""))
    except (domain.StorageUnavailable, OSError):
        return web.json_response({"error": "Draft update failed"}, status=503)
    except (domain.DraftError, ValueError):
        return web.json_response({"error": "Invalid draft update"}, status=400)
    return web.json_response({"draft": _view(draft)})


async def settings_get(request: Any, ctx: Any) -> Any:
    from aiohttp import web
    domain = _module("domain")
    try:
        settings = await asyncio.to_thread(_services(ctx).settings.read)
        hook = await asyncio.to_thread(_module("host").connection_info)
        chats = _chats(request)
    except (domain.DraftError, OSError, AttributeError, KeyError):
        return web.json_response({"error": "Settings unavailable"}, status=503)
    return web.json_response({"settings": settings, "hook": hook, "chats": chats})


async def settings_put(request: Any, ctx: Any) -> Any:
    from aiohttp import web
    domain = _module("domain")
    try:
        body = await request.json()
        if not isinstance(body, dict):
            raise domain.DraftError("Invalid settings")
        keys = body.get("sessionKeys")
        if keys is not None:
            allowed = {row["sessionKey"] for row in _chats(request)}
            previous = await asyncio.to_thread(_services(ctx).settings.read)
            retained = set(previous["sessionKeys"])
            # Closed/private former selections must remain removable. Only NEW
            # entries must still be eligible; persistence guards recheck privacy.
            if not isinstance(keys, list) or any(not isinstance(k, str) or k not in allowed | retained for k in keys):
                raise domain.DraftError("Choose an open regular conversation")
        hook = await asyncio.to_thread(_module("host").connection_info)
        if body.get("suggestionsEnabled") is True and hook["status"] != "ready":
            return web.json_response({"error": "Connect the Calendar hook before enabling"}, status=409)
        settings = await asyncio.to_thread(_services(ctx).settings.update, body)
    except (domain.StorageUnavailable, OSError):
        return web.json_response({"error": "Settings were not saved"}, status=503)
    except (domain.DraftError, ValueError) as exc:
        return web.json_response({"error": str(exc)}, status=400)
    except (AttributeError, KeyError):
        return web.json_response({"error": "Settings were not saved"}, status=503)
    return web.json_response({"settings": settings, "hook": hook, "chats": _chats(request)})


def register_routes(ctx: Any) -> list[Any]:
    from kiro_crew.apps.route_registry import AppRoute
    return [AppRoute("GET", "/drafts", list_drafts),
            AppRoute("POST", "/drafts/{draft_id}/status", update_status),
            AppRoute("GET", "/settings", settings_get),
            AppRoute("PUT", "/settings", settings_put)]
