"""Local item lifecycle. One atomic record write per user decision.

Calendar destination and user acceptance are independent of external delivery.
Creation receipts survive edits/deletion, so replay cannot overwrite or resurrect.
"""

from __future__ import annotations
import hashlib
import json
import uuid
from datetime import datetime, timezone
from .calendar_domain import CalendarError, event_payload
from .domain import DraftError, DraftNotFound
from .timezone import system_timezone

CREW = {"connectionId": "crew", "calendarId": "default"}


def stamp():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def payload(fields):
    value = event_payload(fields)
    if value["timezone"] != system_timezone():
        raise CalendarError(
            "timezone_changed", "시스템 시간대가 변경되었습니다. 화면을 새로고침하세요."
        )
    return value


def request_id(value):
    try:
        return uuid.UUID(value).hex
    except (ValueError, TypeError, AttributeError) as exc:
        raise DraftError("저장 요청 식별자를 확인하세요.") from exc


class EventService:
    def __init__(self, repository, validate_target, ensure_unsubmitted):
        self.repository = repository
        self.validate_target = validate_target
        self.ensure_unsubmitted = ensure_unsubmitted

    def create(self, fields):
        value = payload(fields)
        target = self.validate_target(fields.get("destination"))
        key = request_id(fields.get("requestId"))
        digest = hashlib.sha256(
            json.dumps(
                {"payload": value, "destination": target}, sort_keys=True
            ).encode()
        ).hexdigest()
        with self.repository.transaction():
            try:
                old = self.repository.get_item(key)
            except DraftNotFound:
                old = None
            if old is not None:
                if old.get("creationDigest") != digest:
                    raise CalendarError(
                        "request_conflict", "같은 저장 요청에 다른 내용이 들어왔습니다."
                    )
                return old
            item = {
                **value,
                "schemaVersion": 2,
                "id": key,
                "revision": 1,
                "status": "confirmed",
                "source": "direct",
                "origin": {
                    "sessionKey": "calendar:manual",
                    "identitySource": "dashboard",
                },
                "destination": target,
                "reason": "",
                "creationDigest": digest,
                "createdAt": stamp(),
                "updatedAt": stamp(),
            }
            self.repository.save_item(item)
            return item

    def _version(self, item, fields):
        if type(fields.get("revision")) is not int or fields["revision"] != item.get(
            "revision", 1
        ):
            raise CalendarError(
                "stale_event", "다른 곳에서 변경된 일정입니다. 닫고 다시 불러오세요."
            )

    def accept(self, key, fields):
        value = payload(fields)
        target = self.validate_target(fields.get("destination"))
        receipt = request_id(fields.get("requestId"))
        digest = hashlib.sha256(
            json.dumps(
                {
                    "payload": value,
                    "destination": target,
                    "revision": fields.get("revision"),
                },
                sort_keys=True,
            ).encode()
        ).hexdigest()
        with self.repository.transaction():
            item = self.repository.get_item(key)
            if item.get("acceptance", {}).get("id") == receipt:
                if item["acceptance"]["digest"] != digest:
                    raise CalendarError(
                        "request_conflict", "같은 수락 요청의 내용이 변경되었습니다."
                    )
                return item
            self._version(item, fields)
            self.ensure_unsubmitted(key)
            if item["status"] != "proposed" or item.get("deletedAt"):
                raise CalendarError("not_proposed", "이미 처리된 제안입니다.")
            item.update(value)
            item.update(
                status="confirmed",
                destination=target,
                acceptance={"id": receipt, "digest": digest},
                revision=item.get("revision", 1) + 1,
                updatedAt=stamp(),
            )
            self.repository.save_item(item)
            return item

    def edit(self, key, fields):
        value = payload(fields)
        with self.repository.transaction():
            item = self.repository.get_item(key)
            self._version(item, fields)
            self._local(item)
            if item.get("deletedAt"):
                raise CalendarError(
                    "deleted_event", "삭제된 일정입니다. 먼저 복원하세요."
                )
            item.update(value)
            item.update(revision=item["revision"] + 1, updatedAt=stamp())
            self.repository.save_item(item)
            return item

    def _local(self, item):
        if item["status"] != "confirmed" or item.get("destination") != CREW:
            raise CalendarError(
                "not_local",
                "Crew Calendar에 저장된 일정만 수정하거나 삭제할 수 있습니다.",
            )

    def set_deleted(self, key, fields, deleted):
        with self.repository.transaction():
            item = self.repository.get_item(key)
            self._version(item, fields)
            self._local(item)
            if bool(item.get("deletedAt")) != deleted:
                item.update(
                    deletedAt=stamp() if deleted else None,
                    revision=item["revision"] + 1,
                    updatedAt=stamp(),
                )
                self.repository.save_item(item)
            return item
