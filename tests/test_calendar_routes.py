from __future__ import annotations
import json,sys,tempfile,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock,patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from runtime import load
routes=load('calendar_routes')
try:
 from aiohttp import web
except ImportError:
 web=None

class Request:
 def __init__(self,body=None,**params):self.body=body;self.match_info=params;self.query={}
 async def json(self):return self.body

@unittest.skipUnless(web,'aiohttp required')
class CalendarRouteTest(unittest.IsolatedAsyncioTestCase):
 async def asyncSetUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.ctx=SimpleNamespace(data_dir=Path(self.tmp.name))
 async def asyncTearDown(self):self.tmp.cleanup()
 async def test_nonowner_cannot_request_access_or_start_native_write(self):
  denied=web.json_response({'error':'owner_only'},status=403)
  with patch.object(routes,'_owner',AsyncMock(return_value=denied)),patch.object(routes,'Services') as services:
   for endpoint in [routes.authorize,routes.prepare,routes.execute,routes.item_create,routes.item_edit,routes.item_accept,routes.item_delete,routes.item_restore,routes.preferences_put]:
    result=await endpoint(Request({},operation_id='a'*32),self.ctx)
    self.assertEqual(result.status,403)
   services.assert_not_called()

 async def test_direct_create_route_commits_a_local_event_and_replays(self):
  import uuid
  body={'title':'Direct','start':'2030-01-02T10:00:00+09:00','end':'2030-01-02T11:00:00+09:00','timezone':'Asia/Seoul','destination':{'connectionId':'crew','calendarId':'default'},'requestId':str(uuid.uuid4())}
  with patch.object(routes,'_owner',AsyncMock(return_value=None)),patch.object(load('apple_provider').AppleCalendarProvider,'_request',side_effect=AssertionError('No external call')):
   first=await routes.item_create(Request(body),self.ctx)
   second=await routes.item_create(Request(body),self.ctx)
   item=json.loads(first.text)['item'];self.assertEqual(item['status'],'confirmed')
   self.assertEqual(json.loads(second.text)['item']['id'],item['id'])
   result=await routes.item_edit(Request({**body,'title':'Edited','revision':1},item_id=item['id']),self.ctx)
   self.assertEqual(json.loads(result.text)['item']['title'],'Edited')
   stale=await routes.item_edit(Request({**body,'revision':1},item_id=item['id']),self.ctx)
   self.assertEqual(stale.status,409)
