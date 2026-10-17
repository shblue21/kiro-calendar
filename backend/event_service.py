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
from .domain import DraftError, ItemNotFound
from .timezone import system_timezone
from .entry_policy import require_action, require_revision


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
    def __init__(self, repository, validate_target):
        self.repository = repository
        self.validate_target = validate_target

    def create(self, fields):
        return self.save(fields)[0]

    def accept(self, key, fields):
        return self.save(fields, draft_id=key)[0]

    def save(self, fields, *, draft_id=None, origin=None):
        """Create or accept once. Request lookup, validation and write share a lock.

        A request ID identifies a save operation, not equal event content or a
        host turn. Its receipt lives on the affected item and survives edits.
        """
        value = payload(fields)
        target = self.validate_target(fields.get("destination"))
        receipt = request_id(fields.get("requestId"))
        command = {"payload": value, "destination": target}
        if draft_id is not None:
            command["revision"] = fields.get("revision")
        digest = hashlib.sha256(
            json.dumps(command, sort_keys=True).encode()
        ).hexdigest()
        with self.repository.transaction():
            # Creation and acceptance share the request namespace. Reusing a key
            # cannot switch operation, target, caller or agreed contents.
            for previous in self.repository.items(strict=True):
                creation = previous["id"] == receipt and "creationDigest" in previous
                acceptance = previous.get("acceptance", {}).get("id") == receipt
                if not creation and not acceptance:
                    continue
                previous_digest = (
                    previous["creationDigest"]
                    if creation
                    else previous["acceptance"]["digest"]
                )
                if (
                    creation != (draft_id is None)
                    or (acceptance and previous["id"] != draft_id)
                    or previous_digest != digest
                    or (
                        origin is not None
                        and previous["origin"]["sessionKey"] != origin["sessionKey"]
                    )
                ):
                    raise CalendarError(
                        "request_conflict",
                        "같은 저장 요청의 내용이나 대상이 변경되었습니다.",
                    )
                return previous, True

            if draft_id is not None:
                item = self.repository.get_item(draft_id)
                if (
                    origin is not None
                    and item["origin"]["sessionKey"] != origin["sessionKey"]
                ):
                    raise CalendarError(
                        "draft_unavailable",
                        "이 대화에 연결된 초안만 등록할 수 있습니다.",
                    )
                require_revision(item, fields.get("revision"))
                require_action(item, "accept")
                item.update(value)
                item.update(
                    status="confirmed",
                    destination=target,
                    acceptance={"id": receipt, "digest": digest},
                    revision=item["revision"] + 1,
                    updatedAt=stamp(),
                )
            else:
                try:
                    self.repository.get_item(receipt)
                except ItemNotFound:
                    pass
                else:
                    raise CalendarError(
                        "request_conflict", "이미 사용 중인 일정 식별자입니다."
                    )
                item = {
                    **value,
                    "schemaVersion": 3,
                    "id": receipt,
                    "revision": 1,
                    "status": "confirmed",
                    "source": "direct",
                    "origin": dict(origin)
                    if origin is not None
                    else {
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
            return item, False

    def edit(self, key, fields):
        value = payload(fields)
        # Provider access checks happen outside the record lock.
        target = fields.get("destination")
        snapshot = self.repository.get_item(key)
        require_revision(snapshot, fields.get("revision"))
        if target is not None and target != snapshot["destination"]:
            target = self.validate_target(target)
        with self.repository.transaction():
            item = self.repository.get_item(key)
            require_revision(item, fields.get("revision"))
            require_action(item, "edit")
            if target is not None and target != item["destination"]:
                require_action(item, "retarget")
                item["destination"] = target
            item.update(value)
            # Editing unsubmitted content supersedes any prepared/cancelled attempt.
            item.pop("delivery", None)
            item.update(revision=item["revision"] + 1, updatedAt=stamp())
            self.repository.save_item(item)
            return item

    def dismiss(self, key, fields):
        with self.repository.transaction():
            item = self.repository.get_item(key)
            require_revision(item, fields.get("revision"))
            require_action(item, "dismiss")
            item.update(
                status="dismissed", revision=item["revision"] + 1, updatedAt=stamp()
            )
            self.repository.save_item(item)
            return item

    def set_deleted(self, key, fields, deleted):
        with self.repository.transaction():
            item = self.repository.get_item(key)
            require_revision(item, fields.get("revision"))
            require_action(item, "delete" if deleted else "restore")
            item.pop("delivery", None)
            item.update(
                deletedAt=stamp() if deleted else None,
                revision=item["revision"] + 1,
                updatedAt=stamp(),
            )
            self.repository.save_item(item)
            return item
