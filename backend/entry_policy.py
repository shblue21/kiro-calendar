"""One lifecycle policy for API authorization and the actions exposed to the UI."""

from __future__ import annotations
import re
from .calendar_domain import CalendarError

CREW = {"connectionId": "crew", "calendarId": "default"}
PENDING = {"awaiting_confirmation", "unknown"}
UNWRITTEN = {"prepared", "cancelled", "failed"}


def _strings(value, *names):
    return isinstance(value, dict) and all(
        isinstance(value.get(name, ""), str) for name in names
    )


def delivery(item):
    value = item.get("delivery")
    if value is None and not item.get("externalRef"):
        return None
    if (
        isinstance(value, dict)
        and isinstance(value.get("state"), str)
        and value.get("state") in PENDING | UNWRITTEN | {"confirmed"}
        and isinstance(value.get("id"), str)
        and re.fullmatch(r"[0-9a-f]{32}", value["id"])
        and isinstance(value.get("provider"), str)
        and isinstance(value.get("payload"), dict)
        and all(
            isinstance(value["payload"].get(k), str)
            for k in ("title", "start", "end", "timezone", "notes")
        )
        and _strings(value, "connectionTitle", "calendarTitle", "sourceTitle")
        and _strings(value.get("error", {}), "code", "message")
        and _strings(
            value.get("confirmation", {}), "mode", "actionLabel", "pendingMessage"
        )
        and _strings(value.get("verification", {}), "state")
        and _strings(value.get("verification", {}).get("error", {}), "code", "message")
        and type(value.get("canReconcile", True)) is bool
        and isinstance(value.get("target"), dict)
        and type(value.get("itemRevision")) is int
        and value.get("itemId") == item["id"]
        and value["target"] == item["destination"]
        and (
            value["state"] != "confirmed"
            or (
                isinstance(value.get("event"), dict)
                and isinstance(value["event"].get("eventId"), str)
                and value["event"]["eventId"]
            )
        )
        and (not item.get("externalRef") or value["state"] == "confirmed")
    ):
        return value
    # Damaged delivery metadata is explicitly blocked, never treated as "not submitted".
    return {
        "state": "unavailable",
        "error": {
            "code": "delivery_unavailable",
            "message": "이 일정의 외부 저장 기록을 읽지 못했습니다. 원본 기록 복구가 필요합니다.",
        },
    }


def actions(item):
    op = delivery(item)
    state = op["state"] if op else None
    if state == "unavailable":
        return []
    if state in PENDING or state == "confirmed":
        return ["reconcile"] if op.get("canReconcile", True) else []
    if item.get("deletedAt"):
        return ["restore"]
    if item["status"] == "proposed":
        return ["edit", "accept", "dismiss"]
    if item["status"] != "confirmed":
        return []
    if item["destination"] == CREW:
        return ["edit", "delete"]
    # No external write exists, so the owner may correct or withdraw the intent.
    return ["edit", "delete", "retarget", "submit"]


def require_action(item, action):
    if action not in actions(item):
        raise CalendarError(
            "action_unavailable",
            "현재 일정 상태에서는 이 작업을 할 수 없습니다. 저장 상태를 먼저 확인하세요.",
        )


def require_revision(item, revision):
    if type(revision) is not int or revision != item.get("revision", 1):
        raise CalendarError(
            "stale_event", "다른 곳에서 변경된 일정입니다. 닫고 다시 불러오세요."
        )


def view(item):
    return {**item, "delivery": delivery(item), "actions": actions(item)}
