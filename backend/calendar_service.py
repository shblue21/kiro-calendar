"""Calendar reads and external delivery. Each operation belongs to one atomic item.

No global operation log participates in reads or mutations. Provider work runs
outside the lock; responses must match the current immutable operation identity.
"""

from __future__ import annotations
import uuid
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from .calendar_domain import (
    CalendarError, event_payload, interval, delivery_result, delivery_failure,
)
from .domain import DraftError, _parse_time
from .event_service import EventService
from .entry_policy import CREW, delivery, require_action, require_revision, view
from .timezone import system_timezone


def now():
    return datetime.now(timezone.utc).isoformat()


class CalendarService:
    def __init__(self, drafts, storage, connections):
        self.repository, self.storage, self.connections = (
            drafts.repository,
            storage,
            connections,
        )
        self.items = EventService(self.repository, self.validate_target)

    def connection(self, connection_id, *, authorize=False):
        binding = self.connections.get(connection_id)
        state = binding.status(authorize=authorize)
        calendars = (
            binding.adapter.calendars()
            if state["state"] == "ready"
            and any(state.get("capabilities", {}).get(k) for k in ("read", "create"))
            else []
        )
        return {**state, "calendars": calendars, **self.storage.connection(binding.id)}

    def list_connections(self):
        result = []
        for binding in self.connections.all():
            try:
                result.append(self.connection(binding.id))
            except Exception as exc:
                result.append(
                    {
                        "id": binding.id,
                        "provider": binding.provider_key,
                        "title": binding.title,
                        "state": "unavailable",
                        "message": (
                            exc.message
                            if isinstance(exc, CalendarError)
                            else "연결 상태를 확인하지 못했습니다."
                        ),
                        "capabilities": {
                            "read": False,
                            "create": False,
                            "reconcile": False,
                        },
                        "calendars": [],
                        **self.storage.connection(binding.id),
                    }
                )
        return {"connections": result}

    def validate_target(self, target):
        if target == CREW:
            return dict(CREW)
        if not isinstance(target, dict) or set(target) != {
            "connectionId",
            "calendarId",
        }:
            raise DraftError("저장할 캘린더를 선택하세요.")
        binding = self.connections.get(target.get("connectionId"))
        binding.require("create")
        if not any(
            c["id"] == target.get("calendarId") and c["writable"]
            for c in binding.adapter.calendars()
        ):
            raise CalendarError(
                "read_only",
                "저장 위치에 접근할 수 없습니다. 다른 캘린더를 직접 선택하세요.",
            )
        return dict(target)

    def preferences(self, fields):
        if (
            not isinstance(fields, dict)
            or not fields
            or set(fields) - {"defaultDestination", "showCrew"}
        ):
            raise DraftError("캘린더 설정을 확인하세요.")
        if "defaultDestination" in fields:
            self.validate_target(fields["defaultDestination"])
        if "showCrew" in fields and type(fields["showCrew"]) is not bool:
            raise DraftError("표시 설정을 확인하세요.")
        with self.repository.transaction():
            value = {**self.storage.preferences(), **fields}
            self.storage.save_preferences(value)
        return value

    def select(self, fields):
        if not isinstance(fields, dict):
            raise DraftError("연결 설정을 확인하세요.")
        binding = self.connections.get(fields.get("connectionId"))
        binding.require("read")
        ids = fields.get("selectedCalendarIds")
        if (
            not isinstance(ids, list)
            or len(ids) > 30
            or any(not isinstance(x, str) for x in ids)
        ):
            raise DraftError("표시할 캘린더를 확인하세요.")
        known = {c["id"] for c in binding.adapter.calendars()}
        if any(x not in known for x in ids):
            raise DraftError("접근 가능한 캘린더를 선택하세요.")
        with self.repository.transaction():
            self.storage.save_connection(
                binding.id,
                {
                    "selectedCalendarIds": list(dict.fromkeys(ids)),
                    "defaultCalendarId": "",
                },
            )
        return self.storage.connection(binding.id)

    def list_items(self):
        snapshot = self.repository.scan_items()
        return {
            "items": [view(item) for item in snapshot["items"]],
            "errors": snapshot["errors"],
        }

    def events(self, start, end):
        start, end = interval(start, end)
        snapshot = self.repository.scan_items()
        links = {}
        for item in snapshot["items"]:
            ref = item.get("externalRef")
            if ref:
                links[(ref["connectionId"], ref["calendarId"], ref["eventId"])] = item
        events, errors = [], list(snapshot["errors"])
        for binding in self.connections.all():
            selected = self.storage.connection(binding.id)["selectedCalendarIds"]
            if not selected:
                continue
            try:
                binding.require("read")
                response = binding.adapter.events(selected, start, end)
                errors.extend(
                    {**e, "connectionId": binding.id}
                    for e in response.get("errors", [])
                )
                for raw in response.get("events", []):
                    event = {
                        **raw,
                        "connectionId": binding.id,
                        "provider": binding.provider_key,
                        "connectionTitle": binding.title,
                    }
                    owner = links.get(
                        (binding.id, event["calendarId"], event["eventId"])
                    )
                    if owner:
                        event.update(itemId=owner["id"], origin=owner["origin"])
                    events.append(event)
            except Exception as exc:
                errors.append(
                    {
                        "connectionId": binding.id,
                        "message": (
                            exc.message
                            if isinstance(exc, CalendarError)
                            else "이 연결의 일정을 읽지 못했습니다."
                        ),
                    }
                )
        return {"events": events, "errors": errors, "checkedAt": now()}

    def _operation(self, item, operation_id):
        op = delivery(item)
        if not op or op["state"] == "unavailable" or op["id"] != operation_id:
            raise CalendarError(
                "operation_changed",
                "이전 저장 요청입니다. 현재 일정 상태를 다시 확인하세요.",
            )
        return op

    def get_operation(self, item_id, operation_id):
        return self._operation(self.repository.get_item(item_id), operation_id)

    def prepare(self, item_id, revision):
        snapshot = self.repository.get_item(item_id)
        require_revision(snapshot, revision)
        require_action(snapshot, "submit")
        target = self.validate_target(snapshot["destination"])
        binding = self.connections.get(target["connectionId"])
        state = binding.require("create")
        chosen = next(
            c for c in binding.adapter.calendars() if c["id"] == target["calendarId"]
        )
        with self.repository.transaction():
            item = self.repository.get_item(item_id)
            require_revision(item, revision)
            require_action(item, "submit")
            current = delivery(item)
            payload = event_payload(item)
            zone = system_timezone()
            payload.update(
                timezone=zone,
                **{
                    k: _parse_time(payload[k], k).astimezone(ZoneInfo(zone)).isoformat()
                    for k in ("start", "end")
                },
            )
            if (
                current
                and current["state"] == "prepared"
                and current["itemRevision"] == revision
                and current["payload"] == payload
                and current["provider"] == binding.provider_key
                and current["confirmation"] == state["confirmation"]
            ):
                return current
            op = {
                "id": uuid.uuid4().hex,
                "itemId": item_id,
                "itemRevision": revision,
                "origin": item["origin"],
                "target": target,
                "provider": binding.provider_key,
                "connectionTitle": binding.title,
                "calendarTitle": chosen["title"],
                "sourceTitle": chosen["sourceTitle"],
                "confirmation": state["confirmation"],
                "canReconcile": state["capabilities"].get("reconcile", False),
                "payload": payload,
                "state": "prepared",
                "createdAt": now(),
                "updatedAt": now(),
            }
            item["delivery"] = op
            self.repository.save_item(item)
            return op

    def claim(self, item_id, operation_id):
        with self.repository.transaction():
            item = self.repository.get_item(item_id)
            op = self._operation(item, operation_id)
            if op["state"] != "prepared":
                return op, False
            require_revision(item, op["itemRevision"])
            require_action(item, "submit")
            if op["payload"]["timezone"] != system_timezone():
                raise CalendarError(
                    "timezone_changed",
                    "시스템 시간대가 변경되었습니다. 내용을 다시 검토하세요.",
                )
            op.update(state="awaiting_confirmation", updatedAt=now())
            item["delivery"] = op
            self.repository.save_item(item)
            return op, True

    def execute_claimed(self, item_id, operation_id):
        op = self.get_operation(item_id, operation_id)
        try:
            binding = self.connections.get(op["target"]["connectionId"])
            state = binding.require("create")
            if (
                op["provider"] != binding.provider_key
                or op["confirmation"] != state["confirmation"]
            ):
                raise CalendarError(
                    "connection_changed",
                    "저장 방식이 변경되었습니다. 내용을 다시 검토하세요.",
                )
        except Exception as exc:
            # No create call has started; a failed preflight cannot have written.
            return self._record_result(
                item_id, operation_id, delivery_failure(exc, "failed")
            )
        try:
            result = delivery_result(binding.adapter.create(op))
        except Exception as exc:
            # Once dispatched, only an explicit provider outcome can prove no write.
            result = delivery_failure(exc, "unknown")
        return self._record_result(item_id, operation_id, result)

    def _record_result(self, item_id, operation_id, result, *, verification=False):
        with self.repository.transaction():
            item = self.repository.get_item(item_id)
            op = self._operation(item, operation_id)
            # Terminal evidence cannot be weakened by an older in-flight read.
            if op["state"] in {"confirmed", "cancelled", "failed"}:
                if verification and op["state"] == "confirmed":
                    op.update(verification=result, verifiedAt=now())
                    self.repository.save_item(item)
                return op
            state = result["state"]
            if op["state"] == "unknown" and state == "awaiting_confirmation":
                return op
            event = result.get("event")
            if state == "confirmed":
                try:
                    matches = (
                        isinstance(event, dict)
                        and isinstance(event.get("eventId"), str)
                        and bool(event["eventId"])
                        and event.get("calendarId") == op["target"]["calendarId"]
                        and all(
                            event.get(k, "") == op["payload"][k]
                            for k in ("title", "notes")
                        )
                        and all(
                            _parse_time(event.get(k), k)
                            == _parse_time(op["payload"][k], k)
                            for k in ("start", "end")
                        )
                        and not event.get("allDay")
                        and not event.get("recurring")
                    )
                except DraftError:
                    matches = False
                if not matches:
                    state = "unknown"
            op.update(state=state, updatedAt=now())
            if state == "confirmed":
                op.update(event=event, confirmedAt=now())
                op.pop("error", None)
                item["externalRef"] = {**op["target"], "eventId": event["eventId"]}
            elif result.get("error"):
                op["error"] = result["error"]
            else:
                op.pop("error", None)
            item["delivery"] = op
            self.repository.save_item(item)
            return op

    def reconcile(self, item_id, operation_id):
        item = self.repository.get_item(item_id)
        require_action(item, "reconcile")
        op = self._operation(item, operation_id)
        binding = self.connections.get(op["target"]["connectionId"])
        binding.require("reconcile")
        if op["provider"] != binding.provider_key:
            raise CalendarError("connection_changed", "원래 공급자 연결을 확인하세요.")
        result = delivery_result(binding.adapter.reconcile(op))
        return self._record_result(item_id, operation_id, result, verification=True)
