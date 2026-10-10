from __future__ import annotations
import sys
import json
import subprocess
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from drafts import DraftStore, ProposalDenied

A = {"sessionKey": "dashboard:chat-a", "sessionType": "dashboard", "identitySource": "test"}
B = {**A, "sessionKey": "dashboard:chat-b"}
NOW = datetime(2026, 10, 3, 0, 0, tzinfo=timezone.utc)
FIELDS = {"title": "지원서 마무리", "start": "2026-10-04T19:00:00+09:00",
          "timezone": "Asia/Seoul", "reason": "마감 전에 준비", "deadlineDate": "2026-10-06"}


class ProposalTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.store = DraftStore(self.root)

    def tearDown(self):
        self.tmp.cleanup()

    def enable(self):
        self.store.update_settings({"sessionKeys": [A["sessionKey"]], "suggestionsEnabled": True})

    def test_scope_and_off_are_checked_on_every_call_manual_still_works(self):
        self.enable()
        with self.assertRaises(ProposalDenied) as error:
            self.store.create(FIELDS, B, proactive=True, now=NOW)
        self.assertEqual(error.exception.code, "out_of_scope")
        self.store.update_settings({"suggestionsEnabled": False})
        with self.assertRaises(ProposalDenied) as error:
            self.store.create(FIELDS, A, proactive=True, now=NOW)
        self.assertEqual(error.exception.code, "disabled")
        self.assertEqual(self.store.create(FIELDS, B)[0]["source"], "manual")




MCP_FIELDS = {"title":"지원서 마무리", "start":"2026-10-01T19:00:00+09:00", "end":"2026-10-01T20:00:00+09:00"}

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

    def test_interleaved_callers_in_one_process_are_not_mixed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out = rpc([
                call(1, MCP_FIELDS, "dashboard:chat-1-aaa"),
                call(2, MCP_FIELDS, "dashboard:chat-2-bbb"),
                call(3, {**MCP_FIELDS, "title": "A의 두 번째"}, "dashboard:chat-1-aaa"),
            ], Path(tmp))
            drafts = DraftStore(tmp).list()
        self.assertTrue(all(not r["result"]["isError"] for r in out))
        self.assertEqual(len({d["id"] for d in drafts}), 3)
        self.assertEqual(sorted(d["origin"]["sessionKey"] for d in drafts if d["title"] == MCP_FIELDS["title"]),
                         ["dashboard:chat-1-aaa", "dashboard:chat-2-bbb"])
        self.assertEqual(next(d for d in drafts if d["title"] == "A의 두 번째")["origin"]["sessionKey"], "dashboard:chat-1-aaa")
