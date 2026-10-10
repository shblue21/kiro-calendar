"""Use cases. Adapters inject a repository, policy and clock at composition."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Callable
import uuid
from .domain import DraftCandidate, DraftError, ProposalDenied
from .repository import Repository
from .settings import SettingsService
from .proposal_policy import ProposalPolicy


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DraftService:
    def __init__(self, repository: Repository, settings: SettingsService, *,
                 policy: ProposalPolicy | None = None, clock: Callable[[], datetime] = utc_now):
        if settings.repository is not repository:
            raise ValueError("Drafts and settings must share one transactional repository")
        self.repository = repository
        self.settings = settings
        self.policy = policy or ProposalPolicy()
        self.clock = clock

    def create(self, fields: dict, origin: dict, *, proactive: bool = False,
               now: datetime | None = None) -> tuple[dict, bool]:
        session = origin.get("sessionKey", "")
        if not session:
            raise DraftError("caller conversation is unknown; draft not saved")
        candidate = DraftCandidate.parse(fields, proactive=proactive)
        with self.repository.transaction():
            # Time-dependent policy is evaluated after acquiring the lock.
            stamp = now or self.clock()
            if proactive:
                try:
                    current = self.settings.read()
                except DraftError:
                    raise ProposalDenied("unavailable")
                self.policy.require_enabled(current, session)
            existing = self.repository.session_drafts(session)
            duplicate = self.policy.duplicate(candidate, session, existing, proactive=proactive)
            if duplicate is not None:
                return duplicate, True
            if proactive:
                self.policy.require_new_proposal(candidate, session, existing, stamp)
            record = candidate.to_record(origin, proactive=proactive, now=stamp)
            # A user can edit a draft while its identity and external links stay stable.
            # Repeating the original MCP input must not overwrite that edited record.
            if any(d['id'] == record['id'] for d in existing):
                record['id'] = uuid.uuid4().hex[:16]
            self.repository.save_draft(record)
            return record, False

    def list(self, *, strict: bool = False) -> list[dict]:
        return self.repository.drafts(strict=strict)

    def set_status(self, draft_id: str, status: str) -> dict:
        if status != "dismissed":
            raise DraftError("Only dismissing is supported")
        with self.repository.transaction():
            draft = self.repository.get_draft(draft_id)
            draft["status"] = status
            draft["updatedAt"] = self.clock().isoformat(timespec="seconds")
            self.repository.save_draft(draft)
            return draft
