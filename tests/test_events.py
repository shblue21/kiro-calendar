"""Core local calendar flows with real file storage."""
import json
import tempfile
import unittest
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch
from test_calendar import Services, CalendarError, FIELDS, ORIGIN, load

CREW = {'connectionId':'crew','calendarId':'default'}
StorageUnavailable = load('domain').StorageUnavailable


class EventTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.services = Services(self.root)
        self.service = self.services.calendar()

    def tearDown(self):
        self.temp.cleanup()

    def fields(self):
        return {**FIELDS, 'notes':'첫 줄\n둘째 줄', 'destination':CREW, 'requestId':str(uuid.uuid4())}

    def test_create_edit_delete_restore_and_restart(self):
        fields = self.fields()
        item = self.service.items.create(fields)
        self.assertEqual(item['status'], 'confirmed')
        self.assertEqual(item['notes'], fields['notes'])
        edited = self.service.items.edit(item['id'], {**FIELDS,'title':'수정','revision':1})
        with self.assertRaises(CalendarError):
            self.service.items.edit(item['id'], {**FIELDS,'revision':1})
        deleted = self.service.items.set_deleted(item['id'], {'revision':edited['revision']}, True)
        self.assertTrue(deleted['deletedAt'])
        self.assertEqual(self.service.items.create(fields), deleted)  # Replay cannot resurrect.
        restored = self.service.items.set_deleted(item['id'], {'revision':deleted['revision']}, False)
        self.assertFalse(restored['deletedAt'])
        self.assertEqual(restored['title'], '수정')
        self.assertEqual(Services(self.root).repository.get_item(item['id']), restored)

    def test_concurrent_creation_is_one_event(self):
        fields = self.fields()
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(lambda _:self.service.items.create(fields), range(4)))
        self.assertEqual(len({item['id'] for item in results}), 1)
        self.assertEqual(len(self.services.repository.items()), 1)
        with self.assertRaises(CalendarError):
            self.service.items.create({**fields,'title':'다른 내용'})

    def test_accept_proposal_once_without_changing_identity(self):
        proposal = self.services.drafts.create(FIELDS, ORIGIN)[0]
        fields = {**self.fields(), 'revision':1}
        accepted = self.service.items.accept(proposal['id'], fields)
        self.assertEqual(accepted['id'], proposal['id'])
        self.assertEqual(accepted['origin'], proposal['origin'])
        self.assertEqual(accepted['status'], 'confirmed')
        self.assertEqual(self.service.items.accept(proposal['id'], fields), accepted)
        self.assertEqual(self.service.list_drafts(), [])
        self.assertEqual(len(self.services.repository.items()), 1)

    def test_disk_failure_preserves_unaccepted_proposal(self):
        proposal = self.services.drafts.create(FIELDS, ORIGIN)[0]
        with patch.object(load('repository').os, 'replace', side_effect=OSError('disk full')):
            with self.assertRaises(StorageUnavailable):
                self.service.items.accept(proposal['id'], {**self.fields(),'revision':1})
        self.assertEqual(self.services.repository.get_item(proposal['id']), proposal)
        self.assertFalse(list(self.services.repository.root.glob('.tmp-*')))

    def test_legacy_migration_preserves_proposal_and_uncertain_external_save(self):
        legacy = self.root/'drafts'
        operations = self.root/'calendar/operations'
        legacy.mkdir()
        operations.mkdir(parents=True)
        item = {**FIELDS,'id':'1'*16,'origin':ORIGIN,'status':'proposed','source':'manual','createdAt':'2026-01-01T00:00:00Z'}
        raw = json.dumps(item)
        (legacy/f"{item['id']}.json").write_text(raw)
        external = {**item,'id':'2'*16}
        (legacy/f"{external['id']}.json").write_text(json.dumps(external))
        op = {'id':'3'*32,'draftId':external['id'],'state':'unknown','createdAt':item['createdAt'],
              'target':{'connectionId':'apple-local','calendarId':'a'}}
        (operations/f"{op['id']}.json").write_text(json.dumps(op))
        migrated = Services(self.root).calendar().list_items()
        records = {i['id']:i for i in migrated}
        self.assertEqual(records[item['id']]['status'], 'proposed')
        self.assertEqual(records[external['id']]['calendarOperation']['state'], 'unknown')
        self.assertEqual(records[external['id']]['destination'], op['target'])
        for old in [item, external]:
            self.assertTrue(all(records[old['id']][k] == old[k] for k in ['id','title','start','end','origin']))
        self.assertEqual((legacy/f"{item['id']}.json").read_text(), raw)
        self.assertEqual((self.root/'calendar/migration-v2-backup/drafts'/f"{item['id']}.json").read_text(), raw)
        self.assertEqual(Services(self.root).calendar().list_items(), migrated)
