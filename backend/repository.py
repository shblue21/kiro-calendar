"""Unified item persistence. Settings, proposals, and events share one process lock."""
from __future__ import annotations
import contextlib
import json
import os
import re
import tempfile
from pathlib import Path
from typing import Any, ContextManager, Protocol, Iterator
from .domain import DraftError, DraftNotFound, StorageUnavailable
try:
    import fcntl
except ImportError:
    fcntl = None

class Repository(Protocol):
    """Persistence contract shared by all adapters.

    load_settings returns None ONLY when no settings record exists. Corrupt data
    (including JSON null) and IO failures raise StorageUnavailable. A valid but
    absent draft ID raises DraftNotFound; invalid IDs raise DraftError.

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
    def items(self, *, strict: bool = False) -> list[dict[str, Any]]: ...
    def session_items(self, session_key: str) -> list[dict[str, Any]]: ...
    def was_applied(self, session_key: str) -> bool: ...
    def record_application(self, session_key: str, value: dict[str, Any]) -> None: ...
    def save_item(self, value: dict[str, Any]) -> None: ...
    def get_item(self, draft_id: str) -> dict[str, Any]: ...

def _atomic_json(path: Path, value: Any) -> None:
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(dir=path.parent, prefix=".tmp-", suffix=".json")
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
        self.root = self.data_dir / "calendar" / "items"
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
            data = json.loads((self.data_dir / "settings.json").read_text(encoding="utf-8"))
            if not isinstance(data, dict):
                raise StorageUnavailable("Settings record must be an object")
            return data
        except FileNotFoundError:
            return None
        except (OSError, ValueError) as exc:
            raise StorageUnavailable("Settings unavailable; automatic proposals are disabled") from exc

    def save_settings(self, value: dict[str, Any]) -> None:
        _atomic_json(self.data_dir / "settings.json", value)

    def save_item(self, value: dict[str, Any]) -> None:
        _atomic_json(self.item_path(value["id"]), value)

    def get_item(self, draft_id: str) -> dict[str, Any]:
        path = self.item_path(draft_id)
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(value, dict) or not {"id", "title", "start", "status", "origin"} <= value.keys():
                raise ValueError("invalid draft record")
            return value
        except FileNotFoundError as exc:
            raise DraftNotFound("unknown draft id") from exc
        except (OSError, ValueError) as exc:
            raise StorageUnavailable("Draft could not be read") from exc

    def items(self, *, strict: bool = False) -> list[dict[str, Any]]:
        if not self.root.is_dir():
            return []
        drafts = []
        for path in self.root.glob("*.json"):
            if path.name.startswith("."):
                continue
            try:
                draft = json.loads(path.read_text(encoding="utf-8"))
                if not isinstance(draft, dict) or not {"id", "title", "start", "status", "origin"} <= draft.keys():
                    raise ValueError("invalid draft")
                drafts.append(draft)
            except (OSError, ValueError) as exc:
                if strict:
                    raise StorageUnavailable("Draft store unavailable; nothing was saved") from exc
        return sorted(drafts, key=lambda d: (d.get("createdAt", ""), d["id"]), reverse=True)


    def session_items(self, session_key: str) -> list[dict[str, Any]]:
        return [d for d in self.items(strict=True) if d["origin"].get("sessionKey") == session_key]

    def _receipt(self, session_key: str) -> Path:
        import hashlib
        return self.data_dir / "hook-sessions" / (hashlib.sha256(session_key.encode()).hexdigest() + ".json")

    def was_applied(self, session_key: str) -> bool:
        return self._receipt(session_key).exists()

    def record_application(self, session_key: str, value: dict[str, Any]) -> None:
        _atomic_json(self._receipt(session_key), value)
