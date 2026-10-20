"""Launch the app's independent macOS EventKit helper. Never modify the Crew bundle."""

from __future__ import annotations
import json
import platform
import subprocess
import uuid
from pathlib import Path
from .calendar_domain import CalendarError
from .repository import atomic_json


# Longer than the native 120-second confirmation window.
INTERACTIVE_TIMEOUT_SECONDS = 150
QUERY_TIMEOUT_SECONDS = 45


class AppleCalendarProvider:
    def __init__(self, app_dir: Path, data_dir: Path):
        self.bundle = app_dir / "native" / "Crew Calendar Bridge.app"
        self.data_dir = data_dir

    def _state(self, raw: dict) -> dict:
        authorization = raw.get("authorization")
        state = {
            "fullAccess": "ready",
            "notDetermined": "needs_authorization",
            "writeOnly": "needs_authorization",
            "denied": "denied",
            "restricted": "denied",
            "unsupported": "unsupported",
        }.get(authorization, "unavailable")
        return {
            "state": state,
            "capabilities": {
                "read": state == "ready",
                "create": state == "ready",
                "reconcile": state == "ready",
            },
            "message": (
                "Apple Calendar 연결은 macOS에서 제공됩니다."
                if state == "unsupported"
                else "기존 일정 조회에는 macOS의 캘린더 전체 접근이 필요합니다. 거부한 경우 시스템 설정에서 Crew Calendar 연결을 허용하세요."
                if state != "ready"
                else ""
            ),
            "confirmation": {"mode": "provider"},
        }

    def status(self) -> dict:
        return self._state(self._command("status"))

    def authorize(self) -> dict:
        return self._state(self._command("authorize"))

    def calendars(self) -> list[dict]:
        return self._command("calendars")["calendars"]

    def events(self, calendar_ids: list[str], start: str, end: str) -> dict:
        return self._command(
            "events", {"calendarIds": calendar_ids, "start": start, "end": end}
        )

    def create(self, operation: dict) -> dict:
        return self._request("create", {"operation": operation})

    def reconcile(self, operation: dict) -> dict:
        return self._request("reconcile", {"operation": operation})

    def _command(self, action: str, payload: dict | None = None) -> dict:
        value = self._request(action, payload)
        if value.get("error"):
            error = value["error"]
            raise CalendarError(
                error.get("code", "provider_error"),
                error.get("message", "캘린더 연결 실패"),
            )
        return value

    def _request(self, action: str, payload: dict | None = None) -> dict:
        if platform.system() != "Darwin":
            if action == "status":
                return {"authorization": "unsupported", "platform": platform.system()}
            raise CalendarError(
                "unsupported_platform",
                "Apple Calendar 연결은 Crew가 실행되는 Mac에서 사용할 수 있습니다.",
            )
        if not (self.bundle / "Contents/MacOS/CrewCalendarBridge").is_file():
            raise CalendarError(
                "helper_missing", "Apple Calendar 연결 프로그램을 빌드·설치해야 합니다."
            )
        if action not in {
            "status",
            "authorize",
            "calendars",
            "events",
            "create",
            "reconcile",
        }:
            raise CalendarError("invalid_action", "지원하지 않는 연결 작업입니다.")
        folder = self.data_dir / "native-requests" / uuid.uuid4().hex
        folder.mkdir(parents=True, mode=0o700)
        request_path, response_path = folder / "request.json", folder / "response.json"
        # Only macOS launches this helper. A shared lock marks an active response reader.
        import fcntl

        with (folder / ".waiter.lock").open("wb") as waiter:
            fcntl.flock(waiter, fcntl.LOCK_SH)
            timed_out = False
            try:
                atomic_json(request_path, {"action": action, **(payload or {})})
                subprocess.run(
                    [
                        "/usr/bin/open",
                        "-n",
                        "-W",
                        str(self.bundle),
                        "--args",
                        str(request_path),
                    ],
                    capture_output=True,
                    timeout=INTERACTIVE_TIMEOUT_SECONDS
                    if action in {"create", "authorize"}
                    else QUERY_TIMEOUT_SECONDS,
                )
                if not response_path.is_file():
                    raise CalendarError(
                        "outcome_unknown"
                        if action == "create"
                        else "helper_unavailable",
                        "연결 프로그램의 응답을 확인하지 못했습니다. 저장을 다시 실행하지 말고 결과를 확인하세요."
                        if action == "create"
                        else "Mac의 캘린더 연결 프로그램을 실행하지 못했습니다.",
                    )
                value = json.loads(response_path.read_text(encoding="utf-8"))
                if not isinstance(value, dict):
                    raise ValueError()
                return value
            except subprocess.TimeoutExpired as exc:
                timed_out = True
                # The native window may still be open. A create is NEVER automatically repeated.
                raise CalendarError(
                    "outcome_unknown" if action == "create" else "helper_timeout",
                    "Mac 연결 창을 확인하세요. 완료 여부를 확인하기 전에는 다시 저장하지 않습니다.",
                ) from exc
            except (ValueError, OSError) as exc:
                raise CalendarError(
                    "outcome_unknown" if action == "create" else "helper_unavailable",
                    "캘린더 연결 결과를 읽지 못했습니다.",
                ) from exc
            finally:
                # The helper reads once before showing UI. A delayed, unread request
                # may no longer start after timeout; a running save keeps its journal.
                try:
                    request_path.unlink(missing_ok=True)
                finally:
                    fcntl.flock(waiter, fcntl.LOCK_UN)
                # Release BEFORE checking: either this reader or the finishing helper
                # must observe the completed response after the reader has departed.
                if not timed_out or response_path.exists():
                    for name in ("response.json", ".waiter.lock"):
                        (folder / name).unlink(missing_ok=True)
                    try:
                        folder.rmdir()
                    except FileNotFoundError:
                        pass  # The helper may have completed the same cleanup.
