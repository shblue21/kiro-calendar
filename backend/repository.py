"""Unified item persistence. Settings, proposals, and events share one process lock."""

from __future__ import annotations
import contextlib
import json
import os
import re
import tempfile
from pathlib import Path
from typing import Any, ContextManager, Protocol, Iterator
from .domain import DraftError, ItemNotFound, StorageUnavailable

try:
    import fcntl
except ImportError:
    fcntl = None


class Repository(Protocol):
    """Persistence contract shared by all adapters.

    load_settings returns None ONLY when no settings record exists. Corrupt data
    (including JSON null) and IO failures raise StorageUnavailable. A valid but
    absent draft ID raises ItemNotFound; invalid IDs raise DraftError.

    Reads return detached values. items/session_items order by createdAt then
    id descending (timestamps written by this app are UTC ISO strings). In
    strict mode unreadable records raise StorageUnavailable; otherwise skip
    them. Writes are individually atomic and never report success on failure.

    transaction is an exclusive, non-nested cross-process critical section for
    all settings/item read-modify-write operations, NOT multi-write rollback.
    An adapter may provide stronger guarantees, but callers cannot rely on them.
    Never perform external calendar/network operations while holding this lock.
    """

    def transaction(self) -> ContextManager[None]: ...
    def load_settings(self) -> dict[str, Any] | None: ...
    def save_settings(self, value: dict[str, Any]) -> None: ...
    def scan_items(self) -> dict[str, list]: ...
    def items(self, *, strict: bool = False) -> list[dict[str, Any]]: ...
    def session_items(self, session_key: str) -> list[dict[str, Any]]: ...
    def was_enabled(self, session_key: str) -> bool: ...
    def record_application(self, session_key: str, value: dict[str, Any]) -> None: ...
    def save_item(self, value: dict[str, Any]) -> None: ...
    def get_item(self, draft_id: str) -> dict[str, Any]: ...


def _atomic_json(path: Path, value: Any) -> None:
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(
            dir=path.parent, prefix=".tmp-", suffix=".json"
        )
    except OSError as exc:
        raise StorageUnavailable("Persistent write could not start") from exc
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False, indent=1)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    except OSError as exc:
        raise StorageUnavailable("Persistent write failed") from exc
    finally:
        with contextlib.suppress(FileNotFoundError):
            os.unlink(temporary)


class JsonRepository:
    def __init__(self, data_dir: Path | str) -> None:
        self.data_dir = Path(data_dir)
        self.root = self.data_dir / "calendar" / "entries"
        self.lock_root = self.data_dir / "drafts"

    @contextlib.contextmanager
    def transaction(self) -> Iterator[None]:
        try:
            self.lock_root.mkdir(parents=True, exist_ok=True)
            with open(self.lock_root / ".lock", "a+") as handle:
                if fcntl is None:
                    # Crew's Windows lock serializes through msvcrt and fails closed.
                    from kiro_crew.platform_compat import file_lock

                    with file_lock(handle.fileno(), required=True):
                        yield
                else:
                    fcntl.flock(handle, fcntl.LOCK_EX)
                    try:
                        yield
                    finally:
                        fcntl.flock(handle, fcntl.LOCK_UN)
        except OSError as exc:
            raise StorageUnavailable("Persistent state lock or IO unavailable") from exc

    def item_path(self, draft_id: str) -> Path:
        if not re.fullmatch(r"(?:[0-9a-f]{16}|[0-9a-f]{32})", draft_id):
            raise DraftError("unknown draft id")
        return self.root / f"{draft_id}.json"

    def load_settings(self) -> dict[str, Any] | None:
        try:
            data = json.loads(
                (self.data_dir / "settings.json").read_text(encoding="utf-8")
            )
            if not isinstance(data, dict):
                raise StorageUnavailable("Settings record must be an object")
            return data
        except FileNotFoundError:
            return None
        except (OSError, ValueError) as exc:
            raise StorageUnavailable(
                "Settings unavailable; automatic proposals are disabled"
            ) from exc

    def save_settings(self, value: dict[str, Any]) -> None:
        _atomic_json(self.data_dir / "settings.json", value)

    def save_item(self, value: dict[str, Any]) -> None:
        _atomic_json(self.item_path(value["id"]), value)

    def get_item(self, draft_id: str) -> dict[str, Any]:
        path = self.item_path(draft_id)
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
            if (
                not isinstance(value, dict)
                or value.get("id") != draft_id
                or value.get("status") not in {"proposed", "confirmed", "dismissed"}
                or not isinstance(value.get("title"), str)
                or not isinstance(value.get("start"), str)
                or not isinstance(value.get("origin"), dict)
                or not isinstance(value["origin"].get("sessionKey"), str)
                or type(value.get("revision")) is not int
                or value["revision"] < 1
                or not isinstance(value.get("destination"), dict)
                or not all(
                    isinstance(value["destination"].get(k), str)
                    and value["destination"][k]
                    for k in ("connectionId", "calendarId")
                )
                or not isinstance(value.get("notes", ""), str)
                or not isinstance(value.get("reason", ""), str)
                or (value.get("end") is not None and not isinstance(value["end"], str))
            ):
                raise ValueError("invalid item")
            ref = value.get("externalRef")
            if ref is not None and (
                not isinstance(ref, dict)
                or not all(
                    isinstance(ref.get(k), str) and ref[k]
                    for k in ("connectionId", "calendarId", "eventId")
                )
            ):
                raise ValueError("invalid external reference")
            if ref is not None and (
                value["status"] != "confirmed"
                or any(
                    ref[k] != value["destination"][k]
                    for k in ("connectionId", "calendarId")
                )
            ):
                raise ValueError("external reference does not belong to item")
            from .domain import _parse_time

            # Validate collection keys at the same boundary as the item itself.
            # Collection operations can then assume every decoded record is usable.
            _parse_time(value.get("createdAt"), "createdAt")
            value["start"] = _parse_time(value["start"], "start").isoformat()
            if value.get("end"):
                value["end"] = _parse_time(value["end"], "end").isoformat()
            return value
        except FileNotFoundError as exc:
            raise ItemNotFound("unknown item") from exc
        except (OSError, ValueError, TypeError) as exc:
            raise StorageUnavailable("일정 기록을 읽지 못했습니다.") from exc

    def scan_items(self) -> dict[str, list]:
        items, errors = [], []
        for path in self.root.glob("*.json"):
            if path.name.startswith("."):
                continue
            try:
                items.append(self.get_item(path.stem))
            except (DraftError, OSError, TypeError):
                errors.append(
                    {
                        "itemId": path.stem,
                        "code": "item_unavailable",
                        "message": f"일정 {path.stem}의 기록을 읽지 못했습니다. 원본은 보존되어 있습니다.",
                    }
                )
        items.sort(key=lambda d: (d["createdAt"], d["id"]), reverse=True)
        return {"items": items, "errors": errors}

    def items(self, *, strict: bool = False) -> list[dict[str, Any]]:
        snapshot = self.scan_items()
        if strict and snapshot["errors"]:
            raise StorageUnavailable(
                "일부 일정 기록을 읽지 못했습니다. 새 제안은 생성하지 않았습니다."
            )
        return snapshot["items"]

    def session_items(self, session_key: str) -> list[dict[str, Any]]:
        return [
            d
            for d in self.items(strict=True)
            if d["origin"].get("sessionKey") == session_key
        ]

    def _receipt(self, session_key: str) -> Path:
        import hashlib

        return (
            self.data_dir
            / "hook-sessions"
            / (hashlib.sha256(session_key.encode()).hexdigest() + ".json")
        )

    def was_enabled(self, session_key: str) -> bool:
        try:
            value = json.loads(self._receipt(session_key).read_text(encoding="utf-8"))
            if not isinstance(value, dict) or type(value.get("enabled")) is not bool:
                raise ValueError("invalid hook state")
            return value["enabled"]
        except FileNotFoundError:
            return False
        except (OSError, ValueError) as exc:
            raise StorageUnavailable("Calendar hook state could not be read") from exc

    def record_application(self, session_key: str, value: dict[str, Any]) -> None:
        _atomic_json(self._receipt(session_key), value)
