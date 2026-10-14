"""Publish v3 entries atomically, keeping all pre-release source files intact.

Delivery is embedded in the owning item; retired global operation files are never
read on the live path. Damaged legacy evidence blocks only possibly affected
external intents, while healthy local entries remain usable.
"""

from __future__ import annotations
import json
import os
import re
import shutil
import tempfile
from pathlib import Path
from .domain import StorageUnavailable
from .repository import _atomic_json
from .entry_policy import CREW, delivery


def legacy_evidence(folder):
    """Keep unreadable evidence alongside usable attempts, including known ownership."""
    by_item, damaged = {}, []
    for path in folder.glob("*.json"):
        if path.name.startswith("."):
            continue
        op = None
        try:
            op = json.loads(path.read_text())
            if (
                not isinstance(op, dict)
                or not all(
                    isinstance(op.get(k), str)
                    for k in ("draftId", "id", "state", "createdAt")
                )
                or op["state"]
                not in {
                    "prepared",
                    "awaiting_confirmation",
                    "unknown",
                    "confirmed",
                    "cancelled",
                    "failed",
                }
                or not isinstance(op.get("target"), dict)
                or not all(
                    isinstance(op["target"].get(k), str) and op["target"][k]
                    for k in ("connectionId", "calendarId")
                )
            ):
                raise ValueError()
            by_item.setdefault(op["draftId"], []).append(op)
        except (ValueError, KeyError, TypeError, OSError):
            owner = op.get("draftId") if isinstance(op, dict) else None
            if not isinstance(owner, str) or not re.fullmatch(
                r"(?:[0-9a-f]{16}|[0-9a-f]{32})", owner
            ):
                owner = None
            damaged.append({"file": path.name, "itemId": owner})
    return by_item, damaged


def migrate(repository):
    if repository.root.exists():
        return
    calendar = repository.root.parent
    source = calendar / "items"
    if not source.exists():
        source = repository.data_dir / "drafts"
    if not any(source.glob("*.json")):
        return
    with repository.transaction():
        if repository.root.exists():
            return
        calendar.mkdir(parents=True, exist_ok=True)
        backup = calendar / "migration-v3-backup"
        if not backup.exists():
            staged = Path(tempfile.mkdtemp(prefix=".backup-", dir=calendar))
            try:
                shutil.copytree(source, staged / source.name)
                if (calendar / "operations").exists():
                    shutil.copytree(calendar / "operations", staged / "operations")
                os.rename(staged, backup)
            finally:
                if staged.exists():
                    shutil.rmtree(staged)
        by_item, damaged = legacy_evidence(calendar / "operations")
        stage = Path(tempfile.mkdtemp(prefix=".entries-", dir=calendar))
        try:
            for path in source.glob("*.json"):
                if path.name.startswith("."):
                    continue
                try:
                    item = json.loads(path.read_text())
                    if not isinstance(item, dict) or not all(
                        k in item for k in ("id", "status", "start", "title", "origin")
                    ):
                        raise ValueError()
                    repository.item_path(item["id"])
                except (ValueError, TypeError, OSError):
                    # Keep damaged entry bytes too: collection reads report them without hiding healthy entries.
                    shutil.copyfile(path, stage / path.name)
                    continue
                ops = sorted(
                    by_item.get(item["id"], []),
                    key=lambda op: (op["createdAt"], op["id"]),
                )
                active = [
                    op
                    for op in ops
                    if op["state"] in {"awaiting_confirmation", "unknown", "confirmed"}
                ]
                op = (active or ops)[-1] if ops else None
                previous_version = 2 if source.name == "items" else 1
                item.update(schemaVersion=3, revision=item.get("revision", 1))
                item.setdefault("destination", dict(CREW))
                item.setdefault("source", "manual")
                if op:
                    op = {
                        **op,
                        "itemId": item["id"],
                        "itemRevision": op.get("draftRevision", item["revision"]),
                    }
                    op.pop("draftId", None)
                    op.pop("draftRevision", None)
                    if previous_version < 2 and op["state"] in {
                        "awaiting_confirmation",
                        "unknown",
                        "confirmed",
                    }:
                        item.update(status="confirmed", destination=op["target"])
                    if op["target"] != item["destination"]:
                        if op["state"] in {
                            "awaiting_confirmation",
                            "unknown",
                            "confirmed",
                        }:
                            item["delivery"] = {"state": "unavailable"}
                    elif op["state"] != "prepared":
                        if op["target"]["connectionId"] == "apple-local":
                            op.setdefault("provider", "apple")
                            op.setdefault("connectionName", {"kind": "system", "key": "appleLocal"})
                            op.setdefault("canReconcile", True)
                        item["delivery"] = op
                        item["delivery"] = delivery(item)
                        if item["delivery"]["state"] == "confirmed":
                            item["externalRef"] = {
                                **op["target"],
                                "eventId": op["event"]["eventId"],
                            }
                # No older attempt proves absence of a later write whose evidence
                # is unreadable. Evaluate completeness independently of selection.
                if any(
                    evidence["itemId"] == item["id"]
                    or (
                        evidence["itemId"] is None
                        and (item["destination"] != CREW or previous_version < 2)
                    )
                    for evidence in damaged
                ):
                    item["delivery"] = {"state": "unavailable"}
                _atomic_json(stage / path.name, item)
            if damaged:
                _atomic_json(
                    stage / ".migration-report.json",
                    {"unreadableLegacyOperations": damaged},
                )
            os.rename(stage, repository.root)
        except (OSError, ValueError, KeyError, TypeError) as exc:
            raise StorageUnavailable(
                "일정 전환을 완료하지 못했습니다. 원본 데이터는 보존되어 있습니다."
            ) from exc
        finally:
            if stage.exists():
                shutil.rmtree(stage)
