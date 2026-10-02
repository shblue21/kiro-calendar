"""Local tests for the draft store and the stdio MCP server (no Kiro Crew needed)."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from drafts import DraftError, DraftStore, return_target, view  # noqa: E402

A = {"sessionKey": "dashboard:chat-1-aaa", "sessionType": "dashboard", "identitySource": "gateway-meta"}
B = {"sessionKey": "dashboard:chat-2-bbb", "sessionType": "dashboard", "identitySource": "gateway-meta"}
FIELDS = {"title": "지원서 마무리", "start": "2026-10-01T19:00:00+09:00", "end": "2026-10-01T20:00:00+09:00"}


class StoreTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_two_conversations_keep_their_own_origin_after_reopen(self) -> None:
        a, _ = DraftStore(self.dir).create(FIELDS, A)
        b, _ = DraftStore(self.dir).create({**FIELDS, "title": "다른 일"}, B)
        reopened = {d["id"]: d for d in DraftStore(self.dir).list()}
        self.assertEqual(reopened[a["id"]]["origin"]["sessionKey"], A["sessionKey"])
        self.assertEqual(reopened[b["id"]]["origin"]["sessionKey"], B["sessionKey"])

    def test_same_request_in_two_conversations_is_two_drafts(self) -> None:
        a, _ = DraftStore(self.dir).create(FIELDS, A)
        b, dup = DraftStore(self.dir).create(FIELDS, B)
        self.assertFalse(dup)
        self.assertNotEqual(a["id"], b["id"])

    def test_repeat_in_same_conversation_is_deduplicated_and_keeps_dismissal(self) -> None:
        store = DraftStore(self.dir)
        first, _ = store.create(FIELDS, A)
        store.set_status(first["id"], "dismissed")
        again, dup = DraftStore(self.dir).create(FIELDS, A)
        self.assertTrue(dup)
        self.assertEqual(again["status"], "dismissed")
        self.assertEqual(len(DraftStore(self.dir).list()), 1)

    def test_refuses_unlinked_or_invalid_drafts(self) -> None:
        store = DraftStore(self.dir)
        with self.assertRaises(DraftError):
            store.create(FIELDS, {"sessionKey": ""})
        with self.assertRaises(DraftError):
            store.create({**FIELDS, "start": "2026-10-01T19:00:00"}, A)  # no offset
        with self.assertRaises(DraftError):
            store.create({**FIELDS, "end": "2026-10-01T18:00:00+09:00"}, A)
        with self.assertRaises(DraftError):
            store.set_status("../../etc", "dismissed")
        self.assertEqual(store.list(), [])

    def test_return_target_only_for_dashboard_chats(self) -> None:
        self.assertEqual(return_target("dashboard:chat-1-aaa"), {"kind": "dashboard", "slotKey": "chat-1-aaa"})
        self.assertEqual(return_target("slack:T1:C1:123")["kind"], "unsupported")
        self.assertEqual(return_target("dashboard:")["kind"], "unsupported")
        draft, _ = DraftStore(self.dir).create(FIELDS, A)
        self.assertEqual(view(draft)["returnTarget"]["slotKey"], "chat-1-aaa")


def rpc(lines: list[dict], data_dir: Path) -> list[dict]:
    """Run the server as the host would (one stdio process) and collect responses."""
    proc = subprocess.run(
        [sys.executable, "-I", str(ROOT / "backend" / "mcp_server.py"), str(data_dir)],
        input="".join(json.dumps(line) + "\n" for line in lines),
        capture_output=True, text=True, timeout=20, check=True,
    )
    return [json.loads(line) for line in proc.stdout.splitlines() if line.strip()]


def call(msg_id: int, args: dict, session_key: str | None) -> dict:
    params: dict = {"name": "create_schedule_draft", "arguments": args}
    if session_key:
        params["_meta"] = {"kirocrew.caller": {"schemaVersion": 1, "sessionKey": session_key, "sessionType": "dashboard"}}
    return {"jsonrpc": "2.0", "id": msg_id, "method": "tools/call", "params": params}


class McpServerTest(unittest.TestCase):
    def test_handshake_advertises_caller_identity_and_one_tool(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out = rpc([
                {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05"}},
                {"jsonrpc": "2.0", "method": "notifications/initialized"},
                {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
            ], Path(tmp))
        self.assertEqual(len(out), 2)  # the notification gets no reply
        self.assertIn("kirocrew.caller-identity", out[0]["result"]["capabilities"]["experimental"])
        self.assertEqual([t["name"] for t in out[1]["result"]["tools"]], ["create_schedule_draft", "propose_schedule_draft"])

    def test_interleaved_callers_in_one_process_are_not_mixed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out = rpc([
                call(1, FIELDS, "dashboard:chat-1-aaa"),
                call(2, {**FIELDS, "title": "B의 일정"}, "dashboard:chat-2-bbb"),
                call(3, {**FIELDS, "title": "A의 두 번째"}, "dashboard:chat-1-aaa"),
            ], Path(tmp))
            drafts = {d["title"]: d["origin"]["sessionKey"] for d in DraftStore(tmp).list()}
        self.assertTrue(all(not r["result"]["isError"] for r in out))
        self.assertEqual(drafts, {
            "지원서 마무리": "dashboard:chat-1-aaa",
            "B의 일정": "dashboard:chat-2-bbb",
            "A의 두 번째": "dashboard:chat-1-aaa",
        })

    def test_session_key_in_arguments_is_ignored_and_missing_caller_is_refused(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out = rpc([call(1, {**FIELDS, "sessionKey": "dashboard:chat-evil"}, None)], Path(tmp))
            self.assertTrue(out[0]["result"]["isError"])
            self.assertIn("NOT saved", out[0]["result"]["content"][0]["text"])
            self.assertEqual(DraftStore(tmp).list(), [])


if __name__ == "__main__":
    unittest.main()
