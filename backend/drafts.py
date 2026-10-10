"""Compatibility facade for v0.1 entry points and stored data.

New adapters use Services.settings and Services.drafts separately. This facade
contains no rules and can be removed when external v0.1 imports are retired.
"""
from __future__ import annotations
from pathlib import Path
if __package__:
    from .composition import Services
    from .domain import DraftError, ProposalDenied, _parse_time
    from .repository import _atomic_json
    from .host import return_target
else:
    from runtime import load
    Services = load("composition").Services
    DraftError = load("domain").DraftError
    ProposalDenied = load("domain").ProposalDenied
    _parse_time = load("domain")._parse_time
    _atomic_json = load("repository")._atomic_json
    return_target = load("host").return_target

class DraftStore:
    def __init__(self, data_dir: Path | str):
        self.services = Services(data_dir)
        self.data_dir = self.services.repository.data_dir
        self.root = self.services.repository.root
    def read_settings(self): return self.services.settings.read()
    def update_settings(self, changes): return self.services.settings.update(changes)
    def create(self, fields, origin, **options): return self.services.drafts.create(fields, origin, **options)
    def list(self, *, strict=False): return self.services.drafts.list(strict=strict)
    def set_status(self, draft_id, status): return self.services.drafts.set_status(draft_id, status)
    # Kept for existing on-disk compatibility tests only.
    def _path(self, draft_id): return self.services.repository.item_path(draft_id)
    def _write(self, draft): return self.services.repository.save_item(draft)

def view(draft):
    origin = draft.get("origin") or {}
    return {**draft, "source": draft.get("source", "manual"),
            "returnTarget": return_target(str(origin.get("sessionKey", "")))}
