"""Calendar use cases. External work always happens outside the local state lock."""
from __future__ import annotations
import hashlib
import json
import uuid
from zoneinfo import ZoneInfo
from datetime import datetime, timezone
from .calendar_domain import CalendarError, event_payload, interval
from .calendar_storage import CalendarStorage
from .calendar_connections import CalendarConnections
from .domain import DraftError, _parse_time
from .timezone import system_timezone

ACTIVE = {'awaiting_confirmation', 'unknown', 'confirmed'}


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


class CalendarService:
    def __init__(self, drafts, storage: CalendarStorage, connections: CalendarConnections):
        self.drafts, self.repository, self.storage, self.connections = drafts, drafts.repository, storage, connections

    def connection(self, connection_id: str, *, authorize: bool = False) -> dict:
        binding = self.connections.get(connection_id)
        state = binding.status(authorize=authorize)
        calendars = binding.adapter.calendars() if any(state.get('capabilities', {}).get(k) for k in ('read', 'create')) and state['state'] == 'ready' else []
        return {**state, 'calendars': calendars, **self.storage.connection(binding.id)}

    def list_connections(self) -> dict:
        result = []
        for binding in self.connections.all():
            try:
                result.append(self.connection(binding.id))
            except Exception as exc:
                message = exc.message if isinstance(exc, CalendarError) else "연결 상태를 확인하지 못했습니다."
                result.append({'id': binding.id, 'provider': binding.provider_key, 'title': binding.title,
                               'state': 'unavailable', 'message': message,
                               'capabilities': {'read': False, 'create': False, 'reconcile': False},
                               'calendars': [], **self.storage.connection(binding.id)})
        return {'connections': result}

    def select(self, fields: dict) -> dict:
        if not isinstance(fields, dict):
            raise DraftError('연결 설정을 확인하세요.')
        binding = self.connections.get(fields.get('connectionId'))
        binding.require('read')
        ids, default = fields.get('selectedCalendarIds'), fields.get('defaultCalendarId', '')
        if not isinstance(ids, list) or len(ids) > 30 or any(not isinstance(x, str) for x in ids) or not isinstance(default, str):
            raise DraftError('표시할 캘린더를 확인하세요.')
        calendars = binding.adapter.calendars()
        known = {c['id']: c for c in calendars}
        if any(x not in known for x in ids) or (default and (default not in known or not known[default]['writable'])):
            raise DraftError('접근 가능한 캘린더를 선택하세요. 저장 위치에는 쓰기 권한이 필요합니다.')
        with self.repository.transaction():
            self.storage.save_connection(binding.id, {'selectedCalendarIds': list(dict.fromkeys(ids)), 'defaultCalendarId': default})
        return self.storage.connection(binding.id)

    def events(self, start: str, end: str) -> dict:
        start, end = interval(start, end)
        events, errors = [], []
        links = {(o['target']['connectionId'], o['target']['calendarId'], o.get('event', {}).get('eventId')): o
                 for o in self.storage.operations() if o['state'] == 'confirmed'}
        for binding in self.connections.all():
            selected = self.storage.connection(binding.id)['selectedCalendarIds']
            if not selected:
                continue
            try:
                binding.require('read')
                response = binding.adapter.events(selected, start, end)
                errors.extend({**e, 'connectionId': binding.id} for e in response.get('errors', []))
                for raw in response.get('events', []):
                    event = {**raw, 'connectionId': binding.id, 'provider': binding.provider_key, 'connectionTitle': binding.title}
                    op = links.get((binding.id, event['calendarId'], event['eventId']))
                    if op and _parse_time(event['start'], 'start') == _parse_time(op['event']['start'], 'start'):
                        event['draftId'], event['origin'] = op['draftId'], op['origin']
                    events.append(event)
            except Exception as exc:
                errors.append({'connectionId': binding.id, 'message': exc.message if isinstance(exc, CalendarError) else '이 연결의 일정을 읽지 못했습니다.', 'code': exc.code if isinstance(exc, CalendarError) else 'provider_unavailable'})
        return {'events': events, 'errors': errors, 'checkedAt': now()}

    def list_drafts(self) -> list[dict]:
        operations = self.storage.operations()
        result = []
        for draft in self.drafts.list(strict=True):
            relevant = sorted((o for o in operations if o['draftId'] == draft['id']), key=lambda o: o['createdAt'])
            important = [o for o in relevant if o['state'] in ACTIVE]
            result.append({**draft, 'revision': draft.get('revision', 1),
                           'calendarOperation': (important or relevant)[-1] if relevant else None})
        return result

    def edit(self, draft_id: str, fields: dict) -> dict:
        payload = event_payload(fields)
        if payload["timezone"] != system_timezone():
            raise CalendarError("timezone_changed", "시스템 시간대가 변경되었습니다. 화면을 새로고침한 뒤 다시 검토하세요.")
        with self.repository.transaction():
            draft = self.repository.get_draft(draft_id)
            revision = draft.get('revision', 1)
            if type(fields.get('revision')) is not int or fields['revision'] != revision:
                raise CalendarError('stale_draft', '다른 곳에서 변경된 초안입니다. 다시 불러오세요.')
            if draft['status'] != 'proposed' or any(o['draftId'] == draft_id and o['state'] in ACTIVE for o in self.storage.operations()):
                raise CalendarError('draft_locked', '저장이 진행 중이거나 완료된 초안은 수정할 수 없습니다.')
            draft.update({k: payload[k] for k in ('title', 'start', 'end', 'timezone')})
            draft.update(notes=payload['notes'], revision=revision + 1, updatedAt=now())
            self.repository.save_draft(draft)
            return draft

    def dismiss(self, draft_id: str) -> dict:
        with self.repository.transaction():
            if any(o['draftId'] == draft_id and o['state'] in ACTIVE for o in self.storage.operations()):
                raise CalendarError('draft_locked', '저장 중이거나 저장된 초안은 넘길 수 없습니다.')
            draft = self.repository.get_draft(draft_id)
            draft.update(status='dismissed', revision=draft.get('revision', 1) + 1, updatedAt=now())
            self.repository.save_draft(draft)
            return draft

    def prepare(self, fields: dict) -> dict:
        if not isinstance(fields, dict):
            raise DraftError('저장 요청을 확인하세요.')
        target = fields.get('target')
        if not isinstance(target, dict) or not isinstance(target.get('connectionId'), str) or not isinstance(target.get('calendarId'), str):
            raise DraftError('저장할 캘린더를 선택하세요.')
        binding = self.connections.get(target['connectionId'])
        connection_state = binding.require('create')
        calendars = binding.adapter.calendars()
        chosen = next((c for c in calendars if c['id'] == target['calendarId']), None)
        if not chosen or not chosen['writable']:
            raise CalendarError('read_only', '이 캘린더에는 저장할 수 없습니다. 다른 위치를 직접 선택하세요.')
        with self.repository.transaction():
            draft = self.repository.get_draft(fields.get('draftId', ''))
            if draft['status'] != 'proposed' or type(fields.get('revision')) is not int or draft.get('revision', 1) != fields['revision']:
                raise CalendarError('stale_draft', '초안이 변경되었습니다. 다시 불러온 뒤 검토하세요.')
            payload = event_payload(draft)
            zone = system_timezone()
            payload.update(timezone=zone, **{k: _parse_time(payload[k], k).astimezone(ZoneInfo(zone)).isoformat() for k in ('start', 'end')})
            existing = [o for o in self.storage.operations() if o['draftId'] == draft['id']]
            if any(o['state'] in ACTIVE for o in existing):
                raise CalendarError('already_submitted', '이미 저장 요청이 있습니다. 새로 저장하지 말고 결과를 확인하세요.')
            digest = hashlib.sha256(json.dumps({'payload': payload, 'target': target}, sort_keys=True).encode()).hexdigest()
            old = next((o for o in existing if o['state'] == 'prepared' and o['payloadDigest'] == digest and o['draftRevision'] == fields['revision'] and o.get('provider') == binding.provider_key and o.get('confirmation') == connection_state['confirmation']), None)
            if old:
                return old
            op = {'id': uuid.uuid4().hex, 'draftId': draft['id'], 'draftRevision': fields['revision'],
                  'origin': draft['origin'], 'target': {'connectionId': binding.id, 'calendarId': chosen['id']},
                  'calendarTitle': chosen['title'], 'sourceTitle': chosen['sourceTitle'],
                  'provider': binding.provider_key, 'connectionTitle': binding.title, 'confirmation': connection_state['confirmation'],
                  'canReconcile': connection_state['capabilities'].get('reconcile', False),
                  'payload': payload, 'payloadDigest': digest, 'state': 'prepared', 'createdAt': now(), 'updatedAt': now()}
            self.storage.save_operation(op)
            return op

    def claim(self, key: str) -> tuple[dict, bool]:
        with self.repository.transaction():
            op = self.storage.operation(key)
            if op['state'] != 'prepared':
                return op, False
            if op['payload']['timezone'] != system_timezone():
                raise CalendarError('timezone_changed', '시스템 시간대가 변경되었습니다. 다시 검토하세요.')
            draft = self.repository.get_draft(op['draftId'])
            if draft['status'] != 'proposed' or draft.get('revision', 1) != op['draftRevision']:
                raise CalendarError('stale_draft', '저장 준비 이후 초안이 변경되었습니다.')
            if any(o['id'] != key and o['draftId'] == op['draftId'] and o['state'] in ACTIVE for o in self.storage.operations()):
                raise CalendarError('already_submitted', '이 초안의 다른 저장 요청이 진행 중입니다.')
            op.update(state='awaiting_confirmation', updatedAt=now())
            self.storage.save_operation(op)
            return op, True

    def execute_claimed(self, key: str) -> dict:
        op = self.storage.operation(key)
        try:
            binding = self.connections.get(op['target']['connectionId'])
            state = binding.require('create')
            if op.get('provider', binding.provider_key) != binding.provider_key or op.get('confirmation', state['confirmation']) != state['confirmation']:
                raise CalendarError('connection_changed', '연결의 저장 방식이 변경되었습니다. 다시 검토하세요.')
            result = binding.adapter.create(op)
        except CalendarError as exc:
            result = {'state': 'unknown' if exc.code == 'outcome_unknown' else 'failed',
                      'error': {'code': exc.code, 'message': exc.message}}
        except Exception:
            result = {'state': 'unknown', 'error': {'code': 'outcome_unknown', 'message': '저장 결과를 확인해야 합니다.'}}
        return self._record_result(key, result)

    def _record_result(self, key: str, result: dict) -> dict:
        allowed = {'confirmed', 'cancelled', 'failed', 'unknown', 'awaiting_confirmation'}
        state = result.get('state') if result.get('state') in allowed else 'unknown'
        with self.repository.transaction():
            op = self.storage.operation(key)
            if op['state'] == 'confirmed':
                return op
            event = result.get('event')
            if state == 'confirmed':
                if not isinstance(event, dict) or event.get('calendarId') != op['target']['calendarId'] or not event.get('eventId'):
                    state = 'unknown'
                else:
                    try:
                        matches = (event.get('title') == op['payload']['title']
                                   and _parse_time(event.get('start'), 'start') == _parse_time(op['payload']['start'], 'start')
                                   and _parse_time(event.get('end'), 'end') == _parse_time(op['payload']['end'], 'end')
                                   and not event.get('allDay') and not event.get('recurring')
                                   and event.get('notes', '') == op['payload']['notes'])
                    except DraftError:
                        matches = False
                    if not matches:
                        state = 'unknown'
            op.update(state=state, updatedAt=now())
            if state == 'confirmed':
                op.update(event={**event, 'connectionId': op['target']['connectionId']}, confirmedAt=now())
                op.pop('error', None)
            elif result.get('error'):
                op['error'] = result['error']
            self.storage.save_operation(op)
            return op

    def get_operation(self, key: str) -> dict:
        # History remains readable even when its original connection is unavailable.
        return self.storage.operation(key)

    def reconcile(self, key: str) -> dict:
        op = self.storage.operation(key)
        if op['state'] not in {'unknown', 'awaiting_confirmation', 'confirmed'}:
            return op
        binding = self.connections.get(op['target']['connectionId'])
        if op.get('provider', binding.provider_key) != binding.provider_key:
            raise CalendarError('connection_changed', '원래 공급자 연결을 확인하세요.')
        binding.require('reconcile')
        result = binding.adapter.reconcile(op)
        # A previously confirmed event can be missing or edited. Report that readback
        # separately; never clear its creation evidence or offer automatic recreation.
        if op['state'] == 'confirmed':
            with self.repository.transaction():
                current = self.storage.operation(key)
                current['verification'] = result
                current['verifiedAt'] = now()
                self.storage.save_operation(current)
                return current
        return self._record_result(key, result)
