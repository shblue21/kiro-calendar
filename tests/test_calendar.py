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
        return self.service.prepare(self.item['id'], self.item['revision'])
    def test_concurrent_claims_only_one_executes(self):
        op=self.prepare()
        with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(lambda _:self.service.claim(self.item['id'],op['id']),range(4)))
        self.assertEqual(sum(claimed for _,claimed in results),1)
        result=self.service.execute_claimed(self.item['id'],op['id']);self.assertEqual(result['state'],'confirmed')
        with self.assertRaises(CalendarError):self.prepare()
        with self.assertRaises(CalendarError):self.service.items.dismiss(self.item['id'],{'revision':self.item['revision']})
        self.assertFalse(self.service.claim(self.item['id'],op['id'])[1])
        self.assertEqual(self.provider.created,1)
        self.service.select({'connectionId':'primary','selectedCalendarIds':['a']})
        self.provider.events=lambda *_:{'events':[{**result['event'],'start':'2030-01-02T12:00:00+09:00','end':'2030-01-02T13:00:00+09:00'}]}
        linked=self.service.events('2030-01-01T00:00:00Z','2030-01-04T00:00:00Z')['events'][0]
        self.assertEqual(linked['itemId'],self.item['id'])
        self.assertEqual(linked['origin'],self.item['origin'])
        self.assertEqual(linked['connectionName'],{'kind':'custom','text':'Test account'})
        warnings=[{'calendarId':'a','code':'events_truncated','limit':5000}, {'calendarId':'b','code':'calendar_missing'}]
        self.provider.events=lambda *_:{'events':[result['event']],'errors':warnings,'truncated':True}
        partial=self.service.events('2030-01-01T00:00:00Z','2030-01-04T00:00:00Z')
        self.assertEqual(len(partial['events']),1)
        self.assertEqual(partial['errors'],[{**w,'connectionId':'primary'} for w in warnings])
        self.assertEqual(self.services.calendar().connections.get('apple-local').display_name(),{'kind':'system','key':'appleLocal'})

        # A read started before completion cannot undo terminal cancellation/failure.
        from threading import Event
        for terminal in ['cancelled','failed']:
            with self.subTest(terminal=terminal):
                self.item=self.service.items.create({**FIELDS,'destination':{'connectionId':'primary','calendarId':'a'},'requestId':str(uuid.uuid4())})
                op=self.prepare();self.service.claim(self.item['id'],op['id'])
                entered,release=Event(),Event()
                def stale_read(_):
                    entered.set();release.wait(5);return {'state':'unknown'}
                self.provider.reconcile=stale_read
                self.provider.create=lambda _: {'state':terminal}
                with ThreadPoolExecutor() as pool:
                    future=pool.submit(self.service.reconcile,self.item['id'],op['id'])
                    try:
                        self.assertTrue(entered.wait(5))
                        self.assertEqual(self.service.execute_claimed(self.item['id'],op['id'])['state'],terminal)
                    finally: release.set()
                    self.assertEqual(future.result()['state'],terminal)
                self.assertIn('submit',load('entry_policy').actions(self.service.repository.get_item(self.item['id'])))
        from unittest.mock import patch
        self.item=self.service.items.create({**FIELDS,'destination':{'connectionId':'primary','calendarId':'a'},'requestId':str(uuid.uuid4())})
        old=self.prepare()
        with patch.object(load('calendar_service'),'system_timezone',return_value='UTC'):
            fresh=self.prepare()
            self.assertNotEqual(old['id'],fresh['id'])
            self.assertEqual(fresh['payload']['start'],'2030-01-02T01:00:00+00:00')
            with self.assertRaises(CalendarError):self.service.claim(self.item['id'],old['id'])
            self.assertTrue(self.service.claim(self.item['id'],fresh['id'])[1])
    def test_unknown_outcome_blocks_new_write_and_can_reconcile(self):
        op=self.prepare();self.service.claim(self.item['id'],op['id']);self.provider.fail=CalendarError('unexpected_provider_error','failure after dispatch')
        self.assertEqual(self.service.execute_claimed(self.item['id'],op['id'])['state'],'unknown')
        self.service=CalendarService(Services(self.tmp.name).drafts,CalendarStorage(self.tmp.name),registry(self.provider))
        with self.assertRaises(CalendarError):self.service.items.edit(self.item['id'],{**FIELDS,'revision':1})
        with self.assertRaises(CalendarError):self.service.items.dismiss(self.item['id'],{'revision':self.item['revision']})
        with self.assertRaises(CalendarError):self.prepare()
        self.assertFalse(self.service.claim(self.item['id'],op['id'])[1])
        self.provider.fail=None;self.provider.verify={'state':'cancelled'}
        self.assertEqual(self.service.reconcile(self.item['id'],op['id'])['state'],'cancelled')
        removed=self.service.items.set_deleted(self.item['id'],{'revision':self.item['revision']},True)
        self.item=self.service.items.set_deleted(self.item['id'],{'revision':removed['revision']},False)
        corrected=self.service.items.edit(self.item['id'],{**FIELDS,'revision':self.item['revision'],'title':'Corrected'})
        with self.assertRaises(CalendarError):self.service.claim(self.item['id'],op['id'])
        new=self.service.prepare(corrected['id'],corrected['revision'])
        local=self.service.items.edit(corrected['id'],{**FIELDS,'revision':corrected['revision'],'destination':{'connectionId':'crew','calendarId':'default'}})
        with self.assertRaises(CalendarError):self.service.claim(local['id'],new['id'])
        removed=self.service.items.set_deleted(local['id'],{'revision':local['revision']},True)
        self.assertTrue(removed['deletedAt'])
    def test_mismatched_readback_never_reports_confirmed(self):
        for override in [{'calendarId':'b'},{'start':'2030-01-02T12:00:00+09:00'},{'notes':'changed'},{'recurring':True}]:
            with self.subTest(override=override):
                self.provider.event_override=override
                op=self.prepare();self.service.claim(self.item['id'],op['id']);result=self.service.execute_claimed(self.item['id'],op['id'])
                self.assertEqual(result['state'],'unknown')
                # Separate event for the next subcase; do not reset an unknown operation.
                self.item=self.service.items.create({**FIELDS,'title':str(override),'destination':{'connectionId':'primary','calendarId':'a'},'requestId':str(uuid.uuid4())})
        self.item=self.service.items.create({**FIELDS,'start':'2030-01-02T10:00:00.123456+09:00','end':'2030-01-02T11:00:00.654321+09:00','destination':{'connectionId':'primary','calendarId':'a'},'requestId':str(uuid.uuid4())})
        self.assertEqual(self.item['start'],'2030-01-02T10:00:00+09:00')
        self.provider.event_override={'start':'2030-01-02T01:00:00Z','end':'2030-01-02T02:00:00Z'}
        op=self.prepare();self.service.claim(self.item['id'],op['id'])
        self.assertEqual(self.service.execute_claimed(self.item['id'],op['id'])['state'],'confirmed')
        with self.assertRaises(load('domain').DraftError):
            load('calendar_domain').event_payload({**FIELDS,'start':'2030-01-02T10:00:00.1+09:00','end':'2030-01-02T10:00:00.9+09:00'})
    def test_external_success_local_record_failure_keeps_write_locked(self):
        from unittest.mock import patch
        op=self.prepare();self.service.claim(self.item['id'],op['id'])
        failure=load('domain').StorageUnavailable('disk full')
        with patch.object(self.service.repository,'save_item',side_effect=failure):
            with self.assertRaises(type(failure)):self.service.execute_claimed(self.item['id'],op['id'])
        self.assertEqual(self.service.get_operation(self.item['id'],op['id'])['state'],'awaiting_confirmation')
        self.assertFalse(self.service.claim(self.item['id'],op['id'])[1])
        with self.assertRaises(CalendarError):self.prepare()

    def test_native_delivery_envelope_preserves_outcome_and_diagnostics(self):
        import json
        from unittest.mock import patch
        apple = load('apple_provider').AppleCalendarProvider(Path(self.tmp.name), Path(self.tmp.name))
        response = {}
        def respond(args, **kwargs):
            Path(args[-1]).with_name('response.json').write_text(json.dumps(response))
        with patch('platform.system', return_value='Darwin'), patch('pathlib.Path.is_file', return_value=True), patch('subprocess.run', side_effect=respond), patch.object(self.provider, 'create', side_effect=apple.create):
            for response, expected in [
                ({'state':'unknown','error':{'code':'event_changed','message':'Saved event changed'}}, 'unknown'),
                ({'state':'failed','error':{'code':'read_only','message':'No write occurred'}}, 'failed'),
                ({'state':'cancelled'}, 'cancelled'),
                ({'error':{'code':'unexpected_failure','message':'No outcome supplied'}}, 'unknown'),
            ]:
                with self.subTest(response=response):
                    self.item=self.service.items.create({**FIELDS,'destination':{'connectionId':'primary','calendarId':'a'},'requestId':str(uuid.uuid4())})
                    op=self.prepare();self.service.claim(self.item['id'],op['id'])
                    result=self.service.execute_claimed(self.item['id'],op['id'])
                    self.assertEqual(result['state'],expected)
                    actions=load('entry_policy').actions(self.service.repository.get_item(self.item['id']))
                    self.assertEqual('submit' in actions, expected in {'failed','cancelled'})
                    if expected=='unknown':
                        with self.assertRaises(CalendarError): self.prepare()
            # A confirmed receipt remains confirmed; changed-event diagnostics are retained.
            response={'state':'confirmed','event':{'eventId':'remote-1','calendarId':'a',**op['payload'],'allDay':False,'recurring':False}}
            with patch.object(self.provider,'reconcile',side_effect=apple.reconcile):
                self.service.reconcile(self.item['id'],op['id'])
                response={'state':'unknown','error':{'code':'event_changed','message':'Changed after saving'}}
                result=self.service.reconcile(self.item['id'],op['id'])
                self.assertEqual(result['state'],'confirmed')
                self.assertEqual(result['verification'],response)
