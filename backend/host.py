"""Small read-only adapter for the installed Crew hook registry."""
from __future__ import annotations
import shlex
import os
import subprocess
import sys
from typing import Any
from pathlib import Path

HOOK_NAME = "Crew Calendar · schedule suggestions"

def hook_command() -> str:
    # A stable installed path, never a workspace checkout or arbitrary input.
    from kiro_crew.apps.manager import app_dir
    root = app_dir("crew-calendar")
    args = [str(Path(sys.executable).resolve()), str(root / "backend" / "proposal_hook.py"), str(root / "data")]
    return subprocess.list2cmdline(args) if os.name == "nt" else shlex.join(args)


def connection_info(session_key: str = "dashboard:ui") -> dict:
    """Read the host registry; registration is a separate owner operation."""
    try:
        from kiro_crew.apps.manager import is_app_enabled
        from kiro_crew.hooks import ScriptHookStore, _script_hooks_capability_denied
        if not is_app_enabled("crew-calendar"):
            return {"status": "unconfigured"}
        expected = hook_command()
        matches = [h for h in ScriptHookStore().list_all() if h.name == HOOK_NAME and h.command == expected
                   and h.event == "UserPromptSubmit" and h.enabled and not h.matcher]
        if not matches:
            return {"status": "unconfigured", "command": expected, "name": HOOK_NAME}
        if _script_hooks_capability_denied(session_key):
            return {"status": "blocked"}
        hook = matches[0]
        # Registration is not proof of a successful execution. Consumers must
        # distinguish never-run, success, timeout, and policy refusal.
        execution = hook.last_status if hook.last_run else "not_run"
        return {"status": "ready", "executionStatus": execution or "unknown", "lastRun": hook.last_run,
                "lastStatus": hook.last_status, "command": expected, "name": HOOK_NAME}
    except Exception:
        return {"status": "unknown"}



def regular_session(session_key: str) -> bool:
    """Check only the metadata line, never read conversation content.

    A selected chat can later become private. Refuse automatic persistence then.
    """
    import json
    import os
    import re
    if not re.fullmatch(r"dashboard:chat-[A-Za-z0-9_-]+", session_key):
        return False
    try:
        from kiro_crew.config.loader import config_dir
        file = config_dir() / "sessions" / (session_key.replace(":", "_") + ".jsonl")
        fd = os.open(file, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
        with os.fdopen(fd, "r", encoding="utf-8") as handle:
            line = handle.readline(65537)
        if len(line) > 65536:
            return False
        data = json.loads(line)
        return isinstance(data, dict) and data.get("_type") == "metadata" and data.get("memory_mode") == "persistent"
    except Exception:
        return False


def return_target(session_key: str) -> dict[str, str]:
    prefix = "dashboard:"
    if session_key.startswith(prefix) and len(session_key) > len(prefix):
        return {"kind": "dashboard", "slotKey": session_key[len(prefix):]}
    return {"kind": "unsupported"}



def eligible_chats(request) -> list[dict]:
    """Expose titles only for currently open regular chats, never transcripts."""
    state = request.app["state"]
    rows = []
    for key, slot in state._slots.items():
        if (not key.startswith("chat-") or slot.blocks_reads or getattr(slot, "_ephemeral", False)
                or getattr(slot, "memory_mode", "persistent") != "persistent"
                or getattr(slot, "mode", "") not in ("", "chat")):
            continue
        rows.append({"sessionKey": f"dashboard:{key}", "title": getattr(slot, "title", "") or key})
    return rows


CALLER_META_KEY = "kirocrew.caller"

def caller_from_meta(meta: Any) -> dict[str, str] | None:
    """Parse the gateway caller block (same rules as kiro_crew.mcp_caller.CallerContext.from_meta)."""
    if not isinstance(meta, dict):
        return None
    block = meta.get(CALLER_META_KEY)
    if not isinstance(block, dict):
        return None
    version = block.get("schemaVersion")
    key = block.get("sessionKey")
    if not isinstance(version, int) or version < 1 or not isinstance(key, str) or not key:
        return None
    return {
        "sessionKey": key,
        "sessionType": str(block.get("sessionType") or "unknown"),
        "identitySource": "gateway-meta",
    }


def caller_from_host() -> dict[str, str] | None:
    try:
        from kiro_crew.mcp_caller import CallerContext
    except Exception:  # host package unavailable (tests, foreign interpreter)
        return None
    try:
        ctx = CallerContext.from_env()
    except Exception:
        return None
    if not ctx.session_key:
        return None
    key = ctx.session_key
    session_type = key.split(":", 1)[0] if ":" in key else "unknown"
    return {"sessionKey": key, "sessionType": session_type, "identitySource": f"host-{ctx.session_type}"}


def app_active_for(session_key: str) -> bool:
    try:
        from kiro_crew.apps.manager import is_app_enabled
        return is_app_enabled("crew-calendar") and regular_session(session_key)
    except Exception:
        return False
