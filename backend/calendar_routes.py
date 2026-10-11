"""Owner-only calendar HTTP boundary; lifecycle policy stays in domain services."""

from __future__ import annotations
import asyncio
import logging
from .composition import Services
from .calendar_domain import CalendarError
from .domain import DraftError, StorageUnavailable
from .entry_policy import view

_tasks: set[asyncio.Task] = set()


async def _owner(request):
    from kiro_crew.dashboard.handlers._shared import require_owner_dashboard_request

    return await require_owner_dashboard_request(request, "crew-calendar.calendar")


async def _run(request, ctx, action):
    from aiohttp import web

    denied = await _owner(request)
    if denied is not None:
        return denied
    try:
        return web.json_response(await action(Services(ctx.data_dir).calendar()))
    except CalendarError as exc:
        return web.json_response({"error": exc.message, "code": exc.code}, status=409)
    except (StorageUnavailable, OSError):
        return web.json_response(
            {
                "error": "저장 상태를 읽거나 기록하지 못했습니다.",
                "code": "storage_unavailable",
            },
            status=503,
        )
    except (DraftError, ValueError, TypeError, KeyError):
        return web.json_response(
            {
                "error": "입력과 일정 버전을 확인한 뒤 다시 시도하세요.",
                "code": "invalid_request",
            },
            status=400,
        )


async def connection_get(request, ctx):
    return await _run(request, ctx, lambda s: asyncio.to_thread(s.list_connections))


async def authorize(request, ctx):
    async def work(s):
        body = await request.json()
        return await asyncio.to_thread(
            s.connection, body["connectionId"], authorize=True
        )

    return await _run(request, ctx, work)


async def connection_put(request, ctx):
    async def work(s):
        return await asyncio.to_thread(s.select, await request.json())

    return await _run(request, ctx, work)


async def events_get(request, ctx):
    return await _run(
        request,
        ctx,
        lambda s: asyncio.to_thread(
            s.events, request.query.get("start", ""), request.query.get("end", "")
        ),
    )


async def items_get(request, ctx):
    return await _run(request, ctx, lambda s: asyncio.to_thread(s.list_items))


async def item_get(request, ctx):
    async def work(s):
        item = await asyncio.to_thread(s.repository.get_item, request.match_info["item_id"])
        return {"item": view(item)}
    return await _run(request, ctx, work)


async def _item_mutation(request, ctx, method, *extra):
    async def work(s):
        fields = await request.json()
        if not isinstance(fields, dict):
            raise DraftError("일정 입력을 확인하세요.")
        args = (
            (fields,)
            if method == "create"
            else (request.match_info["item_id"], fields, *extra)
        )
        return {"item": view(await asyncio.to_thread(getattr(s.items, method), *args))}

    return await _run(request, ctx, work)


async def item_create(request, ctx):
    return await _item_mutation(request, ctx, "create")


async def item_edit(request, ctx):
    return await _item_mutation(request, ctx, "edit")


async def item_accept(request, ctx):
    return await _item_mutation(request, ctx, "accept")


async def item_dismiss(request, ctx):
    return await _item_mutation(request, ctx, "dismiss")


async def item_delete(request, ctx):
    return await _item_mutation(request, ctx, "set_deleted", True)


async def item_restore(request, ctx):
    return await _item_mutation(request, ctx, "set_deleted", False)


def _delivery_response(service, item_id, operation_id):
    item = service.repository.get_item(item_id)
    return {"operation": service._operation(item, operation_id), "item": view(item)}


async def prepare(request, ctx):
    async def work(s):
        item_id = request.match_info["item_id"]
        body = await request.json()
        op = await asyncio.to_thread(s.prepare, item_id, body["revision"])
        return await asyncio.to_thread(_delivery_response, s, item_id, op["id"])

    return await _run(request, ctx, work)


async def execute(request, ctx):
    async def work(s):
        item_id, operation_id = (
            request.match_info["item_id"],
            request.match_info["operation_id"],
        )
        op, claimed = await asyncio.to_thread(s.claim, item_id, operation_id)
        if claimed:
            task = asyncio.create_task(
                asyncio.to_thread(s.execute_claimed, item_id, operation_id)
            )
            _tasks.add(task)

            def done(completed):
                _tasks.discard(completed)
                if not completed.cancelled() and completed.exception() is not None:
                    logging.getLogger(__name__).error(
                        "Calendar delivery response requires reconciliation"
                    )

            task.add_done_callback(done)
        return await asyncio.to_thread(_delivery_response, s, item_id, op["id"])

    return await _run(request, ctx, work)


async def operation_get(request, ctx):
    async def work(s):
        key = request.match_info["item_id"]
        op = await asyncio.to_thread(
            s.get_operation, key, request.match_info["operation_id"]
        )
        return await asyncio.to_thread(_delivery_response, s, key, op["id"])

    return await _run(request, ctx, work)


async def reconcile(request, ctx):
    async def work(s):
        key = request.match_info["item_id"]
        op = await asyncio.to_thread(
            s.reconcile, key, request.match_info["operation_id"]
        )
        return await asyncio.to_thread(_delivery_response, s, key, op["id"])

    return await _run(request, ctx, work)


async def preferences_get(request, ctx):
    async def work(s):
        return {"preferences": await asyncio.to_thread(s.storage.preferences)}

    return await _run(request, ctx, work)


async def preferences_put(request, ctx):
    async def work(s):
        return {
            "preferences": await asyncio.to_thread(s.preferences, await request.json())
        }

    return await _run(request, ctx, work)


def routes():
    from kiro_crew.apps.route_registry import AppRoute

    return [
        AppRoute(method, path, handler)
        for method, path, handler in [
            ("GET", "/calendar/items", items_get),
            ("GET", "/calendar/items/{item_id}", item_get),
            ("POST", "/calendar/items", item_create),
            ("PUT", "/calendar/items/{item_id}", item_edit),
            ("POST", "/calendar/items/{item_id}/accept", item_accept),
            ("POST", "/calendar/items/{item_id}/dismiss", item_dismiss),
            ("POST", "/calendar/items/{item_id}/delete", item_delete),
            ("POST", "/calendar/items/{item_id}/restore", item_restore),
            ("POST", "/calendar/items/{item_id}/delivery", prepare),
            (
                "POST",
                "/calendar/items/{item_id}/delivery/{operation_id}/execute",
                execute,
            ),
            ("GET", "/calendar/items/{item_id}/delivery/{operation_id}", operation_get),
            (
                "POST",
                "/calendar/items/{item_id}/delivery/{operation_id}/reconcile",
                reconcile,
            ),
            ("GET", "/calendar/preferences", preferences_get),
            ("PUT", "/calendar/preferences", preferences_put),
            ("GET", "/calendar/connection", connection_get),
            ("PUT", "/calendar/connection", connection_put),
            ("POST", "/calendar/authorize", authorize),
            ("GET", "/calendar/events", events_get),
        ]
    ]
