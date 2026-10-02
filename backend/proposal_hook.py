"""Read the current toggle once per user message; no model/network calls.

Register using Crew's owner Hooks UI. stdout is exclusively prompt context.
"""
from __future__ import annotations
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))
from runtime import load

Services = load("composition").Services
OFF = load("hook_context").OFF
app_active_for = load("host").app_active_for


def prompt_for(store, event: dict, *, active: bool, now: datetime | None = None) -> str:
    if (event.get("hook_event_name") != "UserPromptSubmit" or event.get("subagent_id")
            or event.get("agent_role")):
        return ""
    session = event.get("parent_session_key", "")
    if not isinstance(session, str) or not session.startswith("dashboard:chat-"):
        return ""
    services = store.services if hasattr(store, "services") else store
    return services.contexts.for_session(session, active=active, now=now)


def run(data_dir: str) -> int:
    # Crew sends the entire message in this JSON event. Never truncate the
    # serialized document: the prompt may be long and fields may follow it.
    try:
        event = json.load(sys.stdin)
    except (ValueError, OSError):
        print("Calendar hook received an invalid event.", file=sys.stderr)
        return 1  # No caller was established: do not inject OFF into every chat.
    if not isinstance(event, dict):
        return 0
    try:
        active = app_active_for(event.get("parent_session_key", ""))
        output = prompt_for(Services(data_dir), event, active=active)
        if output:
            print(output)
        return 0
    except Exception:
        # No successful turn context can be vouched for. Let Crew record an
        # execution error rather than claim a deliberate OFF in unrelated chats.
        print("Calendar hook could not read current state.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(run(sys.argv[1]) if len(sys.argv) == 2 else 2)
