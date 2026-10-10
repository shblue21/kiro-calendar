"""One-time, locked publication of legacy drafts into the unified item store.

The old draft directory and a snapshot of operations remain as recovery evidence.
A complete staged directory is atomically renamed; an interrupted attempt can restart.
"""

from __future__ import annotations
import json
import os
import shutil
import tempfile
from pathlib import Path
from .domain import StorageUnavailable
from .repository import _atomic_json

CREW = {"connectionId": "crew", "calendarId": "default"}


def migrate(repository) -> None:
    legacy = repository.data_dir / "drafts"
    if repository.root.exists() or not any(legacy.glob("*.json")):
        return
    with repository.transaction():
        if repository.root.exists():
            return
        calendar = repository.root.parent
        calendar.mkdir(parents=True, exist_ok=True)
        backup = calendar / "migration-v2-backup"
        if not backup.exists():
            staged_backup = Path(tempfile.mkdtemp(prefix=".backup-", dir=calendar))
            try:
                shutil.copytree(legacy, staged_backup / "drafts")
                operations = calendar / "operations"
                if operations.exists():
                    shutil.copytree(operations, staged_backup / "operations")
                os.rename(staged_backup, backup)
            finally:
                if staged_backup.exists():
                    shutil.rmtree(staged_backup)
        stage = Path(tempfile.mkdtemp(prefix=".items-", dir=calendar))
        try:
            operations = [
                json.loads(p.read_text())
                for p in (calendar / "operations").glob("*.json")
            ]
            for path in legacy.glob("*.json"):
                item = json.loads(path.read_text())
                if (
                    not isinstance(item, dict)
                    or not {"id", "title", "start", "status", "origin"} <= item.keys()
                ):
                    raise StorageUnavailable(
                        "기존 일정 데이터를 읽지 못했습니다. 원본을 보존했습니다."
                    )
                repository.item_path(
                    item["id"]
                )  # validate identifier before publishing
                relevant = sorted(
                    (o for o in operations if o["draftId"] == item["id"]),
                    key=lambda o: o["createdAt"],
                )
                active = [
                    o
                    for o in relevant
                    if o["state"] in {"awaiting_confirmation", "unknown", "confirmed"}
                ]
                op = (active or relevant)[-1] if relevant else None
                accepted = op and op["state"] != "cancelled"
                item.update(
                    schemaVersion=2,
                    revision=item.get("revision", 1),
                    destination=op["target"] if accepted else dict(CREW),
                )
                if accepted:
                    item["status"] = "confirmed"
                _atomic_json(stage / path.name, item)
            os.rename(stage, repository.root)
        except (OSError, ValueError, KeyError, TypeError) as exc:
            raise StorageUnavailable(
                "일정 데이터 전환을 완료하지 못했습니다. 원본을 보존했습니다."
            ) from exc
        finally:
            if stage.exists():
                shutil.rmtree(stage)
