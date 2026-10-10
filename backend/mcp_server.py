"""Stdio MCP transport for explicit drafts and opt-in proactive proposals.

Usage: ``mcp_server.py <data_dir>`` (the manifest launcher passes the app's data dir).

The originating conversation is taken from the caller identity the host provides,
never from tool arguments:

1. ``params._meta["kirocrew.caller"]`` injected by the Kiro Crew MCP gateway
   (only when this server is routed through the gateway stub), else
2. ``CallerContext.from_env()`` from the host's ``kiro_crew`` package, which
   resolves the session that launched this process (read per call, not cached
   at startup).

If neither yields a session key the draft is refused rather than saved unlinked.
No external calendar is written and no cron is created. Proactive drafts require the live opt-in checks.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from runtime import load  # noqa: E402

_domain = load("domain")
DraftError, ProposalDenied = _domain.DraftError, _domain.ProposalDenied
_host = load("host")
connection_info, regular_session = _host.connection_info, _host.regular_session
caller_from_meta, caller_from_host = _host.caller_from_meta, _host.caller_from_host
Services = load("composition").Services

CALLER_META_KEY = "kirocrew.caller"
CALLER_CAPABILITY = {"kirocrew.caller-identity": {"schemaVersion": 1}}
TOOL_NAME = "create_schedule_draft"
TOOL = {
    "name": TOOL_NAME,
    "description": (
        "Save ONE schedule draft to the Crew Calendar app, linked to this conversation. "
        "Call only when the user explicitly asks to add, register or hold time for something. "
        "Do not call proactively. This does not write to any calendar; the user reviews the "
        "draft in the Calendar app. External writes require the separate Calendar review UI and separate confirmation; these tools NEVER write externally or deliver reminders. "
        "Only use for an explicit request, even when automatic suggestions are OFF. Use ISO times with a UTC offset."
    ),
    "inputSchema": {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Short event title"},
            "start": {"type": "string", "description": "e.g. 2026-10-01T19:00:00+09:00"},
            "end": {"type": "string", "description": "Optional end time, same format"},
            "timezone": {"type": "string", "description": "IANA zone, e.g. Asia/Seoul"},
            "reason": {"type": "string", "description": "Why this time, in one sentence"},
        },
        "required": ["title", "start"],
        "additionalProperties": False,
    },
}


PROPOSAL_TOOL_NAME = "propose_schedule_draft"
PROPOSAL_TOOL = {
    **TOOL, "name": PROPOSAL_TOOL_NAME,
    "description": "Suggest ONE useful future calendar draft from conversation context, only when Calendar suggestions are ON. "
        "No explicit calendar request is necessary. The server checks scope, OFF, duplicates and frequency. "
        "Never use create_schedule_draft to bypass a refusal. Nothing is registered in external calendars; no reminders.",
    "inputSchema": {**TOOL["inputSchema"],
                    "properties": {**TOOL["inputSchema"]["properties"], "deadlineDate": {
                        "type": "string", "description": "Known deadline/occurrence date YYYY-MM-DD. Keep the same date when moving preparation time; omit if unknown."}},
                    "required": ["title", "start", "timezone", "reason"]},
}



def _result(text: str, *, error: bool = False, data: dict[str, Any] | None = None) -> dict[str, Any]:
    out: dict[str, Any] = {"content": [{"type": "text", "text": text}], "isError": error}
    if data is not None:
        out["structuredContent"] = data
    return out


def call_tool(store, params: dict[str, Any]) -> dict[str, Any]:
    name = params.get("name")
    if name not in (TOOL_NAME, PROPOSAL_TOOL_NAME):
        return _result("Unknown tool", error=True)
    meta = params.get("_meta")
    caller = caller_from_meta(meta)
    if caller is None and not (isinstance(meta, dict) and ("kirocrew.tenant" in meta or CALLER_META_KEY in meta)):
        caller = caller_from_host()
    if caller is None:
        return _result("Draft NOT saved: the calling conversation could not be identified.", error=True)
    proactive = name == PROPOSAL_TOOL_NAME
    connection = connection_info(caller["sessionKey"]) if proactive else {}
    if proactive and (connection["status"] != "ready"
                      or connection.get("executionStatus") in ("error", "timeout", "blocked", "unknown")
                      or not regular_session(caller["sessionKey"])):
        return _result("NOT saved: automatic suggestions are unavailable. Do not add a calendar suggestion to your reply.",
                       data={"outcome": "unavailable"})
    try:
        draft, duplicate = store.create(params.get("arguments") or {}, caller, proactive=proactive)
    except ProposalDenied as exc:
        return _result(f"NOT saved ({exc.code}). Do not add a calendar suggestion; continue the original conversation.",
                       data={"outcome": exc.code})
    except (DraftError, OSError):
        return _result("Draft NOT saved: input or app storage is unavailable. Do not claim success.", error=True)
    outcome = "dismissed" if draft["status"] == "dismissed" else "duplicate" if duplicate else "created"
    if outcome == "dismissed":
        text = "The user previously dismissed this draft. It remains hidden. Do not suggest it again."
    elif outcome == "duplicate":
        text = "Already saved this draft. No new draft was created. Do not repeat an unsolicited suggestion."
    else:
        text = f"Saved a local review draft: {draft['title']} ({draft['start']})."
    text += (f" Draft ID: {draft['id']}; origin: {draft['origin']['sessionKey']}. "
             "View in Calendar settings: /apps/crew-calendar?view=drafts . "
             "This tool did NOT write externally or schedule reminders. The user can review and save to a connected calendar through the app UI.")
    return _result(text, data={"outcome": outcome, "draft": draft, "duplicate": duplicate})


def handle(store, message: dict[str, Any]) -> dict[str, Any] | None:
    method = message.get("method")
    msg_id = message.get("id")
    if msg_id is None:  # notification (e.g. notifications/initialized)
        return None
    params = message.get("params") if isinstance(message.get("params"), dict) else {}
    if method == "initialize":
        result: dict[str, Any] = {
            "protocolVersion": params.get("protocolVersion") or "2024-11-05",
            "capabilities": {"tools": {"listChanged": False}, "experimental": CALLER_CAPABILITY},
            "serverInfo": {"name": "crew-calendar-drafts", "version": "0.1.0"},
        }
    elif method == "tools/list":
        result = {"tools": [TOOL, PROPOSAL_TOOL]}
    elif method == "tools/call":
        result = call_tool(store, params)
    elif method == "ping":
        result = {}
    else:
        return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": -32601, "message": f"Method not found: {method}"}}
    return {"jsonrpc": "2.0", "id": msg_id, "result": result}


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: mcp_server.py <data_dir>", file=sys.stderr)
        return 2
    store = Services(argv[1]).drafts
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            message = json.loads(line)
        except json.JSONDecodeError:
            response: dict[str, Any] | None = {
                "jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"},
            }
        else:
            try:
                response = handle(store, message) if isinstance(message, dict) else None
            except Exception as exc:  # never kill the stream; report on stderr
                print(f"crew-calendar-drafts: {exc!r}", file=sys.stderr)
                response = {"jsonrpc": "2.0", "id": message.get("id"), "error": {"code": -32603, "message": "Internal error"}}
        if response is not None:
            sys.stdout.write(json.dumps(response, ensure_ascii=False) + "\n")
            sys.stdout.flush()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
