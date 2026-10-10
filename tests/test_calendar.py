"""External save state machine: no duplicate writes, immutable input, uncertain outcomes."""
from __future__ import annotations
import sys,tempfile,unittest,threading,copy
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from runtime import load
Services=load('composition').Services
CalendarService=load('calendar_service').CalendarService
CalendarStorage=load('calendar_storage').CalendarStorage
CalendarError=load('calendar_domain').CalendarError
DraftError=load('domain').DraftError
CalendarConnection=load('calendar_connections').CalendarConnection
CalendarConnections=load('calendar_connections').CalendarConnections
def registry(provider):
    return CalendarConnections([CalendarConnection('primary','test','Test account',provider)])
FIELDS={'title':'검증 일정','start':'2030-01-02T10:00:00+09:00','end':'2030-01-02T11:00:00+09:00','timezone':'Asia/Seoul'}
ORIGIN={'sessionKey':'dashboard:chat-test','identitySource':'test'}

class Provider:
    def __init__(self):
        self.calls=[];self.fail=None;self.event_override={};self.verify=None
        self.calendar_rows=[{'id':'a','title':'일정','sourceTitle':'개인','writable':True},
                        {'id':'b','title':'일정','sourceTitle':'업무','writable':False}]
    def request(self,action,payload=None):
        self.calls.append(action)
        if action=='status':return {'state':'ready','capabilities':{'read':True,'create':True,'reconcile':True},'confirmation':{'mode':'app','actionLabel':'저장 내용 확인','pendingMessage':'저장 결과 확인 중'}}
        if action=='calendars':return {'calendars':copy.deepcopy(self.calendar_rows)}
        if action=='create':
            if self.fail:raise self.fail
            op=payload['operation'];p=op['payload']
            return {'state':'confirmed','event':{'eventId':'remote-1','calendarId':op['target']['calendarId'],**p,'allDay':False,'recurring':False,**self.event_override}}
        if action=='reconcile':return self.verify or {'state':'unknown'}
        if action=='events':return {'events':[],'errors':[]}
        raise AssertionError(action)
    def status(self):return self.request('status')
    def authorize(self):return self.status()
    def calendars(self):return self.request('calendars')['calendars']
    def events(self, ids, start, end):return self.request('events',{'calendarIds':ids,'start':start,'end':end})
    def create(self, operation):return self.request('create',{'operation':operation})
    def reconcile(self, operation):return self.request('reconcile',{'operation':operation})

class CalendarTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.services=Services(self.tmp.name);self.provider=Provider()
        self.service=CalendarService(self.services.drafts,CalendarStorage(self.tmp.name),registry(self.provider))
        self.draft=self.services.drafts.create(FIELDS,ORIGIN)[0]
    def tearDown(self):self.tmp.cleanup()
    def prepare(self,target='a'):
        return self.service.prepare({'draftId':self.draft['id'],'revision':self.draft.get('revision',1),'target':{'connectionId':'primary','calendarId':target}})
    def test_legacy_draft_default_revision_and_edit(self):
        self.draft.pop('revision');self.services.repository.save_draft(self.draft)
        self.assertEqual(self.service.list_drafts()[0]['revision'],1)
        edited=self.service.edit(self.draft['id'],{**FIELDS,'title':'Changed','revision':1})
        self.assertEqual(edited['revision'],2)
        with self.assertRaises(CalendarError):self.service.edit(self.draft['id'],{**FIELDS,'revision':1})
    def test_prepare_does_not_write_and_exact_target_is_required(self):
        op=self.prepare();self.assertEqual(op['state'],'prepared');self.assertNotIn('create',self.provider.calls)
        self.assertEqual(self.prepare()['id'],op['id'])
        with self.assertRaises(CalendarError):self.prepare('b')
        with self.assertRaises(CalendarError):self.prepare('missing')
    def test_changed_draft_invalidates_preparation(self):
        op=self.prepare();self.service.edit(self.draft['id'],{**FIELDS,'revision':1,'title':'Updated'})
        with self.assertRaises(CalendarError):self.service.claim(op['id'])
        self.assertNotIn('create',self.provider.calls)
    def test_concurrent_claims_only_one_executes(self):
        op=self.prepare()
        with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(lambda _:self.service.claim(op['id']),range(4)))
        self.assertEqual(sum(claimed for _,claimed in results),1)
        result=self.service.execute_claimed(op['id']);self.assertEqual(result['state'],'confirmed')
        with self.assertRaises(CalendarError):self.prepare()
        with self.assertRaises(CalendarError):self.service.dismiss(self.draft['id'])
        self.assertFalse(self.service.claim(op['id'])[1])
    def test_io_not_inside_transaction(self):
        original=self.provider.request
        def request(action,payload=None):
            if action=='create':
                # A different thread can acquire the same cross-process flock while provider runs.
                def probe():
                    with self.services.repository.transaction(): return True
                with ThreadPoolExecutor() as pool:self.assertTrue(pool.submit(probe).result(timeout=2))
            return original(action,payload)
        self.provider.request=request;op=self.prepare();self.service.claim(op['id']);self.service.execute_claimed(op['id'])
    def test_unknown_outcome_blocks_new_write_and_can_reconcile(self):
        op=self.prepare();self.service.claim(op['id']);self.provider.fail=CalendarError('outcome_unknown','timeout')
        self.assertEqual(self.service.execute_claimed(op['id'])['state'],'unknown')
        with self.assertRaises(CalendarError):self.prepare()
        self.assertFalse(self.service.claim(op['id'])[1])
        self.provider.fail=None;self.provider.verify=self.provider.request('create',{'operation':op})
        self.assertEqual(self.service.reconcile(op['id'])['state'],'confirmed')
    def test_mismatched_readback_never_reports_confirmed(self):
        for override in [{'calendarId':'b'},{'start':'2030-01-02T12:00:00+09:00'},{'notes':'changed'},{'recurring':True}]:
            with self.subTest(override=override):
                self.provider.event_override=override
                op=self.prepare();self.service.claim(op['id']);result=self.service.execute_claimed(op['id'])
                self.assertEqual(result['state'],'unknown')
                # Separate draft for the next subcase; do not reset an unknown operation.
                self.draft=self.services.drafts.create({**FIELDS,'title':str(override)},ORIGIN)[0]
    def test_no_fallback_to_different_calendar(self):
        self.service.select({'connectionId':'primary','selectedCalendarIds':['a','b'],'defaultCalendarId':'a'})
        self.provider.calendar_rows=[self.provider.calendar_rows[1]]
        with self.assertRaises(CalendarError):self.prepare('a')
        self.assertNotIn('create',self.provider.calls)
    def test_edit_dismiss_blocked_while_waiting(self):
        op=self.prepare();self.service.claim(op['id'])
        with self.assertRaises(CalendarError):self.service.edit(self.draft['id'],{**FIELDS,'revision':1})
        with self.assertRaises(CalendarError):self.service.dismiss(self.draft['id'])
    def test_confirmed_event_missing_does_not_allow_recreation(self):
        op=self.prepare();self.service.claim(op['id']);self.service.execute_claimed(op['id'])
        self.provider.verify={'state':'unknown','error':{'message':'missing'}}
        result=self.service.reconcile(op['id']);self.assertEqual(result['state'],'confirmed');self.assertEqual(result['verification']['state'],'unknown')
        with self.assertRaises(CalendarError):self.prepare()
    def test_unsupported_creation_fields_are_rejected(self):
        for extra in [{'allDay':True},{'recurrence':'daily'},{'attendees':['someone']},{'end':'2030-02-03T10:00:00+09:00'}]:
            with self.subTest(extra=extra),self.assertRaises(DraftError):self.service.edit(self.draft['id'],{**FIELDS,'revision':1,**extra})
    def test_snapshot_survives_restart(self):
        op=self.prepare();self.service.claim(op['id'])
        reopened=CalendarService(Services(self.tmp.name).drafts,CalendarStorage(self.tmp.name),registry(Provider()))
        self.assertFalse(reopened.claim(op['id'])[1])
        with self.assertRaises(CalendarError):reopened.prepare({'draftId':self.draft['id'],'revision':1,'target':op['target']})
    def test_repeated_original_mcp_input_does_not_overwrite_edited_draft(self):
        edited=self.service.edit(self.draft['id'],{**FIELDS,'revision':1,'title':'Edited by user'})
        new,duplicate=self.services.drafts.create(FIELDS,ORIGIN)
        self.assertFalse(duplicate);self.assertNotEqual(new['id'],edited['id'])
        self.assertEqual(self.services.repository.get_draft(edited['id'])['title'],'Edited by user')
    def test_external_success_local_record_failure_keeps_write_locked(self):
        from unittest.mock import patch
        op=self.prepare();self.service.claim(op['id'])
        failure=load('domain').StorageUnavailable('disk full')
        with patch.object(self.service.storage,'save_operation',side_effect=failure):
            with self.assertRaises(type(failure)):self.service.execute_claimed(op['id'])
        self.assertEqual(self.service.get_operation(op['id'])['state'],'awaiting_confirmation')
        self.assertFalse(self.service.claim(op['id'])[1])
        with self.assertRaises(CalendarError):self.prepare()
    def test_notes_keep_line_breaks(self):
        result=self.service.edit(self.draft['id'],{**FIELDS,'revision':1,'notes':'첫 줄\n둘째 줄'})
        self.assertEqual(result['notes'],'첫 줄\n둘째 줄')
