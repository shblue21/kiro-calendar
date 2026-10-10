"""Owner-dashboard calendar API. MCP remains draft-only; native UI confirms writes."""
from __future__ import annotations
import asyncio
import logging
from .composition import Services
from .calendar_domain import CalendarError
from .domain import DraftError, StorageUnavailable

_tasks: set[asyncio.Task] = set()


async def _owner(request):
    from kiro_crew.dashboard.handlers._shared import require_owner_dashboard_request
    return await require_owner_dashboard_request(request, 'crew-calendar.calendar')


async def _run(request, ctx, action):
    from aiohttp import web
    denied = await _owner(request)
    if denied is not None:
        return denied
    try:
        value = await action(Services(ctx.data_dir).calendar())
        return web.json_response(value)
    except CalendarError as exc:
        status = 503 if exc.code in {'helper_missing', 'helper_unavailable', 'helper_timeout', 'unsupported_platform'} else 409
        return web.json_response({'error': exc.message, 'code': exc.code}, status=status)
    except (StorageUnavailable, OSError):
        return web.json_response({'error': '저장 상태를 읽거나 기록하지 못했습니다.', 'code': 'storage_unavailable'}, status=503)
    except (DraftError, ValueError, TypeError):
        return web.json_response({'error': '입력과 초안 버전을 확인한 뒤 다시 시도하세요.', 'code': 'invalid_request'}, status=400)


async def connection_get(request, ctx):
    return await _run(request, ctx, lambda service: asyncio.to_thread(service.list_connections))


async def authorize(request, ctx):
    async def work(service):
        body = await request.json()
        return await asyncio.to_thread(service.connection, body.get('connectionId'), authorize=True)
    return await _run(request, ctx, work)


async def connection_put(request, ctx):
    async def work(service): return await asyncio.to_thread(service.select, await request.json())
    return await _run(request, ctx, work)


async def events_get(request, ctx):
    return await _run(request, ctx, lambda service: asyncio.to_thread(service.events, request.query.get('start', ''), request.query.get('end', '')))


async def draft_create(request, ctx):
    async def work(service):
        from .calendar_domain import event_payload
        fields = await request.json()
        payload = event_payload(fields)
        from .timezone import system_timezone
        if payload['timezone'] != system_timezone():
            raise CalendarError('timezone_changed', '시스템 시간대를 다시 확인하도록 화면을 새로고침하세요.')
        # The UI creates a persistent draft, never an external event.
        draft, duplicate = await asyncio.to_thread(service.drafts.create, {**payload, 'reason': ''},
                                                   {'sessionKey': 'calendar:manual', 'sessionType': 'calendar', 'identitySource': 'dashboard'})
        # Keep the original notes in the same revision-checked edit path.
        if payload['notes'] and not duplicate:
            draft = await asyncio.to_thread(service.edit, draft['id'], {**payload, 'revision': draft.get('revision', 1)})
        return {'draft': draft}
    return await _run(request, ctx, work)


async def draft_edit(request, ctx):
    async def work(service):
        return {'draft': await asyncio.to_thread(service.edit, request.match_info['draft_id'], await request.json())}
    return await _run(request, ctx, work)


async def prepare(request, ctx):
    async def work(service): return {'operation': await asyncio.to_thread(service.prepare, await request.json())}
    return await _run(request, ctx, work)


async def execute(request, ctx):
    async def work(service):
        op, claimed = await asyncio.to_thread(service.claim, request.match_info['operation_id'])
        if claimed:
            task = asyncio.create_task(asyncio.to_thread(service.execute_claimed, op['id']))
            _tasks.add(task)
            def done(completed):
                _tasks.discard(completed)
                if not completed.cancelled() and completed.exception() is not None:
                    logging.getLogger(__name__).error('Calendar operation result was not persisted; reconciliation required')
            task.add_done_callback(done)
        return {'operation': op}
    return await _run(request, ctx, work)


async def operation_get(request, ctx):
    async def work(service): return {'operation': await asyncio.to_thread(service.get_operation, request.match_info['operation_id'])}
    return await _run(request, ctx, work)


async def reconcile(request, ctx):
    async def work(service): return {'operation': await asyncio.to_thread(service.reconcile, request.match_info['operation_id'])}
    return await _run(request, ctx, work)


def routes():
    from kiro_crew.apps.route_registry import AppRoute
    return [AppRoute('GET', '/calendar/connection', connection_get),
            AppRoute('POST', '/calendar/authorize', authorize),
            AppRoute('PUT', '/calendar/connection', connection_put),
            AppRoute('GET', '/calendar/events', events_get),
            AppRoute('POST', '/calendar/drafts', draft_create),
            AppRoute('PUT', '/calendar/drafts/{draft_id}', draft_edit),
            AppRoute('POST', '/calendar/operations', prepare),
            AppRoute('POST', '/calendar/operations/{operation_id}/execute', execute),
            AppRoute('GET', '/calendar/operations/{operation_id}', operation_get),
            AppRoute('POST', '/calendar/operations/{operation_id}/reconcile', reconcile)]
