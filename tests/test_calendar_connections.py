"""Exercise the same use cases with independent providers and accounts."""
import copy,json,tempfile,unittest
from pathlib import Path
from test_calendar import (Services, CalendarService, CalendarStorage, CalendarConnection,
                           CalendarConnections, CalendarError, Provider, FIELDS, ORIGIN)

class FeedProvider(Provider):
    def __init__(self,label):
        super().__init__();self.label=label;self.unavailable=False;self.created=[]
    def events(self,ids,start,end):
        if self.unavailable:raise CalendarError('offline',self.label+' unavailable')
        return {'events':[{'eventId':'remote-1','calendarId':'a',**FIELDS,'notes':'','allDay':False,'recurring':False}], 'errors':[]}
    def create(self,operation):
        self.created.append(operation['target']['connectionId'])
        return super().create(operation)

class ConnectionsTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.services=Services(self.tmp.name)
        self.a,self.b=FeedProvider('A'),FeedProvider('B')
        self.registry=CalendarConnections([CalendarConnection('account-a','provider-one','Work',self.a),CalendarConnection('account-b','provider-two','Home',self.b)])
        self.store=CalendarStorage(self.tmp.name)
        self.service=CalendarService(self.services.drafts,self.store,self.registry)
    def tearDown(self):self.tmp.cleanup()
    def select(self,key):return self.service.select({'connectionId':key,'selectedCalendarIds':['a'],'defaultCalendarId':'a'})
    def test_same_calendar_ids_and_defaults_stay_per_connection(self):
        self.service.connections=CalendarConnections([CalendarConnection('account-a','same-provider','Work',self.a),CalendarConnection('account-b','same-provider','Home',self.b)])
        self.select('account-a')
        self.assertEqual(self.store.connection('account-b')['selectedCalendarIds'],[])
        self.select('account-b')
        self.service.select({'connectionId':'account-a','selectedCalendarIds':[],'defaultCalendarId':''})
        self.assertEqual(self.store.connection('account-b')['defaultCalendarId'],'a')
        self.assertEqual(len(self.service.list_connections()['connections']),2)
    def test_write_routes_to_exact_connection_and_event_links_do_not_leak(self):
        self.select('account-a');self.select('account-b')
        draft=self.services.drafts.create(FIELDS,ORIGIN)[0]
        op=self.service.prepare({'draftId':draft['id'],'revision':1,'target':{'connectionId':'account-b','calendarId':'a'}})
        self.assertEqual(op['provider'],'provider-two');self.assertEqual(op['confirmation']['mode'],'app')
        self.service.claim(op['id']);self.service.execute_claimed(op['id'])
        self.assertEqual(self.a.created,[]);self.assertEqual(self.b.created,['account-b'])
        events=self.service.events('2030-01-01T00:00:00Z','2030-01-04T00:00:00Z')['events']
        self.assertEqual(len(events),2)
        self.assertNotIn('draftId',events[0]);self.assertEqual(events[1]['draftId'],draft['id'])
    def test_one_failed_provider_does_not_hide_another(self):
        self.select('account-a');self.select('account-b');self.a.unavailable=True
        result=self.service.events('2030-01-01T00:00:00Z','2030-01-04T00:00:00Z')
        self.assertEqual([e['connectionId'] for e in result['events']],['account-b'])
        self.assertEqual(result['errors'][0]['connectionId'],'account-a')
    def test_removed_connection_is_not_replaced_by_another(self):
        draft=self.services.drafts.create(FIELDS,ORIGIN)[0]
        op=self.service.prepare({'draftId':draft['id'],'revision':1,'target':{'connectionId':'account-b','calendarId':'a'}})
        self.service.claim(op['id'])
        self.service.connections=CalendarConnections([self.registry.get('account-a')])
        result=self.service.execute_claimed(op['id'])
        self.assertEqual(result['state'],'failed');self.assertEqual(self.a.created,[])
    def test_capability_denial_blocks_write_without_hiding_calendars(self):
        original=self.b.status
        self.b.status=lambda:{**original(),'capabilities':{'read':True,'create':False,'reconcile':False}}
        self.assertEqual(len(self.service.connection('account-b')['calendars']),2)
        draft=self.services.drafts.create(FIELDS,ORIGIN)[0]
        with self.assertRaises(CalendarError):self.service.prepare({'draftId':draft['id'],'revision':1,'target':{'connectionId':'account-b','calendarId':'a'}})
        self.assertEqual(self.b.created,[])
    def test_legacy_preferences_are_read_without_overwriting_or_leaking(self):
        root=Path(self.tmp.name)/'calendar';root.mkdir()
        path=root/'connection.json';raw=json.dumps({'selectedCalendarIds':['legacy'],'defaultCalendarId':'legacy'})
        path.write_text(raw)
        store=CalendarStorage(self.tmp.name,legacy_connection_id='account-a')
        self.assertEqual(store.connection('account-a')['selectedCalendarIds'],['legacy'])
        self.assertEqual(store.connection('account-b')['selectedCalendarIds'],[])
        self.assertEqual(path.read_text(),raw)
        store.save_connection('account-a',{'selectedCalendarIds':[],'defaultCalendarId':''})
        self.assertEqual(store.connection('account-a')['selectedCalendarIds'],[])
        self.assertEqual(path.read_text(),raw)
    def test_unexpected_provider_failure_is_isolated(self):
        self.select('account-a');self.select('account-b')
        def unavailable():raise RuntimeError('private provider diagnostic')
        self.a.status=unavailable
        states=self.service.list_connections()['connections']
        self.assertEqual([s['state'] for s in states],['unavailable','ready'])
        result=self.service.events('2030-01-01T00:00:00Z','2030-01-04T00:00:00Z')
        self.assertEqual(len(result['events']),1)
        self.assertNotIn('private provider diagnostic',str(result))
