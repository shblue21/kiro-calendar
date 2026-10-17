"""Stdio MCP transport for conversation registration and explicitly saved drafts.

Usage: ``mcp_server.py <data_dir>`` (the manifest launcher passes the app's data dir).

The originating conversation is taken from the caller identity the host provides,
never from tool arguments:

1. ``params._meta["kirocrew.caller"]`` injected by the Kiro Crew MCP gateway
   (only when this server is routed through the gateway stub), else
2. ``CallerContext.from_env()`` from the host's ``kiro_crew`` package, which
   resolves the session that launched this process (read per call, not cached
   at startup).

If neither yields a session key the request is refused. No external calendar is written and no cron is created.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from runtime import load  # noqa: E402

_domain = load("domain")
DraftError = _domain.DraftError
CalendarError = load("calendar_domain").CalendarError
_host = load("host")
caller_from_meta, caller_from_host = _host.caller_from_meta, _host.caller_from_host
Services = load("composition").Services

CALLER_META_KEY = "kirocrew.caller"
CALLER_CAPABILITY = {"kirocrew.caller-identity": {"schemaVersion": 1}}
TOOL_NAME = "create_schedule_draft"
TOOL = {
    "name": TOOL_NAME,
    "description": (
        "Save ONE schedule draft to the Crew Calendar app, linked to this conversation. "
        "Call only when the user explicitly asks to KEEP A DRAFT FOR LATER REVIEW. "
        "Do not call proactively. This does not write to any calendar; the user reviews the "
        "draft in the Calendar app. External writes require the separate Calendar review UI and separate confirmation; these tools NEVER write externally or deliver reminders. "
        "For a request to actually register an event, use get_schedule_context then register_schedule instead. Use ISO times with a UTC offset."
    ),
    "inputSchema": {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Short event title"},
            "start": {
                "type": "string",
                "description": "e.g. 2026-10-01T19:00:00+09:00",
            },
            "end": {"type": "string", "description": "Optional end time, same format"},
            "timezone": {"type": "string", "description": "IANA zone, e.g. Asia/Seoul"},
            "reason": {
                "type": "string",
                "description": "Why this time, in one sentence",
            },
        },
        "required": ["title", "start"],
        "additionalProperties": False,
    },
}


CONTEXT_TOOL = {
    "name": "get_schedule_context",
    "description": (
        "Get a NEW save request ID, local time/timezone and Crew Calendar destination after clear agreement. "
        "Call once for a new save, then keep that requestId and exact registration arguments for retries. "
        "Do NOT call again to retry a save or work around a conflict. This stores nothing and is NOT consent. "
        "Resolve relative dates using the returned now and timezone. If the agreed schedule is ambiguous or "
        "contradicts the shown date, clarify the exact schedule before saving. "
        "For an existing saved draft, pass its draftId to read its current fields, status and revision; "
        "register that same draft rather than creating another event. If the draft cannot be identified, "
        "open Calendar proposals instead of recreating it. OPTIONS replies contain plain text, "
        "not an approval token; clarify ambiguous agreements."
    ),
    "inputSchema": {
        "type": "object",
        "properties": {
            "draftId": {
                "type": "string",
                "description": "Existing draft to register, if any",
            }
        },
        "additionalProperties": False,
    },
}

REGISTER_TOOL = {
    "name": "register_schedule",
    "description": (
        "Register ONE agreed event directly in Crew Calendar after the CURRENT human message clearly "
        "authorizes its title, date, start/end and destination. For a NEW save get_schedule_context once; copy its "
        "requestId unchanged and retain the exact arguments for retries. For an EXISTING DRAFT, include draftId "
        "and its revision from the context lookup, so it is accepted in place. Never call for a suggestion, a timing preference, rejection or silence. "
        "Do not reconfirm an already clear explicit request. A generic reply that could refer to different "
        "proposals requires clarification. The same request cannot create twice or change its contents on retry. "
        "Do not generate a new requestId to work around a conflict. This does NOT create an Apple Calendar "
        "event or reminder. For edits of a saved event open Calendar instead of creating another event. "
        "Report registration success only after a successful tool result, using the returned event details. "
        "On replay, report the existing item and its current state, not a newly created event. "
        "If the prior ID was lost after an uncertain save, check Calendar before starting another save."
    ),
    "inputSchema": {
        "type": "object",
        "properties": {
            "requestId": {
                "type": "string",
                "description": "Request ID obtained once for this save; reuse unchanged for retries",
            },
            "draftId": {
                "type": "string",
                "description": "Required when registering an existing saved draft",
            },
            "revision": {
                "type": "integer",
                "description": "Current draft revision from get_schedule_context; retain on retries",
            },
            "title": {"type": "string"},
            "start": {
                "type": "string",
                "description": "Agreed ISO timestamp with UTC offset",
            },
            "end": {
                "type": "string",
                "description": "Agreed ISO timestamp with UTC offset; no implicit duration",
            },
            "timezone": {
                "type": "string",
                "description": "Current IANA zone from get_schedule_context",
            },
            "notes": {
                "type": "string",
                "description": "Only notes the user agreed to include; no transcript dump",
            },
        },
        "required": ["requestId", "title", "start", "end", "timezone"],
        "additionalProperties": False,
    },
}


def _result(
    text: str, *, error: bool = False, data: dict[str, Any] | None = None
) -> dict[str, Any]:
    out: dict[str, Any] = {
        "content": [{"type": "text", "text": text}],
        "isError": error,
    }
    if data is not None:
        out["structuredContent"] = data
        out["content"].append(
            {"type": "text", "text": json.dumps(data, ensure_ascii=False)}
        )
    return out


def call_tool(services, params: dict[str, Any]) -> dict[str, Any]:
    name = params.get("name")
    if name not in (TOOL_NAME, CONTEXT_TOOL["name"], REGISTER_TOOL["name"]):
        return _result("Unknown tool", error=True)
    meta = params.get("_meta")
    caller = caller_from_meta(meta)
    if caller is None and not (
        isinstance(meta, dict)
        and ("kirocrew.tenant" in meta or CALLER_META_KEY in meta)
    ):
        caller = caller_from_host()
    if caller is None:
        return _result(
            "NOT saved: the calling conversation could not be identified.", error=True
        )
    try:
        if name == CONTEXT_TOOL["name"]:
            arguments = params.get("arguments") or {}
            if not isinstance(arguments, dict):
                raise DraftError("Context arguments must be an object")
            context = services.conversation_schedule().context(
                caller, arguments.get("draftId")
            )
            return _result(
                "New save request ID below; retain it for retries. This lookup is not consent. Only register if the user "
                "clearly authorizes the exact event in the conversation; otherwise continue or clarify.",
                data=context,
            )
        if name == REGISTER_TOOL["name"]:
            hidden = not services.calendar().storage.preferences()["showCrew"]
            saved = services.conversation_schedule().register(
                params.get("arguments"), caller
            )
            item, replayed = saved["item"], saved["replayed"]
            removed = bool(item.get("deletedAt"))
            return _result(
                (
                    "This request was already saved and later deleted; it was NOT restored."
                    if removed
                    else "This save was already processed. The current item is returned; no new event was created or overwritten."
                    if replayed
                    else "Saved in Crew Calendar."
                )
                + (
                    " Crew Calendar display is currently hidden; enable Show Crew Calendar in settings to see it."
                    if hidden and not removed
                    else ""
                )
                + " Open /apps/crew-calendar to review. This call did not write an external calendar or create a reminder.",
                data={
                    "outcome": "deleted"
                    if removed
                    else "replayed"
                    if replayed
                    else "registered",
                    **saved,
                    "calendarVisible": not hidden,
                },
            )
        draft, duplicate = services.drafts.create(params.get("arguments") or {}, caller)
        outcome = "duplicate" if duplicate else "created"
        return _result(
            "Saved a local review draft."
            if outcome == "created"
            else "This draft already exists; no new draft was created.",
            data={"outcome": outcome, "draft": draft, "duplicate": duplicate},
        )
    except CalendarError as exc:
        return _result(
            f"NOT saved ({exc.code}): {exc.message}",
            error=True,
            data={"code": exc.code},
        )
    except (DraftError, OSError) as exc:
        return _result(f"NOT saved: {exc}. Do not claim success.", error=True)


def handle(store, message: dict[str, Any]) -> dict[str, Any] | None:
    method = message.get("method")
    msg_id = message.get("id")
    if msg_id is None:  # notification (e.g. notifications/initialized)
        return None
    params = message.get("params") if isinstance(message.get("params"), dict) else {}
    if method == "initialize":
        result: dict[str, Any] = {
            "protocolVersion": params.get("protocolVersion") or "2024-11-05",
            "capabilities": {
                "tools": {"listChanged": False},
                "experimental": CALLER_CAPABILITY,
            },
            # MCP reports the app release version, like the UI and native helper.
            "serverInfo": {"name": "crew-calendar-drafts", "version": "0.1.0"},
        }
    elif method == "tools/list":
        result = {"tools": [CONTEXT_TOOL, REGISTER_TOOL, TOOL]}
    elif method == "tools/call":
        result = call_tool(store, params)
    elif method == "ping":
        result = {}
    else:
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        }
    return {"jsonrpc": "2.0", "id": msg_id, "result": result}


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: mcp_server.py <data_dir>", file=sys.stderr)
        return 2
    store = Services(argv[1])
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            message = json.loads(line)
        except json.JSONDecodeError:
            response: dict[str, Any] | None = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": "Parse error"},
            }
        else:
            try:
                response = handle(store, message) if isinstance(message, dict) else None
            except Exception as exc:  # never kill the stream; report on stderr
                print(f"crew-calendar-drafts: {exc!r}", file=sys.stderr)
                response = {
                    "jsonrpc": "2.0",
                    "id": message.get("id"),
                    "error": {"code": -32603, "message": "Internal error"},
                }
        if response is not None:
            sys.stdout.write(json.dumps(response, ensure_ascii=False) + "\n")
            sys.stdout.flush()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
