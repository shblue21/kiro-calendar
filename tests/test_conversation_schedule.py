from __future__ import annotations
import json
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

from tests.support import use_timezone, TEST_TIMEZONE, local_time, Services, load

ConversationSchedule = load("conversation_schedule").ConversationSchedule
CalendarError = load("calendar_domain").CalendarError
DraftError = load("domain").DraftError
host = load("host")
mcp = load("mcp_server")
hook = load("proposal_hook")
CALLER = {
    "sessionKey": "dashboard:chat-conversation-test",
    "sessionType": "dashboard",
    "identitySource": "test",
}
OTHER = {**CALLER, "sessionKey": "dashboard:chat-other"}
FIELDS = {
    "title": "지원서 초안",
    "start": local_time("2030-01-02T19:00:00"),
    "end": local_time("2030-01-02T19:30:00"),
    "timezone": TEST_TIMEZONE,
}


class ConversationScheduleTest(unittest.TestCase):
    def setUp(self):
        use_timezone(self)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.services = Services(self.tmp.name)
        self.items = self.services.calendar().items
        self.schedule = ConversationSchedule(self.items, lambda session: True)

    def fields(self, **changes):
        return {
            **FIELDS,
            "requestId": self.schedule.context(CALLER)["requestId"],
            **changes,
        }

    def test_context_stores_nothing_and_registration_preserves_origin(self):
        files = {p for p in Path(self.tmp.name).rglob("*") if p.is_file()}
        fields = self.fields()
        self.assertNotEqual(self.fields()["requestId"], fields["requestId"])
        self.assertEqual(
            files, {p for p in Path(self.tmp.name).rglob("*") if p.is_file()}
        )
        self.assertEqual(self.services.repository.items(), [])
        saved = self.schedule.register(fields, CALLER)
        self.assertFalse(saved["replayed"])
        self.assertEqual(saved["item"]["origin"], CALLER)
        self.assertEqual(saved["item"]["status"], "confirmed")
        self.assertNotIn("delivery", saved["item"])

    def test_same_request_concurrency_and_replay_after_edit_and_delete(self):
        fields = self.fields()
        with ThreadPoolExecutor(max_workers=4) as pool:
            rows = list(
                pool.map(lambda _: self.schedule.register(fields, CALLER), range(4))
            )
        self.assertEqual(len({row["item"]["id"] for row in rows}), 1)
        self.assertEqual(sum(not row["replayed"] for row in rows), 1)
        first = rows[0]["item"]
        edited = self.items.edit(
            first["id"],
            {**FIELDS, "title": "수정한 제목", "revision": first["revision"]},
        )
        replay = self.schedule.register(fields, CALLER)
        self.assertTrue(replay["replayed"])
        self.assertEqual(replay["item"], edited)
        deleted = self.items.set_deleted(
            first["id"], {"revision": edited["revision"]}, True
        )
        self.assertEqual(self.schedule.register(fields, CALLER)["item"], deleted)
        self.assertEqual(len(self.services.repository.items()), 1)

    def test_new_request_with_identical_content_is_not_aliased_to_old_event(self):
        first = self.schedule.register(self.fields(), CALLER)["item"]
        edited = self.items.edit(
            first["id"],
            {
                **FIELDS,
                "start": local_time("2030-01-02T20:00:00"),
                "end": local_time("2030-01-02T20:30:00"),
                "revision": 1,
            },
        )
        second = self.schedule.register(self.fields(), CALLER)["item"]
        self.assertNotEqual(first["id"], second["id"])
        self.assertEqual(second["start"], FIELDS["start"])
        self.items.set_deleted(second["id"], {"revision": second["revision"]}, True)
        third = self.schedule.register(self.fields(), CALLER)["item"]
        self.assertNotIn("deletedAt", third)
        self.assertEqual(len(self.services.repository.items()), 3)
        self.assertEqual(self.services.repository.get_item(first["id"]), edited)

    def test_existing_draft_is_accepted_in_place_once(self):
        draft = self.services.drafts.create(FIELDS, CALLER)[0]
        context = self.schedule.context(CALLER, draft["id"])
        fields = {
            **FIELDS,
            "requestId": context["requestId"],
            "draftId": draft["id"],
            "revision": context["draft"]["revision"],
        }
        with ThreadPoolExecutor(max_workers=3) as pool:
            results = list(
                pool.map(lambda _: self.schedule.register(fields, CALLER), range(3))
            )
        self.assertEqual(sum(not r["replayed"] for r in results), 1)
        item = results[0]["item"]
        self.assertEqual(item["id"], draft["id"])
        self.assertEqual(item["origin"], CALLER)
        self.assertEqual(item["status"], "confirmed")
        self.assertEqual(len(self.services.repository.items()), 1)
        # A request cannot change from draft acceptance to event creation.
        with self.assertRaises(CalendarError):
            self.schedule.register({**FIELDS, "requestId": fields["requestId"]}, CALLER)

    def test_request_conflict_and_stale_draft_never_write_a_second_event(self):
        fields = self.fields()
        self.schedule.register(fields, CALLER)
        with self.assertRaises(CalendarError):
            self.schedule.register({**fields, "title": "다른 내용"}, CALLER)
        draft = self.services.drafts.create({**FIELDS, "title": "보관한 초안"}, CALLER)[
            0
        ]
        with self.assertRaises(CalendarError):
            self.schedule.register(
                {**fields, "draftId": draft["id"], "revision": 1}, CALLER
            )
        edited = self.items.edit(
            draft["id"], {**FIELDS, "title": "갱신된 초안", "revision": 1}
        )
        with self.assertRaises(CalendarError):
            self.schedule.register(self.fields(draftId=draft["id"], revision=1), CALLER)
        self.assertEqual(self.services.repository.get_item(draft["id"]), edited)
        self.assertEqual(len(self.services.repository.items()), 2)

    def test_caller_and_destination_boundaries(self):
        fields = self.fields()
        self.schedule.register(fields, CALLER)
        with self.assertRaises(CalendarError):
            self.schedule.register(fields, OTHER)
        draft = self.services.drafts.create(FIELDS, CALLER)[0]
        with self.assertRaises(CalendarError):
            self.schedule.context(OTHER, draft["id"])
        with self.assertRaises(CalendarError):
            self.schedule.register(self.fields(draftId=draft["id"], revision=1), OTHER)
        for changed in (
            {"end": None},
            {"destination": {"connectionId": "apple", "calendarId": "a"}},
            {"draftId": ""},
        ):
            with self.assertRaises(DraftError):
                self.schedule.register(self.fields(**changed), CALLER)
        self.schedule.is_available = lambda session: False
        with self.assertRaises(DraftError):
            self.schedule.register(fields, CALLER)

    def test_explicit_registration_is_independent_of_hook_and_automatic_scope(self):
        self.assertFalse(self.services.settings.read()["suggestionsEnabled"])
        with (
            patch.object(host, "app_active_for", return_value=True),
            patch.object(
                host,
                "connection_info",
                side_effect=AssertionError(
                    "Hook diagnostics must not gate registration"
                ),
            ),
        ):
            schedule = self.services.conversation_schedule()
            fields = {**FIELDS, "requestId": schedule.context(CALLER)["requestId"]}
            self.assertFalse(schedule.register(fields, CALLER)["replayed"])

    def test_mcp_text_contains_request_and_result_for_content_only_clients(self):
        meta = {
            "kirocrew.caller": {
                "schemaVersion": 1,
                "sessionKey": CALLER["sessionKey"],
                "sessionType": "dashboard",
            }
        }
        with patch.object(host, "app_active_for", return_value=True):
            context = mcp.call_tool(
                self.services, {"name": "get_schedule_context", "_meta": meta}
            )
            self.assertFalse(context["isError"])
            text_data = json.loads(context["content"][1]["text"])
            self.assertEqual(text_data, context["structuredContent"])
            args = {**FIELDS, "requestId": text_data["requestId"]}
            params = {"name": "register_schedule", "_meta": meta, "arguments": args}
            saved = mcp.call_tool(self.services, params)
            self.assertEqual(saved["structuredContent"]["outcome"], "registered")
            self.assertEqual(
                mcp.call_tool(self.services, params)["structuredContent"]["outcome"],
                "replayed",
            )

    def test_hook_only_supplies_conversation_guidance(self):
        self.services.settings.update(
            {"suggestionsEnabled": True, "sessionKeys": [CALLER["sessionKey"]]}
        )
        event = {
            "hook_event_name": "UserPromptSubmit",
            "session_key": CALLER["sessionKey"],
            "prompt": "지원서 써야 하는데",
        }
        text = hook.prompt_for(self.services, event, active=True)
        self.assertIn("[OPTIONS:", text)
        self.assertEqual(self.services.repository.items(), [])
        record = json.loads(
            next((Path(self.tmp.name) / "hook-sessions").glob("*.json")).read_text()
        )
        self.assertNotIn("requestId", record)
        self.assertNotIn("prompt", record)
        self.assertEqual(
            hook.prompt_for(
                self.services, {**event, "subagent_id": "agent-a"}, active=True
            ),
            "",
        )
        self.services.settings.update({"suggestionsEnabled": False})
        self.assertIn("OFF", hook.prompt_for(self.services, event, active=True))

    def test_off_is_emitted_once_per_on_to_off_transition(self):
        session = CALLER["sessionKey"]
        for change in ("disabled", "unselected", "inactive", "settings_unavailable"):
            with self.subTest(change=change):
                self.services.settings.update(
                    {"suggestionsEnabled": True, "sessionKeys": [session]}
                )
                self.assertIn(
                    "ON", self.services.contexts.for_session(session, active=True)
                )
                active = change != "inactive"
                if change == "disabled":
                    self.services.settings.update({"suggestionsEnabled": False})
                elif change == "unselected":
                    self.services.settings.update(
                        {"sessionKeys": [OTHER["sessionKey"]]}
                    )

                def run():
                    with ThreadPoolExecutor(max_workers=3) as pool:
                        return list(
                            pool.map(
                                lambda _: self.services.contexts.for_session(
                                    session, active=active
                                ),
                                range(3),
                            )
                        )

                if change == "settings_unavailable":
                    with patch.object(
                        self.services.settings,
                        "read",
                        side_effect=DraftError("unavailable"),
                    ):
                        outputs = run()
                else:
                    outputs = run()
                self.assertEqual(sum(bool(output) for output in outputs), 1)
                self.assertIn("OFF", next(output for output in outputs if output))
                self.assertFalse(self.services.repository.was_enabled(session))

    def test_never_enabled_chat_has_no_off_guidance_or_application_record(self):
        session = CALLER["sessionKey"]
        self.services.settings.update({"sessionKeys": [session]})
        self.assertEqual(self.services.contexts.for_session(session, active=True), "")
        self.assertFalse((Path(self.tmp.name) / "hook-sessions").exists())
        self.services.settings.update({"suggestionsEnabled": True})
        self.assertIn("ON", self.services.contexts.for_session(session, active=True))
        self.assertIn("ON", self.services.contexts.for_session(session, active=True))
        self.assertEqual(
            self.services.contexts.for_session(OTHER["sessionKey"], active=True), ""
        )


if __name__ == "__main__":
    unittest.main()
