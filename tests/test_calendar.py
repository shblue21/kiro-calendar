"""External save state machine: no duplicate writes, immutable input, uncertain outcomes."""
from __future__ import annotations
import sys,tempfile,unittest,uuid
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from runtime import load
Services=load('composition').Services
CalendarService=load('calendar_service').CalendarService
CalendarStorage=load('calendar_storage').CalendarStorage
CalendarError=load('calendar_domain').CalendarError
CalendarConnection=load('calendar_connections').CalendarConnection
CalendarConnections=load('calendar_connections').CalendarConnections
def registry(provider):
    return CalendarConnections([CalendarConnection('primary','test','Test account',provider)])
FIELDS={'title':'검증 일정','start':'2030-01-02T10:00:00+09:00','end':'2030-01-02T11:00:00+09:00','timezone':'Asia/Seoul'}
ORIGIN={'sessionKey':'dashboard:chat-test','identitySource':'test'}

class Provider:
    """Small boundary fake; storage and the save state machine remain real."""
    def __init__(self):
        self.fail = None
        self.event_override = {}
        self.verify = None
        self.created = 0

    def status(self):
        return {'state':'ready', 'capabilities':{'read':True,'create':True,'reconcile':True},
                'confirmation':{'mode':'app','actionLabel':'저장','pendingMessage':'확인 중'}}

    def calendars(self):
        return [{'id':'a','title':'일정','sourceTitle':'개인','writable':True}]

    def create(self, op):
        self.created += 1
        if self.fail:
            raise self.fail
        return {'state':'confirmed','event':{'eventId':'remote-1','calendarId':op['target']['calendarId'],
                **op['payload'],'allDay':False,'recurring':False,**self.event_override}}

    def reconcile(self, op):
        return self.verify or {'state':'unknown'}

class CalendarTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.services=Services(self.tmp.name);self.provider=Provider()
        self.service=CalendarService(self.services.drafts,CalendarStorage(self.tmp.name),registry(self.provider))
        self.item=self.service.items.create({**FIELDS,'destination':{'connectionId':'primary','calendarId':'a'},'requestId':str(uuid.uuid4())})
    def tearDown(self):self.tmp.cleanup()
    def prepare(self,target='a'):
        return self.service.prepare({'draftId':self.item['id'],'revision':self.item.get('revision',1),'target':{'connectionId':'primary','calendarId':target}})
    def test_concurrent_claims_only_one_executes(self):
        op=self.prepare()
        with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(lambda _:self.service.claim(op['id']),range(4)))
        self.assertEqual(sum(claimed for _,claimed in results),1)
        result=self.service.execute_claimed(op['id']);self.assertEqual(result['state'],'confirmed')
        with self.assertRaises(CalendarError):self.prepare()
        with self.assertRaises(CalendarError):self.service.dismiss(self.item['id'])
        self.assertFalse(self.service.claim(op['id'])[1])
        self.assertEqual(self.provider.created,1)
    def test_unknown_outcome_blocks_new_write_and_can_reconcile(self):
        op=self.prepare();self.service.claim(op['id']);self.provider.fail=CalendarError('outcome_unknown','timeout')
        self.assertEqual(self.service.execute_claimed(op['id'])['state'],'unknown')
        self.service=CalendarService(Services(self.tmp.name).drafts,CalendarStorage(self.tmp.name),registry(self.provider))
        with self.assertRaises(CalendarError):self.service.edit(self.item['id'],{**FIELDS,'revision':1})
        with self.assertRaises(CalendarError):self.service.dismiss(self.item['id'])
        with self.assertRaises(CalendarError):self.prepare()
        self.assertFalse(self.service.claim(op['id'])[1])
        self.provider.fail=None;self.provider.verify={'state':'confirmed','event':{'eventId':'remote-1','calendarId':'a',**op['payload'],'allDay':False,'recurring':False}}
        self.assertEqual(self.service.reconcile(op['id'])['state'],'confirmed')
    def test_mismatched_readback_never_reports_confirmed(self):
        for override in [{'calendarId':'b'},{'start':'2030-01-02T12:00:00+09:00'},{'notes':'changed'},{'recurring':True}]:
            with self.subTest(override=override):
                self.provider.event_override=override
                op=self.prepare();self.service.claim(op['id']);result=self.service.execute_claimed(op['id'])
                self.assertEqual(result['state'],'unknown')
                # Separate event for the next subcase; do not reset an unknown operation.
                self.item=self.service.items.create({**FIELDS,'title':str(override),'destination':{'connectionId':'primary','calendarId':'a'},'requestId':str(uuid.uuid4())})
    def test_external_success_local_record_failure_keeps_write_locked(self):
        from unittest.mock import patch
        op=self.prepare();self.service.claim(op['id'])
        failure=load('domain').StorageUnavailable('disk full')
        with patch.object(self.service.storage,'save_operation',side_effect=failure):
            with self.assertRaises(type(failure)):self.service.execute_claimed(op['id'])
        self.assertEqual(self.service.get_operation(op['id'])['state'],'awaiting_confirmation')
        self.assertFalse(self.service.claim(op['id'])[1])
        with self.assertRaises(CalendarError):self.prepare()
