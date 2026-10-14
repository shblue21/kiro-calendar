"""Connection identities and provider bindings; no platform or provider-specific policy."""
from __future__ import annotations
from dataclasses import dataclass
from .calendar_domain import CalendarProvider, CalendarError

@dataclass(frozen=True)
class CalendarConnection:
    id: str
    provider_key: str
    title: str
    adapter: CalendarProvider
    system_name: str | None = None

    def display_name(self) -> dict:
        return ({'kind': 'system', 'key': self.system_name} if self.system_name
                else {'kind': 'custom', 'text': self.title})

    def status(self, *, authorize: bool = False) -> dict:
        state = self.adapter.authorize() if authorize else self.adapter.status()
        if state.get('state') not in {'ready', 'needs_authorization', 'denied', 'unsupported', 'unavailable'}:
            raise CalendarError('provider_contract', '연결 상태를 확인하지 못했습니다.')
        confirmation = state.get('confirmation', {})
        if confirmation.get('mode') not in {'provider', 'app'}:
            raise CalendarError('provider_contract', '이 연결의 저장 확인 방식을 알 수 없습니다.')
        return {**state, 'id': self.id, 'provider': self.provider_key, 'displayName': self.display_name()}

    def require(self, capability: str) -> dict:
        state = self.status()
        if state['state'] != 'ready' or state.get('capabilities', {}).get(capability) is not True:
            raise CalendarError('capability_unavailable', state.get('message') or '연결 권한과 지원 기능을 확인하세요.')
        return state


class CalendarConnections:
    def __init__(self, connections: list[CalendarConnection]):
        self._items = {}
        for connection in connections:
            if not connection.id or connection.id in self._items:
                raise ValueError('Connection identities must be nonempty and unique')
            self._items[connection.id] = connection

    def all(self) -> list[CalendarConnection]:
        return list(self._items.values())

    def get(self, connection_id: str) -> CalendarConnection:
        if not isinstance(connection_id, str) or connection_id not in self._items:
            raise CalendarError('connection_missing', '저장 대상 연결을 찾을 수 없습니다. 다른 연결로 자동 변경하지 않습니다.')
        return self._items[connection_id]
