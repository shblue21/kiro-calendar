"""Explicit draft storage. Deduplication only applies to active proposals."""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Callable
import uuid
from .domain import DraftCandidate, DraftError
from .repository import Repository


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DraftService:
    def __init__(
        self, repository: Repository, *, clock: Callable[[], datetime] = utc_now
    ):
        self.repository = repository
        self.clock = clock

    def create(
        self, fields: dict, origin: dict, *, now: datetime | None = None
    ) -> tuple[dict, bool]:
        session = origin.get("sessionKey", "")
        if not session:
            raise DraftError("caller conversation is unknown; draft not saved")
        candidate = DraftCandidate.parse(fields)
        with self.repository.transaction():
            # Creation time is assigned inside the shared write lock.
            stamp = now or self.clock()
            existing = self.repository.session_items(session)
            duplicate = next(
                (
                    item
                    for item in existing
                    if item["status"] == "proposed"
                    and not item.get("deletedAt")
                    and item["title"].casefold() == candidate.title.casefold()
                    and DraftCandidate.parse(item).start == candidate.start
                ),
                None,
            )
            if duplicate is not None:
                return duplicate, True
            record = candidate.to_record(origin, now=stamp)
            # A user can edit a draft while its identity and external links stay stable.
            # Repeating the original MCP input must not overwrite that edited record.
            if any(d["id"] == record["id"] for d in existing):
                record["id"] = uuid.uuid4().hex[:16]
            self.repository.save_item(record)
            return record, False
