from __future__ import annotations
import json
import multiprocessing
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from drafts import DraftError, DraftStore, ProposalDenied
from mcp_server import call_tool
from proposal_hook import prompt_for

A = {"sessionKey": "dashboard:chat-a", "sessionType": "dashboard", "identitySource": "test"}
B = {**A, "sessionKey": "dashboard:chat-b"}
NOW = datetime(2026, 10, 3, 0, 0, tzinfo=timezone.utc)
FIELDS = {"title": "지원서 마무리", "start": "2026-10-04T19:00:00+09:00",
          "timezone": "Asia/Seoul", "reason": "마감 전에 준비", "deadlineDate": "2026-10-06"}
EVENT = {"hook_event_name": "UserPromptSubmit", "parent_session_key": A["sessionKey"]}


def attempt_after_off(folder, ready, proceed, result):
    store = DraftStore(folder)
    ready.set()
    proceed.wait(5)
    try:
        store.create(FIELDS, A, proactive=True, now=NOW)
        result.put("saved")
    except ProposalDenied as exc:
        result.put(exc.code)


class ProposalTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.store = DraftStore(self.root)

    def tearDown(self):
        self.tmp.cleanup()

    def enable(self):
        self.store.update_settings({"sessionKeys": [A["sessionKey"]], "suggestionsEnabled": True})

    def test_missing_is_off_but_corrupt_is_an_error(self):
        self.assertFalse(self.store.read_settings()["suggestionsEnabled"])
        (self.root / "settings.json").write_text("broken")
        with self.assertRaises(DraftError): self.store.read_settings()
        with self.assertRaises(ProposalDenied) as error:
            self.store.create(FIELDS, A, proactive=True, now=NOW)
        self.assertEqual(error.exception.code, "unavailable")
        self.assertEqual(self.store.list(), [])

    def test_strict_settings_and_roundtrip(self):
        for changes in [{"suggestionsEnabled": "false"}, {"sessionKeys": ["invalid reference"]}, {"timezone": "not/a-zone"}, {"unknown": True}]:
            with self.assertRaises(DraftError): self.store.update_settings(changes)
        self.enable()
        self.assertEqual(DraftStore(self.root).read_settings()["revision"], 1)
        self.store.update_settings({"suggestionsEnabled": False})
        self.assertFalse(DraftStore(self.root).read_settings()["suggestionsEnabled"])
        with self.assertRaises(DraftError): self.store.update_settings({"sessionKeys": [], "suggestionsEnabled": True})

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

    def test_duplicates_precede_frequency_and_preserve_dismissal(self):
        self.enable()
        first, _ = self.store.create(FIELDS, A, proactive=True, now=NOW)
        self.store.set_status(first["id"], "dismissed")
        again, duplicate = self.store.create({**FIELDS, "start": "2026-10-05T19:00:00+09:00"}, A, proactive=True, now=NOW)
        self.assertTrue(duplicate)
        self.assertEqual(again["status"], "dismissed")
        with self.assertRaises(ProposalDenied) as error:
            self.store.create({**FIELDS, "title": "다른 준비"}, A, proactive=True, now=NOW)
        self.assertEqual(error.exception.code, "cooldown")
        self.assertEqual(len(self.store.list()), 1)

    def test_new_deadline_allows_same_title_after_previous_dismissal(self):
        self.enable()
        first, _ = self.store.create(FIELDS, A, proactive=True, now=NOW)
        self.store.set_status(first["id"], "dismissed")
        next_fields = {**FIELDS, "start": "2026-10-12T19:00:00+09:00", "deadlineDate": "2026-10-13"}
        second, duplicate = self.store.create(next_fields, A, proactive=True,
            now=datetime(2026, 10, 10, tzinfo=timezone.utc))
        self.assertFalse(duplicate)
        self.assertNotEqual(first["id"], second["id"])
        self.assertEqual(second["status"], "proposed")

    def test_unknown_deadline_uses_local_day_and_legacy_key_is_not_permanent(self):
        self.enable()
        fields = {k:v for k,v in FIELDS.items() if k != "deadlineDate"}
        first, _ = self.store.create(fields, A, proactive=True, now=NOW)
        first.pop("deadlineDate", None)
        first["decisionKey"] = "legacy-title-only-key"
        self.store._write(first)
        # Same day shifted time remains the same candidate.
        self.assertTrue(self.store.create({**fields, "start":"2026-10-04T20:00:00+09:00"}, A,
            proactive=True, now=NOW)[1])
        second, duplicate = self.store.create({**fields, "start":"2026-10-12T19:00:00+09:00"}, A,
            proactive=True, now=datetime(2026,10,10,tzinfo=timezone.utc))
        self.assertFalse(duplicate)
        self.assertNotEqual(first["id"], second["id"])

    def test_long_hook_event_is_parsed_before_scope_checks(self):
        import io
        from proposal_hook import run
        from contextlib import redirect_stdout, redirect_stderr
        event = {**EVENT, "prompt": "가" * 33000}
        # Feed the actual JSON boundary, not just prompt_for's already-parsed input.
        for selected in (False, True):
            if selected: self.enable()
            out, err = io.StringIO(), io.StringIO()
            with patch("sys.stdin", io.StringIO(json.dumps(event))), redirect_stdout(out), redirect_stderr(err):
                with patch("proposal_hook.prompt_for", wraps=prompt_for) as parsed, patch("proposal_hook.app_active_for", return_value=True):
                    self.assertEqual(run(str(self.root)), 0)
            self.assertEqual(parsed.call_args.args[1]["prompt"], event["prompt"])
            self.assertEqual(err.getvalue(), "")
            if selected: self.assertIn("suggestions: ON", out.getvalue())
            else: self.assertEqual(out.getvalue(), "")

    def test_malformed_hook_input_does_not_inject_into_unidentified_chat(self):
        import io
        from proposal_hook import run
        from contextlib import redirect_stdout, redirect_stderr
        out, err = io.StringIO(), io.StringIO()
        with patch("sys.stdin", io.StringIO('{"prompt":')), redirect_stdout(out), redirect_stderr(err):
            self.assertEqual(run(str(self.root)), 1)
        self.assertEqual(out.getvalue(), "")
        self.assertIn("invalid event", err.getvalue())

    def test_utc_equivalent_and_legacy_offset_id_remain_duplicates(self):
        first, _ = self.store.create(FIELDS, A)
        self.assertTrue(self.store.create({**FIELDS, "start": "2026-10-04T10:00:00+00:00", "timezone": "UTC"}, A)[1])
        old = dict(first, id="1234567890123456")
        self.store._path(first["id"]).unlink()
        (self.store.root / (old["id"] + ".json")).write_text(json.dumps(old))
        self.assertEqual(self.store.create(FIELDS, A)[0]["id"], old["id"])

    def test_past_and_timezone_mismatch_refused(self):
        self.enable()
        for changed in [{"start": "2020-10-01T12:00:00+09:00"}, {"timezone": "UTC"}, {"reason": ""}, {"end": "2026-10-04T18:00:00+09:00"}]:
            with self.assertRaises(DraftError): self.store.create({**FIELDS, **changed}, A, proactive=True, now=NOW)
        self.assertEqual(self.store.list(), [])

    def test_same_hook_reads_on_off_on_and_old_scope_gets_off(self):
        self.enable()
        self.assertIn("suggestions: ON", prompt_for(self.store, EVENT, active=True, now=NOW))
        self.store.update_settings({"suggestionsEnabled": False})
        self.assertIn("suggestions: OFF", prompt_for(self.store, EVENT, active=True, now=NOW))
        self.store.update_settings({"suggestionsEnabled": True})
        self.assertIn("suggestions: ON", prompt_for(self.store, EVENT, active=True, now=NOW))
        self.store.update_settings({"sessionKeys": [], "suggestionsEnabled": False})
        self.assertIn("suggestions: OFF", prompt_for(self.store, EVENT, active=True, now=NOW))
        self.assertEqual(prompt_for(self.store, {**EVENT, "parent_session_key": B["sessionKey"]}, active=True), "")

    def test_hook_excludes_subagents_and_stops_after_app_disable(self):
        self.enable()
        self.assertEqual(prompt_for(self.store, {**EVENT, "subagent_id": "child"}, active=True), "")
        self.assertEqual(prompt_for(self.store, {**EVENT, "hook_event_name": "Stop"}, active=True), "")
        self.assertIn("OFF", prompt_for(self.store, EVENT, active=False))
        prompt_for(self.store, EVENT, active=True)
        (self.root / "settings.json").write_text("oops")
        self.assertIn("OFF", prompt_for(self.store, EVENT, active=True))

    def test_gateway_tenant_without_caller_never_falls_back(self):
        params = {"name": "create_schedule_draft", "arguments": FIELDS, "_meta": {"kirocrew.tenant": {}}}
        with patch("mcp_server.caller_from_host", return_value=A) as fallback:
            response = call_tool(self.store, params)
        fallback.assert_not_called()
        self.assertTrue(response["isError"])
        self.assertEqual(self.store.list(), [])

    def test_dismissed_response_is_explicit_and_disabled_tool_returns_no_proposal(self):
        params = {"name": "create_schedule_draft", "arguments": FIELDS,
                  "_meta": {"kirocrew.caller": {"schemaVersion": 1, **A}}}
        first = call_tool(self.store, params)
        self.store.set_status(first["structuredContent"]["draft"]["id"], "dismissed")
        repeated = call_tool(self.store, params)
        self.assertIn("previously dismissed", repeated["content"][0]["text"])
        with patch("mcp_server.connection_info", return_value={"status": "ready"}), patch("mcp_server.regular_session", return_value=True):
            response = call_tool(self.store, {**params, "name": "propose_schedule_draft"})
        self.assertEqual(response["structuredContent"]["outcome"], "disabled")

    def test_off_completion_precedes_other_process_attempt(self):
        self.enable()
        context = multiprocessing.get_context("spawn")
        ready, proceed, result = context.Event(), context.Event(), context.Queue()
        process = context.Process(target=attempt_after_off, args=(str(self.root), ready, proceed, result))
        process.start()
        try:
            self.assertTrue(ready.wait(5))
            self.store.update_settings({"suggestionsEnabled": False})
            proceed.set()
            self.assertEqual(result.get(timeout=5), "disabled")
            self.assertEqual(self.store.list(), [])
        finally:
            process.join(5)
            if process.is_alive(): process.terminate(); process.join()
            result.close()

if __name__ == "__main__": unittest.main()
