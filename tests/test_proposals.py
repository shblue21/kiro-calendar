from __future__ import annotations
import sys
import json
import subprocess
import tempfile
import unittest
import uuid
from pathlib import Path

from support import use_timezone
from support import TEST_TIMEZONE, local_time, ROOT, Services, load

A = {
    "sessionKey": "dashboard:chat-a",
    "sessionType": "dashboard",
    "identitySource": "test",
}
B = {**A, "sessionKey": "dashboard:chat-b"}
FIELDS = {
    "title": "지원서 마무리",
    "start": local_time("2026-10-04T19:00:00"),
    "timezone": TEST_TIMEZONE,
    "reason": "마감 전에 준비",
    "deadlineDate": "2026-10-06",
}


class ProposalTest(unittest.TestCase):
    def setUp(self):
        use_timezone(self)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.services = Services(self.root)
        self.store = self.services.drafts

    def test_explicit_drafts_remain_available_with_suggestions_off(self):
        first = self.store.create(FIELDS, A)[0]
        repeated, duplicate = self.store.create(FIELDS, A)
        other = self.store.create(FIELDS, B)[0]
        self.assertTrue(duplicate)
        self.assertEqual(first, repeated)
        self.assertNotEqual(first["id"], other["id"])
        self.assertEqual(first["status"], "proposed")
        self.assertEqual(first["source"], "manual")

    def test_explicit_draft_does_not_reuse_confirmed_deleted_or_dismissed_items(self):
        events = self.services.calendar().items
        for state in ("direct", "accepted", "deleted", "dismissed"):
            with self.subTest(state=state):
                fields = {**FIELDS, "title": f"지원서 {state}"}
                save = {
                    **fields,
                    "requestId": uuid.uuid4().hex,
                    "destination": {"connectionId": "crew", "calendarId": "default"},
                }
                if state == "direct":
                    previous = events.save(save, origin=A)[0]
                else:
                    previous = self.store.create(fields, A)[0]
                    if state == "dismissed":
                        previous = events.dismiss(
                            previous["id"], {"revision": previous["revision"]}
                        )
                    else:
                        previous = events.accept(
                            previous["id"], {**save, "revision": previous["revision"]}
                        )
                        if state == "deleted":
                            previous = events.set_deleted(
                                previous["id"], {"revision": previous["revision"]}, True
                            )

                result = load("mcp_server").call_tool(
                    self.services,
                    {
                        "name": "create_schedule_draft",
                        "arguments": fields,
                        "_meta": {
                            "kirocrew.caller": {
                                "schemaVersion": 1,
                                "sessionKey": A["sessionKey"],
                                "sessionType": "dashboard",
                            }
                        },
                    },
                )
                self.assertFalse(result["isError"])
                self.assertEqual(result["structuredContent"]["outcome"], "created")
                draft = result["structuredContent"]["draft"]
                self.assertEqual(draft["status"], "proposed")
                self.assertFalse(draft.get("deletedAt"))
                self.assertNotEqual(draft["id"], previous["id"])
                self.assertEqual(
                    self.services.repository.get_item(previous["id"]), previous
                )
                repeated, duplicate = self.store.create(fields, A)
                self.assertTrue(duplicate)
                self.assertEqual(repeated, draft)


MCP_FIELDS = {
    "title": "지원서 마무리",
    "start": local_time("2026-10-01T19:00:00"),
    "end": local_time("2026-10-01T20:00:00"),
}


def rpc(lines: list[dict], data_dir: Path) -> list[dict]:
    """Run the server as the host would (one stdio process) and collect responses."""
    proc = subprocess.run(
        [sys.executable, "-I", str(ROOT / "backend" / "mcp_server.py"), str(data_dir)],
        input="".join(json.dumps(line) + "\n" for line in lines),
        capture_output=True,
        text=True,
        timeout=20,
        check=True,
    )
    return [json.loads(line) for line in proc.stdout.splitlines() if line.strip()]


def call(msg_id: int, args: dict, session_key: str | None) -> dict:
    params: dict = {"name": "create_schedule_draft", "arguments": args}
    if session_key:
        params["_meta"] = {
            "kirocrew.caller": {
                "schemaVersion": 1,
                "sessionKey": session_key,
                "sessionType": "dashboard",
            }
        }
    return {"jsonrpc": "2.0", "id": msg_id, "method": "tools/call", "params": params}


class HookProcessTest(unittest.TestCase):
    def test_invalid_argument_count_is_an_error_not_a_deny(self):
        with tempfile.TemporaryDirectory() as tmp:
            for args in ([], [tmp, "extra"]):
                with self.subTest(args=args):
                    result = subprocess.run(
                        [
                            sys.executable,
                            "-I",
                            str(ROOT / "backend" / "proposal_hook.py"),
                            *args,
                        ],
                        input="{}",
                        capture_output=True,
                        text=True,
                        timeout=10,
                    )
                    self.assertEqual(result.returncode, 1)
                    self.assertEqual(result.stdout, "")
                    self.assertIn("Usage:", result.stderr)
            self.assertEqual(list(Path(tmp).iterdir()), [])

    def test_valid_invocation_preserves_success_and_invalid_input_behavior(self):
        with tempfile.TemporaryDirectory(prefix="calendar hook ") as tmp:
            for event, expected in (("{}", 0), ("not json", 1)):
                with self.subTest(event=event):
                    result = subprocess.run(
                        [
                            sys.executable,
                            "-I",
                            str(ROOT / "backend" / "proposal_hook.py"),
                            tmp,
                        ],
                        input=event,
                        capture_output=True,
                        text=True,
                        timeout=10,
                    )
                    self.assertEqual(result.returncode, expected)
                    self.assertEqual(result.stdout, "")
                    self.assertEqual(bool(result.stderr), expected == 1)
            self.assertEqual(list(Path(tmp).iterdir()), [])


class McpServerTest(unittest.TestCase):
    def test_interleaved_callers_in_one_process_are_not_mixed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out = rpc(
                [
                    call(1, MCP_FIELDS, "dashboard:chat-1-aaa"),
                    call(2, MCP_FIELDS, "dashboard:chat-2-bbb"),
                    call(
                        3,
                        {**MCP_FIELDS, "title": "A의 두 번째"},
                        "dashboard:chat-1-aaa",
                    ),
                ],
                Path(tmp),
            )
            drafts = Services(tmp).repository.items()
        self.assertEqual([response["id"] for response in out], [1, 2, 3])
        expected = [
            ("dashboard:chat-1-aaa", MCP_FIELDS["title"]),
            ("dashboard:chat-2-bbb", MCP_FIELDS["title"]),
            ("dashboard:chat-1-aaa", "A의 두 번째"),
        ]
        stored = {draft["id"]: draft for draft in drafts}
        for response, (session_key, title) in zip(out, expected):
            result = response["result"]
            self.assertFalse(result["isError"])
            draft = result["structuredContent"]["draft"]
            self.assertEqual(draft["origin"]["sessionKey"], session_key)
            self.assertEqual(draft["title"], title)
            self.assertEqual(draft, stored[draft["id"]])
        self.assertEqual(len(stored), 3)
